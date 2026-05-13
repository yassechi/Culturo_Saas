import { Family_importance } from 'src/entities/family_importance.entity';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateFamilyDTO } from './dtos/create.family.dto';
import { UpdateFamilyDTO } from './dtos/update.family.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Family } from 'src/entities/family.entity';
import { FamilyIncompatibility } from 'src/entities/family_incompatibility.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(Family_importance)
    private readonly importanceRepository: Repository<Family_importance>,
    @InjectRepository(FamilyIncompatibility)
    private readonly incompatibilityRepository: Repository<FamilyIncompatibility>,
  ) {}

  /**
   *
   * @returns
   */
  public async getAllFamilies() {
    return await this.familyRepository.find({
      relations: ['family_importance', 'vegetables'],
    });
  }

  /**
   *
   * @returns
   */
  public async getAllImportance() {
    return await this.importanceRepository.find();
  }

  /**
   *
   * @param id
   * @returns
   */
  async getFamilyById(id: number): Promise<Family | null> {
    return this.familyRepository.findOne({
      where: { id_family: id },
      relations: ['family_importance', 'vegetables'],
    });
  }

  /**
   *
   * @param payload
   * @returns
   */
  async createFamily(payload: CreateFamilyDTO): Promise<Family> {
    const { family_name, id_family_importance } = payload;

    const importance = await this.importanceRepository.findOne({
      where: { id_family_importance },
    });

    if (!importance) {
      throw new NotFoundException(
        `Family importance with id ${id_family_importance} not found`,
      );
    }

    const family = this.familyRepository.create({
      family_name,
      family_importance: importance,
    });

    return await this.familyRepository.save(family);
  }

  /**
   *
   * @param payload
   * @returns
   */
  async updateFamily(payload: UpdateFamilyDTO): Promise<Family> {
    const { id_family, id_family_importance, ...rest } = payload;

    const family = await this.familyRepository.findOne({
      where: { id_family },
    });

    if (!family) {
      throw new NotFoundException(`Family with id ${id_family} not found`);
    }

    // Changer importance si demandé
    if (id_family_importance) {
      const importance = await this.importanceRepository.findOne({
        where: { id_family_importance },
      });

      if (!importance) {
        throw new NotFoundException(
          `Family importance with id ${id_family_importance} not found`,
        );
      }

      family.family_importance = importance;
    }

    Object.assign(family, rest);
    return await this.familyRepository.save(family);
  }

  /**
   *
   * @param id
   * @returns
   */
  async delFamily(id: number): Promise<{ msg: string }> {
    const family = await this.familyRepository.findOne({
      where: { id_family: id },
    });

    if (!family) {
      throw new NotFoundException('Famille introuvable');
    }

    await this.familyRepository.delete({ id_family: id });

    return { msg: 'Famille supprimée avec succès' };
  }

  async getAllIncompatibilities(): Promise<FamilyIncompatibility[]> {
    return this.incompatibilityRepository.find();
  }

  async createIncompatibility(
    familyAId: number,
    familyBId: number,
    reason: string | null,
  ): Promise<FamilyIncompatibility> {
    if (familyAId === familyBId) {
      throw new BadRequestException('Une famille ne peut pas être incompatible avec elle-même.');
    }

    const [a, b] = await Promise.all([
      this.familyRepository.findOne({ where: { id_family: familyAId } }),
      this.familyRepository.findOne({ where: { id_family: familyBId } }),
    ]);

    if (!a) throw new NotFoundException(`Famille ${familyAId} introuvable.`);
    if (!b) throw new NotFoundException(`Famille ${familyBId} introuvable.`);

    const existing = await this.incompatibilityRepository.findOne({
      where: [
        { family_a_id: familyAId, family_b_id: familyBId },
        { family_a_id: familyBId, family_b_id: familyAId },
      ],
    });

    if (existing) {
      throw new BadRequestException('Cette incompatibilité existe déjà.');
    }

    const incompat = this.incompatibilityRepository.create({
      family_a: a,
      family_a_id: familyAId,
      family_b: b,
      family_b_id: familyBId,
      reason: reason?.trim() || null,
    });

    return this.incompatibilityRepository.save(incompat);
  }

  async deleteIncompatibility(id: number): Promise<{ msg: string }> {
    const incompat = await this.incompatibilityRepository.findOne({ where: { id } });
    if (!incompat) throw new NotFoundException(`Incompatibilité ${id} introuvable.`);
    await this.incompatibilityRepository.delete({ id });
    return { msg: 'Incompatibilité supprimée.' };
  }
}
