import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantStock } from 'src/entities/plant_stock.entity';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Variety } from 'src/entities/variety.entity';
import { Exploitation } from 'src/entities/exploitation.entity';
import { CreatePlantStockDto } from './dtos/create.plant-stock.dto';
import { UpdatePlantStockDto } from './dtos/update.plant-stock.dto';

export interface StockCheckResult {
  ok: boolean;
  remaining: number;
}

@Injectable()
export class PlantStockService {
  constructor(
    @InjectRepository(PlantStock)
    private readonly stockRepository: Repository<PlantStock>,
    @InjectRepository(Vegetable)
    private readonly vegetableRepository: Repository<Vegetable>,
    @InjectRepository(Variety)
    private readonly varietyRepository: Repository<Variety>,
    @InjectRepository(Exploitation)
    private readonly exploitationRepository: Repository<Exploitation>,
  ) {}

  async findAll(exploitationId?: number): Promise<PlantStock[]> {
    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.vegetable', 'vegetable')
      .leftJoinAndSelect('stock.variety', 'variety')
      .leftJoinAndSelect('stock.exploitation', 'exploitation')
      .orderBy('vegetable.vegetable_name', 'ASC');

    if (exploitationId) {
      qb.where('exploitation.id_exploitation = :exploitationId', { exploitationId });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<PlantStock> {
    const stock = await this.stockRepository.findOne({
      where: { id_stock: id },
      relations: ['vegetable', 'variety', 'exploitation'],
    });
    if (!stock) throw new NotFoundException('Entrée de stock introuvable.');
    return stock;
  }

  async create(dto: CreatePlantStockDto): Promise<PlantStock> {
    const vegetable = await this.vegetableRepository.findOne({
      where: { id_vegetable: dto.id_vegetable },
    });
    if (!vegetable) throw new NotFoundException('Légume introuvable.');

    let variety: Variety | null = null;
    if (dto.id_variety) {
      variety = await this.varietyRepository.findOne({ where: { id_variety: dto.id_variety } });
      if (!variety) throw new NotFoundException('Variété introuvable.');
    }

    let exploitation: Exploitation | null = null;
    if (dto.id_exploitation) {
      exploitation = await this.exploitationRepository.findOne({
        where: { id_exploitation: dto.id_exploitation },
      });
      if (!exploitation) throw new NotFoundException('Exploitation introuvable.');
    }

    const stock = this.stockRepository.create({
      quantity: dto.quantity,
      unit: dto.unit ?? 'plants',
      received_date: dto.received_date ? new Date(dto.received_date) : null,
      notes: dto.notes ?? null,
      vegetable,
      variety,
      exploitation,
    });
    return this.stockRepository.save(stock);
  }

  async update(id: number, dto: UpdatePlantStockDto): Promise<PlantStock> {
    const stock = await this.findOne(id);

    if (dto.quantity !== undefined) stock.quantity = dto.quantity;
    if (dto.unit !== undefined) stock.unit = dto.unit;
    if (dto.notes !== undefined) stock.notes = dto.notes ?? null;
    if (dto.received_date !== undefined) {
      stock.received_date = dto.received_date ? new Date(dto.received_date) : null;
    }
    if (dto.id_vegetable !== undefined) {
      const veg = await this.vegetableRepository.findOne({ where: { id_vegetable: dto.id_vegetable } });
      if (!veg) throw new NotFoundException('Légume introuvable.');
      stock.vegetable = veg;
    }
    if (dto.id_variety !== undefined) {
      stock.variety = dto.id_variety
        ? (await this.varietyRepository.findOne({ where: { id_variety: dto.id_variety } }) ?? null)
        : null;
    }

    return this.stockRepository.save(stock);
  }

  async remove(id: number): Promise<void> {
    const stock = await this.findOne(id);
    await this.stockRepository.remove(stock);
  }

  /**
   * Décrémente le stock lors d'une plantation.
   * Retourne { ok: true } si le stock était suffisant, { ok: false, remaining: 0 } sinon.
   * En mode "warning uniquement" : on ne bloque pas, on décrémente quand même s'il reste du stock.
   */
  async decrementStock(
    vegetableId: number,
    varietyId: number | null,
    quantity: number,
    exploitationId?: number,
  ): Promise<StockCheckResult> {
    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoin('stock.vegetable', 'vegetable')
      .leftJoin('stock.variety', 'variety')
      .leftJoin('stock.exploitation', 'exploitation')
      .where('vegetable.id_vegetable = :vegetableId', { vegetableId })
      .andWhere('stock.quantity > 0');

    if (varietyId) {
      qb.andWhere('variety.id_variety = :varietyId', { varietyId });
    }
    if (exploitationId) {
      qb.andWhere('exploitation.id_exploitation = :exploitationId', { exploitationId });
    }

    const entries = await qb.getMany();
    const total = entries.reduce((sum, e) => sum + e.quantity, 0);

    if (total <= 0) {
      return { ok: false, remaining: 0 };
    }

    // Décrémente FIFO à travers les entrées disponibles
    let toDeduct = Math.min(quantity, total);
    for (const entry of entries) {
      if (toDeduct <= 0) break;
      const deduct = Math.min(entry.quantity, toDeduct);
      entry.quantity -= deduct;
      toDeduct -= deduct;
      await this.stockRepository.save(entry);
    }

    return { ok: total >= quantity, remaining: Math.max(0, total - quantity) };
  }
}
