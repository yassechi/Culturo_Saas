import { CreateTreatedDTO } from './dtos/create.treatment.dto';
import { UpdateTreatedDTO } from './dtos/update.treatment.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Treatment } from 'src/entities/treatment.entity';
import { Treated } from 'src/entities/treated.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from 'src/entities/board.entity';
import { Repository } from 'typeorm';

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

  /**
   *
   * @returns
   */
  async findAll(): Promise<Treated[]> {
    return await this.treatedRepository.find({
      relations: ['board', 'treatment'],
    });
  }

  /**
   *
   * @param id
   * @returns
   */
  async findOne(id: number): Promise<Treated> {
    const treated = await this.treatedRepository.findOne({
      where: { id_treated: id },
      relations: ['board', 'treatment'],
    });
    if (!treated) throw new NotFoundException('Treated record not found');
    return treated;
  }

  /**
   *
   * @param dto
   * @returns
   */
  async create(dto: CreateTreatedDTO): Promise<Treated> {
    const board = await this.boardRepository.findOne({
      where: { id_board: dto.id_board },
    });
    if (!board) throw new NotFoundException('Board not found');

    const treatment = await this.treatmentRepository.findOne({
      where: { id_treatment: dto.id_treatment },
    });
    if (!treatment) throw new NotFoundException('Treatment not found');

    const treated = this.treatedRepository.create({
      treatment_date: dto.treatment_date,
      treatment_quantity: dto.treatment_quantity,
      treatment_unit: dto.treatment_unit,
      board,
      treatment,
    });

    return await this.treatedRepository.save(treated);
  }

  /**
   *
   * @param id
   * @param dto
   * @returns
   */
  async update(id: number, dto: UpdateTreatedDTO): Promise<Treated> {
    const treated = await this.findOne(id);

    if (dto.boardId) {
      const board = await this.boardRepository.findOne({
        where: { id_board: dto.boardId },
      });
      if (!board) throw new NotFoundException('Board not found');
      treated.board = board;
    }

    if (dto.treatmentId) {
      const treatment = await this.treatmentRepository.findOne({
        where: { id_treatment: dto.treatmentId },
      });
      if (!treatment) throw new NotFoundException('Treatment not found');
      treated.treatment = treatment;
    }

    if (dto.treatment_date !== undefined)
      treated.treatment_date = dto.treatment_date;
    if (dto.treatment_quantity !== undefined)
      treated.treatment_quantity = dto.treatment_quantity;
    if (dto.treatment_unit !== undefined)
      treated.treatment_unit = dto.treatment_unit;

    return await this.treatedRepository.save(treated);
  }

  /**
   *
   * @param id
   */
  async remove(id: number): Promise<void> {
    const treated = await this.findOne(id);
    await this.treatedRepository.remove(treated);
  }
}
