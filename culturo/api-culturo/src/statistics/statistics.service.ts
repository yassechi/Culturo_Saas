import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from 'src/entities/board.entity';
import { Observation } from 'src/entities/observation.entity';
import { Section } from 'src/entities/section.entity';
import { SectionPlan } from 'src/entities/section_plan.entity';
import type { JWTPayloadType } from 'src/utils/types';
import { Repository } from 'typeorm';

type DashboardRotationAlert = {
  boardId: number;
  boardName: string;
  soleName: string | null;
  exploitationName: string | null;
  familyId: number;
  familyName: string;
  lastCultivationDate: Date | null;
  activeThisYear: boolean;
};

type DashboardContributor = {
  userId: number;
  displayName: string;
  submittedCount: number;
  pendingCount: number;
};

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(SectionPlan)
    private readonly sectionPlanRepository: Repository<SectionPlan>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Observation)
    private readonly observationRepository: Repository<Observation>,
  ) {}

  async getDashboardSummary(payload: JWTPayloadType) {
    const [planning, observations, rotations] = await Promise.all([
      this.computePlanningSummary(),
      this.computeObservationSummary(payload),
      this.computeRotationAlerts(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      role: payload.role,
      planning,
      observations: observations.summary,
      rotations: {
        alertCount: rotations.length,
        alerts: rotations.slice(0, 6),
      },
      contributors: payload.role === 'stagiaire' ? [] : observations.contributors,
      recentObservations: observations.recentObservations,
    };
  }

  private async computePlanningSummary() {
    const [activeBoards, activePlans, occupiedSections] = await Promise.all([
      this.boardRepository.count({ where: { board_active: true } }),
      this.sectionPlanRepository
        .createQueryBuilder('sectionPlan')
        .leftJoinAndSelect('sectionPlan.board', 'board')
        .leftJoinAndSelect('board.sole', 'sole')
        .leftJoinAndSelect('sole.exploitation', 'exploitation')
        .where('sectionPlan.section_plan_active = TRUE')
        .andWhere('board.board_active = TRUE')
        .getMany(),
      this.sectionRepository
        .createQueryBuilder('section')
        .leftJoin('section.sectionPlan', 'sectionPlan')
        .leftJoin('sectionPlan.board', 'board')
        .where('section.section_active = TRUE')
        .andWhere('sectionPlan.section_plan_active = TRUE')
        .andWhere('board.board_active = TRUE')
        .getCount(),
    ]);

    const totalSections = activePlans.reduce(
      (sum, plan) => sum + plan.number_of_section,
      0,
    );

    const activeSoles = new Set(
      activePlans
        .map((plan) => plan.board?.sole?.id_sole)
        .filter((value): value is number => typeof value === 'number'),
    ).size;

    const activeExploitations = new Set(
      activePlans
        .map((plan) => plan.board?.sole?.exploitation?.id_exploitation)
        .filter((value): value is number => typeof value === 'number'),
    ).size;

    const occupancyRate =
      totalSections > 0
        ? Number(((occupiedSections / totalSections) * 100).toFixed(1))
        : 0;

    return {
      activeBoards,
      activeSoles,
      activeExploitations,
      totalSections,
      occupiedSections,
      occupancyRate,
    };
  }

  private async computeObservationSummary(payload: JWTPayloadType) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const builder = this.observationRepository
      .createQueryBuilder('observation')
      .leftJoinAndSelect('observation.author', 'author')
      .leftJoinAndSelect('observation.section', 'section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .leftJoinAndSelect('section.sectionPlan', 'sectionPlan')
      .leftJoinAndSelect('sectionPlan.board', 'board')
      .leftJoinAndSelect('board.sole', 'sole')
      .leftJoinAndSelect('sole.exploitation', 'exploitation')
      .orderBy('observation.observation_date', 'DESC')
      .addOrderBy('observation.created_at', 'DESC');

    if (payload.role === 'stagiaire') {
      builder.where('author.id_user = :userId', { userId: payload.id });
    }

    const observations = await builder.getMany();

    const summary = {
      total: observations.length,
      pending: observations.filter((item) => item.review_status === 'pending')
        .length,
      approved: observations.filter((item) => item.review_status === 'approved')
        .length,
      changesRequested: observations.filter(
        (item) => item.review_status === 'changes_requested',
      ).length,
      recentSevenDays: observations.filter(
        (item) => new Date(item.observation_date) >= sevenDaysAgo,
      ).length,
    };

    const contributorsMap = new Map<number, DashboardContributor>();

    observations.forEach((observation) => {
      const userId = observation.author?.id_user;
      if (!userId) return;

      const displayName = [
        observation.author.user_first_name?.trim(),
        observation.author.user_last_name?.trim(),
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || observation.author.email;

      const existing = contributorsMap.get(userId);
      if (existing) {
        existing.submittedCount += 1;
        if (observation.review_status === 'pending') {
          existing.pendingCount += 1;
        }
        return;
      }

      contributorsMap.set(userId, {
        userId,
        displayName,
        submittedCount: 1,
        pendingCount: observation.review_status === 'pending' ? 1 : 0,
      });
    });

    const contributors = [...contributorsMap.values()].sort((left, right) => {
      if (right.pendingCount !== left.pendingCount) {
        return right.pendingCount - left.pendingCount;
      }

      return right.submittedCount - left.submittedCount;
    });

    return {
      summary,
      contributors: contributors.slice(0, 6),
      recentObservations: observations.slice(0, 6),
    };
  }

  private async computeRotationAlerts(): Promise<DashboardRotationAlert[]> {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    fiveYearsAgo.setHours(0, 0, 0, 0);

    const sections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .leftJoinAndSelect('vegetable.family', 'family')
      .leftJoinAndSelect('family.family_importance', 'familyImportance')
      .leftJoinAndSelect('section.sectionPlan', 'sectionPlan')
      .leftJoinAndSelect('sectionPlan.board', 'board')
      .leftJoinAndSelect('board.sole', 'sole')
      .leftJoinAndSelect('sole.exploitation', 'exploitation')
      .where('board.board_active = TRUE')
      .andWhere('section.end_date >= :fiveYearsAgo', { fiveYearsAgo })
      .andWhere('familyImportance.importance_name = :importance', {
        importance: 'primaire',
      })
      .getMany();

    const alertsMap = new Map<string, DashboardRotationAlert>();

    sections.forEach((section) => {
      if (!section.vegetable?.family || !section.sectionPlan?.board) {
        return;
      }

      const board = section.sectionPlan.board;
      const family = section.vegetable.family;
      const key = `${board.id_board}-${family.id_family}`;
      const currentDate = section.end_date ? new Date(section.end_date) : null;

      const previous = alertsMap.get(key);

      if (
        previous &&
        previous.lastCultivationDate &&
        currentDate &&
        previous.lastCultivationDate >= currentDate
      ) {
        if (section.section_active) {
          previous.activeThisYear = true;
        }
        return;
      }

      alertsMap.set(key, {
        boardId: board.id_board,
        boardName: board.board_name,
        soleName: board.sole?.sole_name ?? null,
        exploitationName: board.sole?.exploitation?.exploitation_name ?? null,
        familyId: family.id_family,
        familyName: family.family_name,
        lastCultivationDate: currentDate,
        activeThisYear: section.section_active,
      });
    });

    return [...alertsMap.values()].sort((left, right) => {
      const leftTime = left.lastCultivationDate
        ? new Date(left.lastCultivationDate).getTime()
        : 0;
      const rightTime = right.lastCultivationDate
        ? new Date(right.lastCultivationDate).getTime()
        : 0;
      return rightTime - leftTime;
    });
  }
}
