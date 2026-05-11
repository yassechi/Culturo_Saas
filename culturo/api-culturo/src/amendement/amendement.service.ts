import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amended } from '../entities/amended.entity';
import { Amendement } from '../entities/amendement.entity';
import { Board } from '../entities/board.entity';
import { CreateAmendementDTO, CreateBulkAmendementDTO } from './dtos/create.amendement.dto';
import { CreateCatalogueDTO, UpdateCatalogueDTO } from './dtos/catalogue.dto';

@Injectable()
export class AmendedService {
  constructor(
    @InjectRepository(Amended)
    private readonly amendedRepository: Repository<Amended>,
    @InjectRepository(Amendement)
    private readonly amendementRepository: Repository<Amendement>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  // ── Catalogue des produits ────────────────────────────────────────────────

  async findAllCatalogue(): Promise<Amendement[]> {
    return this.amendementRepository.find({ order: { amendment_name: 'ASC' } });
  }

  async findCatalogueById(id: number): Promise<Amendement> {
    const item = await this.amendementRepository.findOne({ where: { id_amendement: id } });
    if (!item) throw new NotFoundException(`Produit id ${id} introuvable`);
    return item;
  }

  async createCatalogue(dto: CreateCatalogueDTO): Promise<Amendement> {
    const item = this.amendementRepository.create({
      amendment_name: dto.amendment_name,
      notice: dto.notice ?? null,
    });
    return this.amendementRepository.save(item);
  }

  async updateCatalogue(id: number, dto: UpdateCatalogueDTO): Promise<Amendement> {
    const item = await this.findCatalogueById(id);
    if (dto.amendment_name !== undefined) item.amendment_name = dto.amendment_name;
    if (dto.notice !== undefined) item.notice = dto.notice ?? null;
    return this.amendementRepository.save(item);
  }

  async removeCatalogue(id: number): Promise<void> {
    const item = await this.findCatalogueById(id);
    await this.amendementRepository.remove(item);
  }

  // ── Applications (amended) ────────────────────────────────────────────────

  async findAll(): Promise<Amended[]> {
    return this.amendedRepository.find({
      relations: [
        'amendement',
        'board',
        'board.sole',
        'board.sole.exploitation',
      ],
      order: { amendment_date: 'DESC' },
    });
  }

  async findByBoard(boardId: number): Promise<Amended[]> {
    return this.amendedRepository.find({
      where: { board: { id_board: boardId } },
      relations: ['amendement'],
      order: { amendment_date: 'DESC' },
      take: 20,
    });
  }

  async findById(id: number): Promise<Amended> {
    const amended = await this.amendedRepository.findOne({
      where: { id_amended: id },
      relations: ['amendement', 'board', 'board.sole', 'board.sole.exploitation'],
    });
    if (!amended) throw new NotFoundException(`Application id ${id} introuvable`);
    return amended;
  }

  async create(dto: CreateAmendementDTO): Promise<Amended> {
    const board = await this.boardRepository.findOne({ where: { id_board: dto.id_board } });
    if (!board) throw new NotFoundException(`Planche id ${dto.id_board} introuvable`);

    const amendement = await this.amendementRepository.findOne({
      where: { id_amendement: dto.id_amendement },
    });
    if (!amendement) throw new NotFoundException(`Produit id ${dto.id_amendement} introuvable`);

    const amended = this.amendedRepository.create({
      amendment_date: dto.amendment_date as unknown as Date,
      quantity: dto.quantity ?? null,
      quantity_unit: dto.quantity_unit ?? null,
      description: dto.description ?? null,
      board,
      amendement,
    });

    return this.amendedRepository.save(amended);
  }

  async createBulk(dto: CreateBulkAmendementDTO): Promise<Amended[]> {
    const amendement = await this.amendementRepository.findOne({
      where: { id_amendement: dto.id_amendement },
    });
    if (!amendement) throw new NotFoundException(`Produit id ${dto.id_amendement} introuvable`);

    const boards = await this.boardRepository.find({
      where: { sole: { id_sole: dto.id_sole }, board_active: true },
    });
    if (boards.length === 0) return [];

    const date = new Date(dto.amendment_date);
    const records = boards.map((board) =>
      this.amendedRepository.create({
        amendment_date: date,
        quantity: dto.quantity ?? null,
        quantity_unit: dto.quantity_unit ?? null,
        description: dto.description ?? null,
        board,
        amendement,
      }),
    );

    return this.amendedRepository.save(records);
  }

  async update(id: number, dto: Partial<CreateAmendementDTO>): Promise<Amended> {
    const amended = await this.findById(id);

    if (dto.id_board) {
      const board = await this.boardRepository.findOne({ where: { id_board: dto.id_board } });
      if (!board) throw new NotFoundException(`Planche id ${dto.id_board} introuvable`);
      amended.board = board;
    }

    if (dto.id_amendement) {
      const amendement = await this.amendementRepository.findOne({
        where: { id_amendement: dto.id_amendement },
      });
      if (!amendement) throw new NotFoundException(`Produit id ${dto.id_amendement} introuvable`);
      amended.amendement = amendement;
    }

    if (dto.amendment_date !== undefined) amended.amendment_date = new Date(dto.amendment_date);
    if (dto.quantity !== undefined) amended.quantity = dto.quantity ?? null;
    if (dto.quantity_unit !== undefined) amended.quantity_unit = dto.quantity_unit ?? null;
    if (dto.description !== undefined) amended.description = dto.description ?? null;

    return this.amendedRepository.save(amended);
  }

  async remove(id: number): Promise<void> {
    const amended = await this.findById(id);
    await this.amendedRepository.remove(amended);
  }
}
