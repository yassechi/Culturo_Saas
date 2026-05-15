import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from 'src/entities/supplier.entity';
import { CreateSupplierDto } from './dtos/create.supplier.dto';
import { UpdateSupplierDto } from './dtos/update.supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepository.find({ order: { supplier_name: 'ASC' } });
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id_supplier: id },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      supplier_name: dto.supplier_name,
      contact_email: dto.contact_email ?? null,
      contact_phone: dto.contact_phone ?? null,
      website: dto.website ?? null,
      supplier_active: dto.supplier_active ?? true,
    });
    return this.supplierRepository.save(supplier);
  }

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    if (dto.supplier_name !== undefined) supplier.supplier_name = dto.supplier_name;
    if (dto.contact_email !== undefined) supplier.contact_email = dto.contact_email ?? null;
    if (dto.contact_phone !== undefined) supplier.contact_phone = dto.contact_phone ?? null;
    if (dto.website !== undefined) supplier.website = dto.website ?? null;
    if (dto.supplier_active !== undefined) supplier.supplier_active = dto.supplier_active;
    return this.supplierRepository.save(supplier);
  }

  async remove(id: number): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.remove(supplier);
  }
}
