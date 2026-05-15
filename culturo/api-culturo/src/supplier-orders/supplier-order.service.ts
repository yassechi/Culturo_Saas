import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierOrder } from 'src/entities/supplier_order.entity';
import { SupplierOrderItem } from 'src/entities/supplier_order_item.entity';
import { Supplier } from 'src/entities/supplier.entity';
import { User_ } from 'src/entities/user_.entity';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Variety } from 'src/entities/variety.entity';
import { PlantStockService } from 'src/plant-stock/plant-stock.service';
import { EmailService } from 'src/email/email.service';
import { AppSettingsService } from 'src/app-settings/app-settings.service';
import {
  CreateSupplierOrderDto,
  CreateSupplierOrderItemDto,
} from './dtos/create.supplier-order.dto';
import { UpdateSupplierOrderDto } from './dtos/update.supplier-order.dto';

@Injectable()
export class SupplierOrderService {
  constructor(
    @InjectRepository(SupplierOrder)
    private readonly orderRepository: Repository<SupplierOrder>,
    @InjectRepository(SupplierOrderItem)
    private readonly itemRepository: Repository<SupplierOrderItem>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(User_)
    private readonly userRepository: Repository<User_>,
    @InjectRepository(Vegetable)
    private readonly vegetableRepository: Repository<Vegetable>,
    @InjectRepository(Variety)
    private readonly varietyRepository: Repository<Variety>,
    private readonly plantStockService: PlantStockService,
    private readonly emailService: EmailService,
    private readonly settingsService: AppSettingsService,
  ) {}

  private async loadOrder(id: number): Promise<SupplierOrder> {
    const order = await this.orderRepository.findOne({
      where: { id_supplier_order: id },
      relations: ['supplier', 'user_', 'items', 'items.vegetable', 'items.variety'],
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async findAll(): Promise<SupplierOrder[]> {
    return this.orderRepository.find({
      relations: ['supplier', 'user_', 'items', 'items.vegetable', 'items.variety'],
      order: { order_date: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SupplierOrder> {
    return this.loadOrder(id);
  }

  async create(dto: CreateSupplierOrderDto): Promise<SupplierOrder> {
    const supplier = await this.supplierRepository.findOne({
      where: { id_supplier: dto.id_supplier },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');

    const user = await this.userRepository.findOne({ where: { id_user: dto.id_user } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const order = this.orderRepository.create({
      status: 'draft',
      order_date: new Date(dto.order_date),
      expected_date: dto.expected_date ? new Date(dto.expected_date) : null,
      notes: dto.notes ?? null,
      supplier,
      user_: user,
    });
    const saved = await this.orderRepository.save(order);

    if (dto.items?.length) {
      for (const itemDto of dto.items) {
        await this.addItem(saved.id_supplier_order, itemDto);
      }
    }

    return this.loadOrder(saved.id_supplier_order);
  }

  async update(id: number, dto: UpdateSupplierOrderDto): Promise<SupplierOrder> {
    const order = await this.loadOrder(id);

    if (dto.status) {
      if (order.status === 'received' || order.status === 'cancelled') {
        throw new BadRequestException('Impossible de modifier une commande déjà reçue ou annulée.');
      }
      order.status = dto.status;

      // Quand on marque "sent" : récap à l'utilisateur + bon de commande au fournisseur
      if (dto.status === 'sent') {
        const tvaRateStr = await this.settingsService.get('tva_rate');
        const tvaRate = parseFloat(tvaRateStr) || 0;
        const contactEmail = await this.settingsService.get('contact_email');

        // Récap interne → utilisateur
        this.emailService.sendSupplierOrderSentEmail(
          {
            email: order.user_.email,
            user_first_name: order.user_.user_first_name,
            user_last_name: order.user_.user_last_name,
          },
          order,
          tvaRate,
        ).catch(err => console.error(`[SupplierOrder] Erreur email récap #${id}:`, err));

        // Bon de commande → fournisseur (uniquement s'il a un email)
        if (order.supplier?.contact_email) {
          this.emailService.sendSupplierOrderToSupplier(
            order.supplier.contact_email,
            order,
            tvaRate,
            contactEmail,
          ).catch(err => console.error(`[SupplierOrder] Erreur email fournisseur #${id}:`, err));
        }
      }

      // Quand on marque "received", on incrémente le stock automatiquement
      if (dto.status === 'received') {
        console.log(`[SupplierOrder] Réception commande #${id} — ${order.items.length} article(s)`);
        for (const item of order.items) {
          const qtyReceived = item.quantity_received > 0 ? item.quantity_received : item.quantity_ordered;
          console.log(`[SupplierOrder] Création stock: vegetable=${item.vegetable?.id_vegetable}, qty=${qtyReceived}`);
          try {
            await this.plantStockService.create({
              id_vegetable: item.vegetable.id_vegetable,
              id_variety: item.variety?.id_variety ?? undefined,
              quantity: qtyReceived,
              unit: item.unit ?? 'plants',
              received_date: new Date().toISOString().split('T')[0],
              notes: `Commande #${id} — ${order.supplier?.supplier_name ?? ''}`,
            });
            item.quantity_received = qtyReceived;
            await this.itemRepository.save(item);
            console.log(`[SupplierOrder] Stock créé OK pour item #${item.id_item}`);
          } catch (err) {
            console.error(`[SupplierOrder] Erreur création stock item #${item.id_item}:`, err);
            // On continue malgré l'erreur pour traiter les autres articles
          }
        }
      }
    }

    if (dto.order_date) order.order_date = new Date(dto.order_date);
    if (dto.expected_date !== undefined) {
      order.expected_date = dto.expected_date ? new Date(dto.expected_date) : null;
    }
    if (dto.notes !== undefined) order.notes = dto.notes ?? null;

    await this.orderRepository.save(order);
    return this.loadOrder(id);
  }

  async addItem(orderId: number, dto: CreateSupplierOrderItemDto): Promise<SupplierOrderItem> {
    const order = await this.orderRepository.findOne({ where: { id_supplier_order: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');

    const vegetable = await this.vegetableRepository.findOne({ where: { id_vegetable: dto.id_vegetable } });
    if (!vegetable) throw new NotFoundException('Légume introuvable.');

    let variety: Variety | null = null;
    if (dto.id_variety) {
      variety = await this.varietyRepository.findOne({ where: { id_variety: dto.id_variety } });
    }

    const item = this.itemRepository.create({
      quantity_ordered: dto.quantity_ordered,
      quantity_received: 0,
      unit: dto.unit ?? 'plants',
      unit_price: dto.unit_price ?? null,
      vegetable,
      variety,
      supplierOrder: order,
    });
    return this.itemRepository.save(item);
  }

  async removeItem(itemId: number): Promise<void> {
    const item = await this.itemRepository.findOne({ where: { id_item: itemId } });
    if (!item) throw new NotFoundException('Ligne de commande introuvable.');
    await this.itemRepository.remove(item);
  }

  async remove(id: number): Promise<void> {
    const order = await this.loadOrder(id);
    if (order.status === 'received') {
      throw new BadRequestException('Impossible de supprimer une commande déjà reçue.');
    }
    await this.orderRepository.remove(order);
  }
}
