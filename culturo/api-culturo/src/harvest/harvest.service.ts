import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHarvestDTO } from './dtos/create.harvest.dto';
import { UpdateHarvestDTO } from './dtos/update.harvest.dto';
import { Harvest } from 'src/entities/harvest.entity';
import { Section } from 'src/entities/section.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User_ } from 'src/entities/user_.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HarvestService {
    constructor(
        @InjectRepository(Harvest)
        private readonly harvestRepository: Repository<Harvest>,

        @InjectRepository(User_)
        private readonly userRepository: Repository<User_>,

        @InjectRepository(Section)
        private readonly sectionRepository: Repository<Section>,
    ) {}

    /**
     * Récupère toutes les récoltes avec leurs relations.
     * @returns Liste des Harvests.
     */
    async findAll(): Promise<Harvest[]> {
        return this.harvestRepository.find({ relations: ['user_', 'section'] });
    }

    /**
     * Récupère une récolte par son ID.
     * @param id ID de la récolte.
     * @returns L'entité Harvest.
     */
    async findOne(id: number): Promise<Harvest> {
        const harvest = await this.harvestRepository.findOne({
            where: { id_harvest: id },
            relations: ['user_', 'section'],
        });
        if (!harvest) throw new NotFoundException('Harvest not found');
        return harvest;
    }

    /**
     * Crée une nouvelle récolte, met à jour la section associée (section_active = FALSE et end_date = harvest_date).
     * * @param dto Les données de la récolte à créer.
     * @returns L'entité Harvest créée.
     */
    async create(dto: CreateHarvestDTO): Promise<Harvest> {
        // --- 1. Vérification des dépendances ---
        
        const user = await this.userRepository.findOne({
            where: { id_user: dto.userId },
        });
        if (!user) throw new NotFoundException('User not found');

        const section = await this.sectionRepository.findOne({
            where: { id_section: dto.id_section },
        });
        if (!section) throw new NotFoundException('Section not found');

        // --- 2. Mise à jour de la Section ---
        
        // Si la section est encore active, nous la désactivons lors de la récolte
        if (section.section_active !== false) {
            
            // Mise à jour du statut de la section
            section.section_active = false;
            
            // CRUCIAL POUR LA RÈGLE 1 (ROTATION): Mettre à jour la date de fin avec la date de récolte.
            // Cela définit le point de départ du calcul des 5 ans.
            section.end_date = dto.harvest_date; 

            // Sauvegarde de la Section mise à jour
            await this.sectionRepository.save(section);
        }
        
        // --- 3. Création de l'entité Harvest ---

        const harvest = this.harvestRepository.create({
            harvest_date: dto.harvest_date,
            quantity: dto.quantity,
            quantity_unit: dto.quantity_unit,
            user_: user,
            section: section, // Utilise l'objet section potentiellement mis à jour
        });

        // 4. Sauvegarde de la Récolte
        return this.harvestRepository.save(harvest);
    }

    /**
     * Met à jour une récolte existante.
     * @param id ID de la récolte.
     * @param dto Les données à mettre à jour.
     * @returns L'entité Harvest mise à jour.
     */
    async update(id: number, dto: UpdateHarvestDTO): Promise<Harvest> {
        const harvest = await this.findOne(id);

        if (dto.id_user) {
            const user = await this.userRepository.findOne({
                where: { id_user: dto.id_user },
            });
            if (!user) throw new NotFoundException('User not found');
            harvest.user_ = user;
        }

        if (dto.id_section) {
            const section = await this.sectionRepository.findOne({
                where: { id_section: dto.id_section },
            });
            if (!section) throw new NotFoundException('Section not found');
            harvest.section = section;
        }

        Object.assign(harvest, dto);
        return this.harvestRepository.save(harvest);
    }

    /**
     * Supprime une récolte.
     * @param id ID de la récolte.
     */
    async remove(id: number): Promise<void> {
        const harvest = await this.findOne(id);
        await this.harvestRepository.remove(harvest);
    }
}