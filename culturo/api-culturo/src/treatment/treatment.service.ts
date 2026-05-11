import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from 'src/entities/treatment.entity';
import { Treated } from 'src/entities/treated.entity';
import { Board } from 'src/entities/board.entity';
import {
  CreateTreatedDTO,
  CreateBulkTreatedDTO,
  CreateTreatmentCatalogueDTO,
  UpdateTreatmentCatalogueDTO,
} from './dtos/create.treatment.dto';

@Injectable()
export class TreatedService {
  constructor(
    @InjectRepository(Treated)
    private readonly treatedRepository: Repository<Treated>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
  ) {}

  // ── Catalogue ─────────────────────────────────────────────────────────────

  async findAllCatalogue(): Promise<Treatment[]> {
    return this.treatmentRepository.find({ order: { treatment_name: 'ASC' } });
  }

  async findCatalogueById(id: number): Promise<Treatment> {
    const item = await this.treatmentRepository.findOne({ where: { id_treatment: id } });
    if (!item) throw new NotFoundException(`Produit id ${id} introuvable`);
    return item;
  }

  async createCatalogue(dto: CreateTreatmentCatalogueDTO): Promise<Treatment> {
    const item = this.treatmentRepository.create({
      treatment_name: dto.treatment_name,
      notice: dto.notice ?? null,
    });
    return this.treatmentRepository.save(item);
  }

  async updateCatalogue(id: number, dto: UpdateTreatmentCatalogueDTO): Promise<Treatment> {
    const item = await this.findCatalogueById(id);
    if (dto.treatment_name !== undefined) item.treatment_name = dto.treatment_name;
    if (dto.notice !== undefined) item.notice = dto.notice ?? null;
    return this.treatmentRepository.save(item);
  }

  async removeCatalogue(id: number): Promise<void> {
    const item = await this.findCatalogueById(id);
    await this.treatmentRepository.remove(item);
  }

  // ── Applications ──────────────────────────────────────────────────────────

  async findAll(): Promise<Treated[]> {
    return this.treatedRepository.find({
      relations: [
        'treatment',
        'board',
        'board.sole',
        'board.sole.exploitation',
      ],
      order: { treatment_date: 'DESC' },
    });
  }

  async findByBoard(boardId: number): Promise<Treated[]> {
    return this.treatedRepository.find({
      where: { board: { id_board: boardId } },
      relations: ['treatment'],
      order: { treatment_date: 'DESC' },
      take: 20,
    });
  }

  async findOne(id: number): Promise<Treated> {
    const treated = await this.treatedRepository.findOne({
      where: { id_treated: id },
      relations: ['treatment', 'board', 'board.sole', 'board.sole.exploitation'],
    });
    if (!treated) throw new NotFoundException('Traitement non trouvé');
    return treated;
  }

  async create(dto: CreateTreatedDTO): Promise<Treated> {
    const board = await this.boardRepository.findOne({ where: { id_board: dto.id_board } });
    if (!board) throw new NotFoundException(`Planche id ${dto.id_board} introuvable`);

    const treatment = await this.treatmentRepository.findOne({ where: { id_treatment: dto.id_treatment } });
    if (!treatment) throw new NotFoundException(`Produit id ${dto.id_treatment} introuvable`);

    const treated = this.treatedRepository.create({
      treatment_date: dto.treatment_date as unknown as Date,
      treatment_quantity: dto.treatment_quantity ?? null,
      treatment_unit: dto.treatment_unit ?? null,
      description: dto.description ?? null,
      board,
      treatment,
    });

    return this.treatedRepository.save(treated);
  }

  async createBulk(dto: CreateBulkTreatedDTO): Promise<Treated[]> {
    const treatment = await this.treatmentRepository.findOne({ where: { id_treatment: dto.id_treatment } });
    if (!treatment) throw new NotFoundException(`Produit id ${dto.id_treatment} introuvable`);

    const boards = await this.boardRepository.find({
      where: { sole: { id_sole: dto.id_sole }, board_active: true },
    });
    if (boards.length === 0) return [];

    const records = boards.map((board) =>
      this.treatedRepository.create({
        treatment_date: dto.treatment_date as unknown as Date,
        treatment_quantity: dto.treatment_quantity ?? null,
        treatment_unit: dto.treatment_unit ?? null,
        description: dto.description ?? null,
        board,
        treatment,
      }),
    );

    return this.treatedRepository.save(records);
  }

  async remove(id: number): Promise<void> {
    const treated = await this.findOne(id);
    await this.treatedRepository.remove(treated);
  }
}
