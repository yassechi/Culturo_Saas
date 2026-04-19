import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Family } from 'src/entities/family.entity';
import { Variety } from 'src/entities/variety.entity';
import { CreateVegetableDTO } from './dtos/create.vegetable.dto';
import { UpdateVegetableDTO } from './dtos/update.vegetable.dto';

@Injectable()
export class VegetableService {
  constructor(
    @InjectRepository(Vegetable)
    private readonly vegetableRepository: Repository<Vegetable>,

    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,

    @InjectRepository(Variety)
    private readonly varietyRepository: Repository<Variety>,
  ) {}

  /** Récupère tous les légumes avec familles et variétés */
  async getAllVegetables() {
    return this.vegetableRepository.find({
      relations: ['family', 'varieties', 'family.family_importance'],
    });
  }

  /** Récupère un légume par ID avec familles et variétés */
  async getVegetableById(id: number) {
    const vegetable = await this.vegetableRepository.findOne({
      where: { id_vegetable: id },
      relations: ['family', 'varieties', 'family.family_importance'],
    });

    if (!vegetable) throw new NotFoundException('Vegetable not found');
    return vegetable;
  }

  /** Crée un légume sans toucher aux sections */
  async createVegetable(payload: CreateVegetableDTO) {
    const family = await this.familyRepository.findOne({
      where: { id_family: payload.id_family },
    });
    if (!family) throw new NotFoundException('Family not found');

    const vegetable = this.vegetableRepository.create({
      ...payload,
      family,
    });

    const savedVegetable = await this.vegetableRepository.save(vegetable);

    // Crée les variétés si présentes
    if (payload.varieties && payload.varieties.length > 0) {
      const varietiesEntities = payload.varieties.map(v => {
        const variety = new Variety();
        variety.variety_name = v.variety_name;
        variety.vegetable = savedVegetable;
        return variety;
      });
      await this.varietyRepository.save(varietiesEntities);
    }

    return this.vegetableRepository.findOne({
      where: { id_vegetable: savedVegetable.id_vegetable },
      relations: ['family', 'varieties'], // PAS de sections
    });
  }

  /** Met à jour un légume existant */
  async updateVegetable(payload: UpdateVegetableDTO) {
    const vegetable = await this.vegetableRepository.findOne({
      where: { id_vegetable: payload.id_vegetable },
    });
    if (!vegetable) throw new NotFoundException('Vegetable not found');

    if (payload.id_family) {
      const family = await this.familyRepository.findOne({
        where: { id_family: payload.id_family },
      });
      if (!family) throw new NotFoundException('Family not found');
      vegetable.family = family;
    }

    Object.assign(vegetable, payload);
    return this.vegetableRepository.save(vegetable);
  }

  /** Supprime un légume */
  async delVegetable(id: number) {
    const vegetable = await this.vegetableRepository.findOne({
      where: { id_vegetable: id },
    });
    if (!vegetable) throw new NotFoundException('Vegetable not found');

    await this.vegetableRepository.delete({ id_vegetable: id });
    return { msg: 'Vegetable deleted successfully' };
  }

  /** Récupère les variétés d’un légume */
  async getVarietiesVegetable(id: number) {
    const veg = await this.vegetableRepository.findOne({
      where: { id_vegetable: id },
      relations: ['varieties'],
    });

    if (!veg) throw new NotFoundException(`Vegetable with ID ${id} not found`);
    return veg.varieties;
  }
}
