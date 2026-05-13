import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from 'src/entities/board.entity';
import { Family } from 'src/entities/family.entity';
import { Observation } from 'src/entities/observation.entity';
import { Section } from 'src/entities/section.entity';
import { SectionPlan } from 'src/entities/section_plan.entity';
import type { JWTPayloadType } from 'src/utils/types';
import { Repository } from 'typeorm';

type GroupedEntry = { board: Board; family: Family; dates: Date[] };

type DashboardRotationAlert = {
  boardId: number;
  boardName: string;
  soleName: string | null;
  exploitationName: string | null;
  familyId: number;
  familyName: string;
  lastCultivationDate: Date | null;
  activeThisYear: boolean;
  ruleType: 'rotation_5y' | 'cohabitation' | 'fallow';
  description?: string;
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
    const [planning, observations, rotationArrays] = await Promise.all([
      this.computePlanningSummary(),
      this.computeObservationSummary(payload),
      Promise.all([
        this.computeRotation5yAlerts(),
        this.computeCohabitationAlerts(),
      ]),
    ]);

    const rotations = rotationArrays.flat();

    return {
      generatedAt: new Date().toISOString(),
      role: payload.role,
      planning,
      observations: observations.summary,
      rotations: {
        alertCount: rotations.length,
        alerts: rotations,
      },
      contributors: payload.role === 'stagiaire' ? [] : observations.contributors,
      recentObservations: observations.recentObservations,
    };
  }

  private async computePlanningSummary() {
    const [activeBoards, activePlans, occupiedSections, totalSections] = await Promise.all([
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
      this.sectionRepository
        .createQueryBuilder('section')
        .leftJoin('section.sectionPlan', 'sectionPlan')
        .leftJoin('sectionPlan.board', 'board')
        .where('sectionPlan.section_plan_active = TRUE')
        .andWhere('board.board_active = TRUE')
        .getCount(),
    ]);

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

  private async computeRotation5yAlerts(): Promise<DashboardRotationAlert[]> {
    // Fetch all sections with a primary family, no date filter — we compare dates ourselves
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
      .andWhere('familyImportance.importance_name = :importance', {
        importance: 'primaire',
      })
      .getMany();

    // Group sections by board+family
    const grouped = new Map<string, GroupedEntry>();

    for (const section of sections) {
      if (!section.vegetable?.family || !section.sectionPlan?.board) continue;
      const board = section.sectionPlan.board;
      const family = section.vegetable.family;
      const key = `${board.id_board}-${family.id_family}`;
      const date = section.start_date ? new Date(section.start_date) : null;
      if (!date) continue;

      if (!grouped.has(key)) {
        grouped.set(key, { board, family, dates: [] });
      }
      grouped.get(key)!.dates.push(date);
    }

    const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
    const violations: DashboardRotationAlert[] = [];

    for (const { board, family, dates } of grouped.values()) {
      if (dates.length < 2) continue;

      // Sort dates ascending and check if any two plantings are within 5 years
      dates.sort((a, b) => a.getTime() - b.getTime());

      let violationDate: Date | null = null;
      for (let i = 1; i < dates.length; i++) {
        const gap = dates[i].getTime() - dates[i - 1].getTime();
        if (gap < fiveYearsMs) {
          violationDate = dates[i]; // most recent planting that caused the violation
        }
      }

      if (!violationDate) continue;

      violations.push({
        boardId: board.id_board,
        boardName: board.board_name,
        soleName: board.sole?.sole_name ?? null,
        exploitationName: board.sole?.exploitation?.exploitation_name ?? null,
        familyId: family.id_family,
        familyName: family.family_name,
        lastCultivationDate: violationDate,
        activeThisYear: false,
        ruleType: 'rotation_5y',
        description: `Replantée moins de 5 ans après la précédente culture de la même famille`,
      });
    }

    return violations.sort((a, b) => {
      const aTime = a.lastCultivationDate ? new Date(a.lastCultivationDate).getTime() : 0;
      const bTime = b.lastCultivationDate ? new Date(b.lastCultivationDate).getTime() : 0;
      return bTime - aTime;
    });
  }

  private async computeCohabitationAlerts(): Promise<DashboardRotationAlert[]> {
    const sections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .leftJoinAndSelect('vegetable.family', 'family')
      .leftJoinAndSelect('family.family_importance', 'familyImportance')
      .leftJoinAndSelect('section.sectionPlan', 'sectionPlan')
      .leftJoinAndSelect('sectionPlan.board', 'board')
      .leftJoinAndSelect('board.sole', 'sole')
      .leftJoinAndSelect('sole.exploitation', 'exploitation')
      .where('section.section_active = TRUE')
      .andWhere('board.board_active = TRUE')
      .andWhere('familyImportance.importance_name = :importance', { importance: 'primaire' })
      .getMany();

    const boardFamilies = new Map<number, { board: Board; names: string[] }>();

    for (const section of sections) {
      if (!section.vegetable?.family || !section.sectionPlan?.board) continue;
      const board = section.sectionPlan.board;
      const familyName = section.vegetable.family.family_name;

      if (!boardFamilies.has(board.id_board)) {
        boardFamilies.set(board.id_board, { board, names: [] });
      }
      const entry = boardFamilies.get(board.id_board)!;
      if (!entry.names.includes(familyName)) entry.names.push(familyName);
    }

    const violations: DashboardRotationAlert[] = [];
    for (const { board, names } of boardFamilies.values()) {
      if (names.length < 2) continue;
      const label = names.join(' + ');
      violations.push({
        boardId: board.id_board,
        boardName: board.board_name,
        soleName: board.sole?.sole_name ?? null,
        exploitationName: board.sole?.exploitation?.exploitation_name ?? null,
        familyId: 0,
        familyName: label,
        lastCultivationDate: null,
        activeThisYear: true,
        ruleType: 'cohabitation',
        description: `Plusieurs familles primaires actives simultanément : ${label}`,
      });
    }
    return violations;
  }

  private async computeFallowAlerts(): Promise<DashboardRotationAlert[]> {
    const sections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.sectionPlan', 'sectionPlan')
      .leftJoinAndSelect('sectionPlan.board', 'board')
      .leftJoinAndSelect('board.sole', 'sole')
      .leftJoinAndSelect('sole.exploitation', 'exploitation')
      .where('board.board_active = TRUE')
      .select([
        'section.id_section',
        'section.start_date',
        'sectionPlan.id_section_plan',
        'board.id_board',
        'board.board_name',
        'sole.sole_name',
        'exploitation.exploitation_name',
      ])
      .getMany();

    const boardYears = new Map<number, { board: Board; years: Set<number> }>();
    for (const section of sections) {
      const board = section.sectionPlan?.board;
      if (!board || !section.start_date) continue;
      const year = new Date(section.start_date).getFullYear();
      if (!boardYears.has(board.id_board)) {
        boardYears.set(board.id_board, { board, years: new Set() });
      }
      boardYears.get(board.id_board)!.years.add(year);
    }

    const currentYear = new Date().getFullYear();
    const violations: DashboardRotationAlert[] = [];

    for (const { board, years } of boardYears.values()) {
      let consecutive = 0;
      for (let y = currentYear; years.has(y); y--) {
        consecutive++;
      }
      if (consecutive >= 3) {
        violations.push({
          boardId: board.id_board,
          boardName: board.board_name,
          soleName: board.sole?.sole_name ?? null,
          exploitationName: board.sole?.exploitation?.exploitation_name ?? null,
          familyId: 0,
          familyName: 'Jachère recommandée',
          lastCultivationDate: null,
          activeThisYear: true,
          ruleType: 'fallow',
          description: `${consecutive} années de culture consécutives — une jachère est recommandée`,
        });
      }
    }
    return violations;
  }
}
