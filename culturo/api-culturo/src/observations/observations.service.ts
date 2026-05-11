import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Section } from 'src/entities/section.entity';
import {
  Observation,
  ObservationReviewStatus,
} from 'src/entities/observation.entity';
import { User_ } from 'src/entities/user_.entity';
import { JWTPayloadType } from 'src/utils/types';
import { Brackets, Repository } from 'typeorm';
import { CreateObservationDTO } from './dtos/create.observation.dto';
import { ListObservationsQueryDTO } from './dtos/list.observations.query.dto';
import { ReviewObservationDTO } from './dtos/review.observation.dto';

@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(Observation)
    private readonly observationRepository: Repository<Observation>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(User_)
    private readonly userRepository: Repository<User_>,
  ) {}

  async findAll(
    payload: JWTPayloadType,
    query: ListObservationsQueryDTO,
  ): Promise<Observation[]> {
    const builder = this.buildObservationQuery();

    if (payload.role === 'stagiaire' || query.mine) {
      builder.andWhere('author.id_user = :userId', { userId: payload.id });
    } else if (query.authorId) {
      builder.andWhere('author.id_user = :authorId', {
        authorId: query.authorId,
      });
    }

    if (query.reviewStatus) {
      builder.andWhere('observation.review_status = :reviewStatus', {
        reviewStatus: query.reviewStatus,
      });
    }

    if (query.sectionId) {
      builder.andWhere('section.id_section = :sectionId', {
        sectionId: query.sectionId,
      });
    }

    if (query.boardId) {
      builder.andWhere('board.id_board = :boardId', { boardId: query.boardId });
    }

    if (query.soleId) {
      builder.andWhere('sole.id_sole = :soleId', { soleId: query.soleId });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      builder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(observation.notes) LIKE :search', { search })
            .orWhere('LOWER(COALESCE(observation.disease_observed, \'\')) LIKE :search', {
              search,
            })
            .orWhere('LOWER(COALESCE(observation.pest_observed, \'\')) LIKE :search', {
              search,
            })
            .orWhere(
              'LOWER(COALESCE(observation.weather_conditions, \'\')) LIKE :search',
              { search },
            )
            .orWhere('LOWER(COALESCE(board.board_name, \'\')) LIKE :search', {
              search,
            })
            .orWhere(
              'LOWER(COALESCE(vegetable.vegetable_name, \'\')) LIKE :search',
              { search },
            )
            .orWhere('LOWER(COALESCE(author.user_first_name, \'\')) LIKE :search', {
              search,
            })
            .orWhere('LOWER(COALESCE(author.user_last_name, \'\')) LIKE :search', {
              search,
            });
        }),
      );
    }

    return builder.getMany();
  }

  async findOne(id: number, payload: JWTPayloadType): Promise<Observation> {
    const observation = await this.buildObservationQuery()
      .andWhere('observation.id_observation = :id', { id })
      .getOne();

    if (!observation) {
      throw new NotFoundException('Observation non trouvée.');
    }

    if (
      payload.role === 'stagiaire' &&
      observation.author.id_user !== payload.id
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que vos propres observations.',
      );
    }

    return observation;
  }

  async findActiveSections(): Promise<Section[]> {
    return this.sectionRepository.find({
      where: { section_active: true },
      relations: [
        'vegetable',
        'sectionPlan',
        'sectionPlan.board',
        'sectionPlan.board.sole',
        'sectionPlan.board.sole.exploitation',
      ],
      order: {
        sectionPlan: {
          board: {
            board_name: 'ASC',
          },
        },
        section_number: 'ASC',
      },
    });
  }

  async create(
    payload: JWTPayloadType,
    dto: CreateObservationDTO,
  ): Promise<Observation> {
    const [section, author] = await Promise.all([
      this.sectionRepository.findOne({
        where: { id_section: dto.sectionId },
      }),
      this.userRepository.findOne({
        where: { id_user: payload.id },
      }),
    ]);

    if (!section) {
      throw new NotFoundException('Section non trouvée.');
    }

    if (!author) {
      throw new NotFoundException('Auteur non trouvé.');
    }

    if (!section.section_active) {
      throw new BadRequestException(
        'Cette section n’est plus active pour une observation terrain.',
      );
    }

    const observation = this.observationRepository.create({
      observation_date: new Date(dto.observationDate),
      disease_observed: dto.diseaseObserved?.trim() || null,
      pest_observed: dto.pestObserved?.trim() || null,
      weather_conditions: dto.weatherConditions?.trim() || null,
      plant_status: dto.plantStatus,
      notes: dto.notes.trim(),
      review_status: 'pending',
      section,
      author,
    });

    await this.observationRepository.save(observation);

    return this.findOne(observation.id_observation, payload);
  }

  async review(
    id: number,
    payload: JWTPayloadType,
    dto: ReviewObservationDTO,
  ): Promise<Observation> {
    if (payload.role === 'stagiaire') {
      throw new ForbiddenException(
        'Seuls les formateurs et administrateurs peuvent relire une observation.',
      );
    }

    const [observation, reviewer] = await Promise.all([
      this.observationRepository.findOne({
        where: { id_observation: id },
        relations: ['author'],
      }),
      this.userRepository.findOne({
        where: { id_user: payload.id },
      }),
    ]);

    if (!observation) {
      throw new NotFoundException('Observation non trouvée.');
    }

    if (!reviewer) {
      throw new NotFoundException('Reviewer non trouvé.');
    }

    observation.review_status = dto.reviewStatus as ObservationReviewStatus;
    observation.review_notes = dto.reviewNotes?.trim() || null;
    observation.reviewed_at = new Date();
    observation.reviewer = reviewer;

    await this.observationRepository.save(observation);

    return this.findOne(id, payload);
  }

  private buildObservationQuery() {
    return this.observationRepository
      .createQueryBuilder('observation')
      .leftJoinAndSelect('observation.section', 'section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .leftJoinAndSelect('section.sectionPlan', 'sectionPlan')
      .leftJoinAndSelect('sectionPlan.board', 'board')
      .leftJoinAndSelect('board.sole', 'sole')
      .leftJoinAndSelect('sole.exploitation', 'exploitation')
      .leftJoinAndSelect('observation.author', 'author')
      .leftJoinAndSelect('observation.reviewer', 'reviewer')
      .orderBy('observation.observation_date', 'DESC')
      .addOrderBy('observation.created_at', 'DESC');
  }
}
