import { CreateWateringDTO, CreateBulkWateringDTO } from './dtos/create.watering.dto';
import { UpdateWateringDTO } from './dtos/update.watering.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Watering } from 'src/entities/watering.entity';
import { Section } from 'src/entities/section.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class WateringService {
  constructor(
    @InjectRepository(Watering)
    private readonly wateringRepository: Repository<Watering>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async findAll(): Promise<Watering[]> {
    return this.wateringRepository.find({
      relations: [
        'section',
        'section.vegetable',
        'section.sectionPlan',
        'section.sectionPlan.board',
        'section.sectionPlan.board.sole',
        'section.sectionPlan.board.sole.exploitation',
      ],
      order: { watering_date: 'DESC' },
    });
  }

  async findBySection(sectionId: number): Promise<Watering[]> {
    return this.wateringRepository.find({
      where: { section: { id_section: sectionId } },
      order: { watering_date: 'DESC' },
      take: 20,
    });
  }

  async findOne(id: number): Promise<Watering> {
    const watering = await this.wateringRepository.findOne({
      where: { id_watering: id },
      relations: ['section'],
    });
    if (!watering) throw new NotFoundException('Watering not found');
    return watering;
  }

  async create(dto: CreateWateringDTO): Promise<Watering> {
    const section = await this.sectionRepository.findOne({
      where: { id_section: dto.id_section },
    });
    if (!section) throw new NotFoundException('Section not found');

    const watering = this.wateringRepository.create({
      watering_date: new Date(dto.watering_date),
      section,
    });

    return this.wateringRepository.save(watering);
  }

  async createBulk(dto: CreateBulkWateringDTO): Promise<Watering[]> {
    let sectionIds: number[] = dto.section_ids ?? [];

    if (dto.board_id) {
      const sections = await this.sectionRepository
        .createQueryBuilder('section')
        .innerJoin('section.sectionPlan', 'sp')
        .innerJoin('sp.board', 'board')
        .where('board.id_board = :boardId', { boardId: dto.board_id })
        .andWhere('section.section_active = :active', { active: true })
        .select('section.id_section')
        .getMany();
      sectionIds = sections.map((s) => s.id_section);
    }

    if (dto.sole_id) {
      const sections = await this.sectionRepository
        .createQueryBuilder('section')
        .innerJoin('section.sectionPlan', 'sp')
        .innerJoin('sp.board', 'board')
        .innerJoin('board.sole', 'sole')
        .where('sole.id_sole = :soleId', { soleId: dto.sole_id })
        .andWhere('section.section_active = :active', { active: true })
        .select('section.id_section')
        .getMany();
      sectionIds = sections.map((s) => s.id_section);
    }

    if (sectionIds.length === 0) return [];

    const date = new Date(dto.watering_date);
    const waterings = sectionIds.map((id) =>
      this.wateringRepository.create({
        watering_date: date,
        section: { id_section: id },
      }),
    );

    return this.wateringRepository.save(waterings);
  }

  async update(id: number, dto: UpdateWateringDTO): Promise<Watering> {
    const watering = await this.findOne(id);

    if (dto.id_section) {
      const section = await this.sectionRepository.findOne({
        where: { id_section: dto.id_section },
      });
      if (!section) throw new NotFoundException('Section not found');
      watering.section = section;
    }

    if (dto.watering_date !== undefined)
      watering.watering_date = new Date(dto.watering_date as unknown as string);

    return this.wateringRepository.save(watering);
  }

  async remove(id: number): Promise<void> {
    const watering = await this.findOne(id);
    await this.wateringRepository.remove(watering);
  }
}
