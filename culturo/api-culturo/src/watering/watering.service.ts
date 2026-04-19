import { CreateWateringDTO } from './dtos/create.watering.dto';
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

  /**
   *
   * @returns
   */
  async findAll(): Promise<Watering[]> {
    return await this.wateringRepository.find({ relations: ['section'] });
  }

  /**
   *
   * @param id
   * @returns
   */
  async findOne(id: number): Promise<Watering> {
    const watering = await this.wateringRepository.findOne({
      where: { id_watering: id },
      relations: ['section'],
    });
    if (!watering) throw new NotFoundException('Watering not found');
    return watering;
  }

  /**
   *
   * @param dto
   * @returns
   */
  async create(dto: CreateWateringDTO): Promise<Watering> {
    const section = await this.sectionRepository.findOne({
      where: { id_section: dto.id_section },
    });
    if (!section) throw new NotFoundException('Section not found');

    const watering = this.wateringRepository.create({
      watering_date: dto.watering_date,
      section,
    });

    return await this.wateringRepository.save(watering);
  }

  /**
   *
   * @param id
   * @param dto
   * @returns
   */
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
      watering.watering_date = dto.watering_date;

    return await this.wateringRepository.save(watering);
  }

  /**
   *
   * @param id
   */
  async remove(id: number): Promise<void> {
    const watering = await this.findOne(id);
    await this.wateringRepository.remove(watering);
  }
}
