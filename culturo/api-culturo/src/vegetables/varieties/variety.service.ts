import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Variety } from 'src/entities/variety.entity';
import { Repository } from 'typeorm';
import { CreateVarietyDTO } from './dtos/create.vartiety.dto';
import { UpdateVarietyDTO } from './dtos/update.variety.dto';

@Injectable()
export class VarietyService {
  constructor(
    @InjectRepository(Variety)
    private readonly varietyRepository: Repository<Variety>,

    @InjectRepository(Vegetable)
    private readonly vegetableRepository: Repository<Vegetable>,
  ) {}

  /**
   * Récupère toutes les variétés d'un légume par son ID
   */
  async geteAllVarietiesByVegetableId(vegetableId: number): Promise<Variety[]> {
    return this.varietyRepository.find({
      where: {
        vegetable: {
          id_vegetable: vegetableId,
        },
      },
      relations: ['vegetable'],
    });
  }

  /**
   * Récupère une variété par son ID
   * CORRECTION: Utilise findOne au lieu de find
   */
  async getVarietyById(id: number): Promise<Variety> {
    const variety = await this.varietyRepository.findOne({
      where: { id_variety: id },
      relations: ['vegetable'],
    });

    if (!variety) {
      throw new NotFoundException(`Variety with ID ${id} not found`);
    }

    return variety;
  }

  /**
   * Création d'une variété
   */
  async createvariety(payload: CreateVarietyDTO): Promise<Variety> {
    // Vérifier si le légume existe
    const vegetable = await this.vegetableRepository.findOne({
      where: { id_vegetable: payload.id_vegetable },
    });

    if (!vegetable) {
      throw new NotFoundException(
        `Vegetable with ID ${payload.id_vegetable} not found`,
      );
    }

    // Créer la variété avec son nom
    const variety = this.varietyRepository.create({
      variety_name: payload.variety_name,
      vegetable,
    });

    return this.varietyRepository.save(variety);
  }

  /**
   * Mise à jour d'une variété
   */
  async updateVariety(payload: UpdateVarietyDTO): Promise<Variety> {
    // Trouver la variété
    const variety = await this.varietyRepository.findOne({
      where: { id_variety: payload.id_variety },
      relations: ['vegetable'],
    });

    if (!variety) {
      throw new NotFoundException(
        `Variety with ID ${payload.id_variety} not found`,
      );
    }

    // Mettre à jour le nom si fourni
    if (payload.variety_name) {
      variety.variety_name = payload.variety_name;
    }

    // Si un nouveau légume est spécifié
    if (payload.id_vegetable && payload.id_vegetable !== variety.vegetable.id_vegetable) {
      const newVegetable = await this.vegetableRepository.findOne({
        where: { id_vegetable: payload.id_vegetable },
      });

      if (!newVegetable) {
        throw new NotFoundException(
          `Vegetable with ID ${payload.id_vegetable} not found`,
        );
      }

      variety.vegetable = newVegetable;
    }

    // Sauvegarder
    return this.varietyRepository.save(variety);
  }

  /**
   * Suppression d'une variété
   */
  async delVariety(id: number): Promise<void> {
    const variety = await this.varietyRepository.findOne({
      where: { id_variety: id },
    });

    if (!variety) {
      throw new NotFoundException(`Variety with ID ${id} not found`);
    }

    await this.varietyRepository.delete({ id_variety: id });
  }

  /**
   * Récupère toutes les variétés d'un légume
   */
  async getVarietiesVegetable(id: number): Promise<Variety[]> {
    // Vérifier que l'ID est valide
    if (!id || isNaN(id)) {
      throw new NotFoundException(`Invalid vegetable ID: ${id}`);
    }

    const vegetable = await this.vegetableRepository.findOne({
      where: { id_vegetable: id },
      relations: ['varieties'],
    });

    if (!vegetable) {
      throw new NotFoundException(`Vegetable with ID ${id} not found`);
    }

    return vegetable.varieties;
  }
}