import { CreateAmendementDTO } from './dtos/create.amendement.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Amended } from '../entities/amended.entity';
import { Board } from '../entities/board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AmendedService {
  constructor(
    @InjectRepository(Amended)
    private readonly amendedRepository: Repository<Amended>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  /**
   * Retourne tous les amendements
   */
  public async getAllAmendements(): Promise<Amended[]> {
    return this.amendedRepository.find({
      relations: ['board'], // uniquement la relation board
    });
  }

  /**
   * Retourne un amendement par ID
   */
  public async getAmendedById(id: number): Promise<Amended> {
    const amended = await this.amendedRepository.findOne({
      where: { id_amended: id },
      relations: ['board'],
    });

    if (!amended) {
      throw new NotFoundException(`Amended with id ${id} not found`);
    }

    return amended;
  }

  /**
   * Création d’un nouvel amendement
   */
  /**
 * Création d'un nouvel amendement
 */
public async createAmended(payload: CreateAmendementDTO): Promise<Amended> {
  const { amendment_date, title, description, id_board } = payload;

  let board: Board | null = null;

  // Si un id_board est fourni, on vérifie qu'il existe
  if (id_board) {
    const boardIdNumber = Number(id_board);

    board = await this.boardRepository.findOne({
      where: { id_board: boardIdNumber },
    });

    if (!board) {
      throw new NotFoundException(
        `Board avec l'id ${boardIdNumber} introuvable`
      );
    }
  }

  const amended = this.amendedRepository.create({
    amendment_date,
    title,
    description,
    board,
    amendement: null, // Aussi null par défaut
  });

  return this.amendedRepository.save(amended);
}

  /**
   * update d’un  amendement
   */
  public async updateAmended(
    id: number,
    payload: Partial<CreateAmendementDTO>,
  ): Promise<Amended> {
    const amended = await this.getAmendedById(id);

    if (payload.id_board) {
      const boardIdNumber = Number(payload.id_board);

      const board = await this.boardRepository.findOne({
        where: { id_board: boardIdNumber },
      });
      if (!board)
        throw new NotFoundException(`Board with id ${boardIdNumber} not found`);
      amended.board = board;
    }

    Object.assign(amended, payload);

    return this.amendedRepository.save(amended);
  }

  /**
   * Suppression d’un amendement
   */
  public async deleteAmended(id: number): Promise<void> {
    const result = await this.amendedRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Amended with id ${id} not found`);
    }
  }
}
