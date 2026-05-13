import { BoardPlanDto } from '../dtos/boardPlan.dto';
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Section } from 'src/entities/section.entity';
import { SectionPlan } from 'src/entities/section_plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantableVegetableDto } from '../dtos/plantable.vegetable.dro';
import { Board } from 'src/entities/board.entity';
import { Variety } from 'src/entities/variety.entity';
import { FamilyIncompatibility } from 'src/entities/family_incompatibility.entity';
import { Watering } from 'src/entities/watering.entity';
import { Harvest } from 'src/entities/harvest.entity';
import { Observation } from 'src/entities/observation.entity';

type PlantingSuccess = {
  status: 'OK';
  section: Section;
};

type PlantingWarning = {
  status: 'WARNING';
  reason: string;
  neededBypass: boolean;
};

interface PlanResult {
  sectionPlan: SectionPlan;
  status: 'CREATED' | 'FOUND';
}

type PlantingResult = PlantingSuccess | PlantingWarning;

interface RawCulturePlanResult {
  board_id_board: number;
  board_board_name: string;
  section_id_section: number;
  section_section_number: number;
  section_section_active: boolean;
  section_quantity_planted: number;
  vegetable_id_vegetable: number;
  vegetable_vegetable_name: string;
  variety_variety_name: string | null;
  family_family_name: string | null;
  family_importance_importance_name: string | null;
  section_start_date: Date;
  section_end_date: Date;
}

// --- Type Guard Utile ---
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

const SEASON_BY_MONTH: Record<number, 'hiver' | 'printemps' | 'ete' | 'automne'> = {
  1: 'hiver',
  2: 'hiver',
  3: 'printemps',
  4: 'printemps',
  5: 'printemps',
  6: 'ete',
  7: 'ete',
  8: 'ete',
  9: 'automne',
  10: 'automne',
  11: 'automne',
  12: 'hiver',
};

function normalizeSeasonLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function seasonKeyFromDate(date: Date): 'hiver' | 'printemps' | 'ete' | 'automne' {
  return SEASON_BY_MONTH[date.getUTCMonth() + 1];
}

function matchesSeasonWindow(date: Date, plantingSeason: string): boolean {
  const normalized = normalizeSeasonLabel(plantingSeason);

  if (
    normalized.includes('toute') ||
    normalized.includes('annee') ||
    normalized.includes('all')
  ) {
    return true;
  }

  const knownSeasons: Array<'hiver' | 'printemps' | 'ete' | 'automne'> = [
    'hiver',
    'printemps',
    'ete',
    'automne',
  ];

  const allowed = knownSeasons.filter((season) => normalized.includes(season));

  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(seasonKeyFromDate(date));
}

function seasonLabelFromDate(date: Date): string {
  const season = seasonKeyFromDate(date);
  if (season === 'ete') return 'Été';
  if (season === 'hiver') return 'Hiver';
  if (season === 'automne') return 'Automne';
  return 'Printemps';
}

@Injectable()
export class RotationService {
  constructor(
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
    @InjectRepository(Vegetable)
    private readonly vegetableRepository: Repository<Vegetable>,
    @InjectRepository(SectionPlan)
    private sectionPlanRepository: Repository<SectionPlan>,
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(Variety)
    private varietyRepository: Repository<Variety>,
    @InjectRepository(FamilyIncompatibility)
    private incompatibilityRepository: Repository<FamilyIncompatibility>,

    @InjectRepository(Watering)
    private wateringRepository: Repository<Watering>,

    @InjectRepository(Harvest)
    private harvestRepository: Repository<Harvest>,

    @InjectRepository(Observation)
    private observationRepository: Repository<Observation>,
  ) {}

  /**
   *
   * @param soleId
   * @param year
   * @param month
   * @param periodMonths
   * @returns
   */
  async getCulturePlan(
    soleId: number,
    year: number,
    month: number | null = null,
    periodMonths: number = 12,
  ): Promise<BoardPlanDto[]> {
    let startDate: Date;
    let endDate: Date;

    if (month !== null) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1 + periodMonths, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const results: RawCulturePlanResult[] = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoin('section.vegetable', 'vegetable')
      .leftJoin('vegetable.family', 'family')
      .leftJoin('family.family_importance', 'family_importance')
      .leftJoin('section.variety', 'variety')
      .leftJoin('section.sectionPlan', 'sectionPlan')
      .leftJoin('sectionPlan.board', 'board')
      .leftJoin('board.sole', 'sole')
      .where('sole.id_sole = :soleId', { soleId })
      .andWhere('section.start_date <= :endDate', { endDate })
      .andWhere('section.end_date >= :startDate', { startDate })
      .select([
        'board.id_board',
        'board.board_name',
        'section.id_section',
        'section.section_number',
        'section.section_active',
        'section.quantity_planted',
        'vegetable.id_vegetable',
        'vegetable.vegetable_name',
        'variety.variety_name',
        'family.family_name',
        'family_importance.importance_name',
        'section.start_date',
        'section.end_date',
      ])
      .orderBy('board.board_name', 'ASC')
      .addOrderBy('section.section_number', 'ASC')
      .getRawMany<RawCulturePlanResult>();

    return results.map((r) => ({
      boardId: r.board_id_board,
      boardName: r.board_board_name,
      sectionId: r.section_id_section,
      sectionNumber: r.section_section_number,
      isHarvested: !r.section_section_active,
      vegetableId: r.vegetable_id_vegetable,
      vegetableName: r.vegetable_vegetable_name,
      varietyName: r.variety_variety_name ?? null,
      familyName: r.family_family_name ?? null,
      familyType: r.family_importance_importance_name ?? null,
      quantityPlanted: r.section_quantity_planted ?? 0,
      startDate: r.section_start_date,
      endDate: r.section_end_date,
    }));
  }

  /**
   *
   * @param boardId
   * @param vegetableId
   * @param bypass
   * @returns
   */
  async canPlantVegetable(
    boardId: number,
    vegetableId: number,
    bypass = false,
    startDate?: Date,
    endDate?: Date,
  ) {
    const vegetable = await this.vegetableRepository.findOne({
      where: { id_vegetable: vegetableId },
      relations: ['family', 'family.family_importance'],
    });

    if (!vegetable) {
      throw new NotFoundException(`Vegetable with id ${vegetableId} not found`);
    }

    const family = vegetable.family;

    if (!family || !family.family_importance) {
      throw new NotFoundException(
        'Vegetable family or importance not configured',
      );
    }

    const isPrimary = family.family_importance.importance_name === 'primaire';

    if (
      startDate &&
      endDate &&
      !isNaN(startDate.getTime()) &&
      !isNaN(endDate.getTime()) &&
      startDate > endDate
    ) {
      return {
        status: 'WARNING',
        reason:
          'RÈGLE 4: la date de début de plantation est postérieure à la date de fin prévue.',
        neededBypass: false,
      };
    }

    const seasonalityWarning =
      startDate &&
      !isNaN(startDate.getTime()) &&
      !matchesSeasonWindow(startDate, vegetable.planting_season)
        ? {
            status: 'WARNING' as const,
            reason: `RÈGLE 4: ${vegetable.vegetable_name} est référencé pour la saison « ${vegetable.planting_season} ». La date choisie correspond à la saison « ${seasonLabelFromDate(startDate)} ».`,
            neededBypass: false,
          }
        : null;

    if (!isPrimary) {
      return seasonalityWarning ?? { status: 'OK' };
    }

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setUTCFullYear(fiveYearsAgo.getUTCFullYear() - 5);
    fiveYearsAgo.setUTCHours(0, 0, 0, 0);

    const sections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .leftJoinAndSelect('vegetable.family', 'family')
      .leftJoinAndSelect('family.family_importance', 'family_importance')
      .leftJoin('section.sectionPlan', 'sectionPlan')
      .leftJoin('sectionPlan.board', 'board')
      .where('board.id_board = :boardId', { boardId })
      .andWhere(
        `(
        section.section_active = TRUE 
        OR section.end_date >= :fiveYearsAgo
      )`,
        { fiveYearsAgo: fiveYearsAgo },
      )
      .getMany();

    let alreadyPlantedIn5Years = false;
    let hasActivePrimaryFamily = false;

    // Date de référence : début de la nouvelle culture (ou aujourd'hui si non précisé)
    const refDate = startDate ?? new Date();
    const refDateUtc = new Date(Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()));

    for (const section of sections) {
      const secVegetable = section.vegetable;
      if (!secVegetable?.family?.family_importance) continue;

      const secFamilyId = secVegetable.family.id_family;
      const secIsPrimary =
        secVegetable.family.family_importance.importance_name === 'primaire';

      const sectionEndUtc = new Date(Date.UTC(
        new Date(section.end_date).getUTCFullYear(),
        new Date(section.end_date).getUTCMonth(),
        new Date(section.end_date).getUTCDate(),
      ));

      // Une culture est "terminée" si sa date de fin est antérieure au début de la nouvelle culture
      const isEnded = sectionEndUtc < refDateUtc;

      // RÈGLE 1 — Rotation 5 ans : même famille, déjà terminée dans les 5 dernières années
      if (isEnded && section.end_date && secFamilyId === family.id_family) {
        alreadyPlantedIn5Years = true;
      }

      // RÈGLE 2 — Cohabitation : famille primaire dont la culture chevauche la nouvelle période
      if (!isEnded && secIsPrimary) {
        hasActivePrimaryFamily = true;
      }

      if (alreadyPlantedIn5Years && hasActivePrimaryFamily) {
        break;
      }
    }

    // RÉSULTATS — Règles bloquantes en premier
    if (alreadyPlantedIn5Years && !bypass) {
      return {
        status: 'WARNING',
        reason: `RÈGLE 1: Cette famille primaire (ID ${family.id_family}) a déjà été plantée sur cette planche dans les 5 dernières années (Rotation 5 ans).`,
        neededBypass: true,
      };
    }

    if (hasActivePrimaryFamily && !bypass) {
      return {
        status: 'WARNING',
        reason:
          "RÈGLE 2: Une autre famille primaire est déjà activement plantée sur cette planche (Cohabitation). La règle de rotation stricte n'autorise qu'UNE seule famille primaire active par planche.",
        neededBypass: true,
      };
    }

    // RÈGLE 3 — Associations déconseillées (non bloquant)
    const associationWarning = await this.checkAssociationRule(boardId, family.id_family, refDate);
    if (associationWarning) return associationWarning;

    // RÈGLE 4 — Saisonnalité (déjà calculée)
    if (seasonalityWarning) return seasonalityWarning;

    // RÈGLE 5 — Engrais vert recommandé après culture à fort besoin en azote (non bloquant)
    const nitrogenWarning = await this.checkNitrogenRule(boardId, refDate);
    if (nitrogenWarning) return nitrogenWarning;

    // RÈGLE 6 — Jachère recommandée après culture intensive (non bloquant)
    const fallowWarning = await this.checkFallowRule(boardId, refDate);
    if (fallowWarning) return fallowWarning;

    return { status: 'OK' };
  }

  private async checkAssociationRule(
    boardId: number,
    targetFamilyId: number,
    refDate: Date,
  ): Promise<{ status: 'WARNING'; reason: string; neededBypass: boolean } | null> {
    const incompatibilities = await this.incompatibilityRepository.find({
      where: [
        { family_a_id: targetFamilyId },
        { family_b_id: targetFamilyId },
      ],
    });

    if (incompatibilities.length === 0) return null;

    const incompatibleFamilyIds = new Set(
      incompatibilities.flatMap((i) => [i.family_a_id, i.family_b_id]).filter((id) => id !== targetFamilyId),
    );

    const refDateUtc = new Date(Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()));

    const activeSections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .leftJoinAndSelect('vegetable.family', 'family')
      .innerJoin('section.sectionPlan', 'sp')
      .innerJoin('sp.board', 'board')
      .where('board.id_board = :boardId', { boardId })
      .andWhere('section.end_date > :refDate', { refDate: refDateUtc })
      .getMany();

    for (const section of activeSections) {
      const activeFamilyId = section.vegetable?.family?.id_family;
      if (activeFamilyId && incompatibleFamilyIds.has(activeFamilyId)) {
        const incompat = incompatibilities.find(
          (i) =>
            (i.family_a_id === targetFamilyId && i.family_b_id === activeFamilyId) ||
            (i.family_b_id === targetFamilyId && i.family_a_id === activeFamilyId),
        );
        const familyName = section.vegetable?.family?.family_name ?? `famille ID ${activeFamilyId}`;
        const detail = incompat?.reason ? ` (${incompat.reason})` : '';
        return {
          status: 'WARNING',
          reason: `RÈGLE 3: Association déconseillée avec ${familyName} déjà présente sur cette planche${detail}.`,
          neededBypass: false,
        };
      }
    }

    return null;
  }

  private async checkNitrogenRule(
    boardId: number,
    refDate: Date,
  ): Promise<{ status: 'WARNING'; reason: string; neededBypass: boolean } | null> {
    const lastEndedSection = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .innerJoin('section.sectionPlan', 'sp')
      .innerJoin('sp.board', 'board')
      .where('board.id_board = :boardId', { boardId })
      .andWhere('section.end_date <= :refDate', { refDate })
      .orderBy('section.end_date', 'DESC')
      .getOne();

    if (lastEndedSection?.vegetable?.nitrogen_need === 'fort') {
      const vegName = lastEndedSection.vegetable.vegetable_name;
      return {
        status: 'WARNING',
        reason: `RÈGLE 5: La culture précédente (${vegName}) avait un fort besoin en azote. Un engrais vert ou un amendement est recommandé avant de replanter sur cette planche.`,
        neededBypass: false,
      };
    }

    return null;
  }

  private async checkFallowRule(
    boardId: number,
    refDate: Date,
  ): Promise<{ status: 'WARNING'; reason: string; neededBypass: boolean } | null> {
    const allSections = await this.sectionRepository
      .createQueryBuilder('section')
      .innerJoin('section.sectionPlan', 'sp')
      .innerJoin('sp.board', 'board')
      .where('board.id_board = :boardId', { boardId })
      .select(['section.start_date', 'section.end_date'])
      .getMany();

    const currentYear = refDate.getFullYear();
    let consecutiveYears = 0;

    for (let y = currentYear - 1; y >= currentYear - 5; y--) {
      const yearStart = new Date(y, 0, 1);
      const yearEnd = new Date(y, 11, 31);
      const hasActivity = allSections.some(
        (s) => new Date(s.start_date) <= yearEnd && new Date(s.end_date) >= yearStart,
      );
      if (hasActivity) {
        consecutiveYears++;
      } else {
        break;
      }
    }

    if (consecutiveYears >= 3) {
      return {
        status: 'WARNING',
        reason: `RÈGLE 6: Cette planche est en culture intensive depuis ${consecutiveYears} années consécutives. Une année de jachère ou d'engrais vert est recommandée pour restaurer la fertilité du sol.`,
        neededBypass: false,
      };
    }

    return null;
  }

  /**
   *
   * @param vegetableId
   * @param startDate
   * @param endDate
   * @returns
   */
  async findPlantableSections(
    vegetableId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    try {
      const targetVegetable = await this.vegetableRepository.findOne({
        where: { id_vegetable: vegetableId },
        relations: ['family', 'family.family_importance'],
      });

      if (!targetVegetable?.family?.family_importance) {
        throw new NotFoundException(
          `Légume ${vegetableId} non trouvé ou configuration incomplète.`,
        );
      }

      const targetFamilyId = targetVegetable.family.id_family;
      const isTargetPrimary =
        targetVegetable.family.family_importance.importance_name === 'primaire';

      const fiveYearsAgo = new Date(startDate);
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      // Récupérer TOUS les SectionPlan actifs (avec leur historique de sections)
      const allSectionPlans = await this.sectionPlanRepository
        .createQueryBuilder('sectionPlan')
        .leftJoinAndSelect('sectionPlan.board', 'board')
        .leftJoinAndSelect('sectionPlan.sections', 'sections')
        .leftJoinAndSelect('sections.vegetable', 'vegetable')
        .leftJoinAndSelect('vegetable.family', 'family')
        .leftJoinAndSelect('family.family_importance', 'family_importance')
        .where('sectionPlan.section_plan_active = :active', { active: true })
        .getMany();

      // Regrouper tous les plans actifs par planche pour avoir une vue complète
      // (une planche peut avoir plusieurs section_plans actifs issus de différentes années)
      type BoardAggregate = {
        boardId: number;
        boardName: string;
        numberOfSections: number;
        sectionPlanId: number;
        allSections: (typeof allSectionPlans[0]['sections'][0])[];
      };

      const boardMap = new Map<number, BoardAggregate>();
      for (const sectionPlan of allSectionPlans) {
        const boardId = sectionPlan.board.id_board;
        if (!boardMap.has(boardId)) {
          boardMap.set(boardId, {
            boardId,
            boardName: sectionPlan.board.board_name,
            numberOfSections: sectionPlan.number_of_section,
            sectionPlanId: sectionPlan.id_section_plan,
            allSections: [],
          });
        }
        const agg = boardMap.get(boardId)!;
        // Prendre le plus grand nombre de sections connu
        if (sectionPlan.number_of_section > agg.numberOfSections) {
          agg.numberOfSections = sectionPlan.number_of_section;
        }
        // Garder le plan le plus récent comme référence
        if (sectionPlan.id_section_plan > agg.sectionPlanId) {
          agg.sectionPlanId = sectionPlan.id_section_plan;
        }
        agg.allSections.push(...sectionPlan.sections);
      }

      const plantableLocations: any[] = [];

      for (const agg of boardMap.values()) {
        // ── RÈGLE 1 (niveau planche) : pas deux familles primaires différentes
        //    simultanément sur la même planche pendant la période demandée
        let isBoardAccessible = true;

        for (const section of agg.allSections) {
          if (!section.vegetable?.family) continue;

          const activeFamilyId = section.vegetable.family.id_family;
          const isActivePrimary =
            section.vegetable.family.family_importance?.importance_name === 'primaire';
          const overlaps =
            new Date(section.end_date) > startDate &&
            new Date(section.start_date) < endDate;

          if (isActivePrimary && isTargetPrimary && overlaps && activeFamilyId !== targetFamilyId) {
            isBoardAccessible = false;
            break;
          }
        }

        if (!isBoardAccessible) continue;

        // ── Vérification par section ───────────────────────────────────────────
        for (let sectionNumber = 1; sectionNumber <= agg.numberOfSections; sectionNumber++) {
          const sectionsAtLocation = agg.allSections.filter(
            (s) => s.section_number === sectionNumber,
          );

          let isSectionPlantable = true;

          for (const section of sectionsAtLocation) {
            if (!section.vegetable) continue;

            // Occupation physique : chevauchement avec la période demandée
            const isOccupied =
              new Date(section.start_date) < endDate &&
              new Date(section.end_date) > startDate;

            if (isOccupied) {
              isSectionPlantable = false;
              break;
            }

            // RÈGLE 2 (niveau section) : même famille primaire dans les 5 dernières années
            if (isTargetPrimary && section.vegetable.family) {
              const pastFamilyId = section.vegetable.family.id_family;
              const isPastPrimary =
                section.vegetable.family.family_importance?.importance_name === 'primaire';

              if (isPastPrimary && pastFamilyId === targetFamilyId && section.end_date >= fiveYearsAgo) {
                isSectionPlantable = false;
                break;
              }
            }
          }

          if (isSectionPlantable) {
            const sorted = [...sectionsAtLocation].sort(
              (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime(),
            );
            plantableLocations.push({
              sectionPlanId: agg.sectionPlanId,
              boardId: agg.boardId,
              boardName: agg.boardName,
              sectionNumber,
              totalSections: agg.numberOfSections,
              lastPlantedVegetable: sorted[0]?.vegetable?.vegetable_name ?? null,
              neverPlanted: sectionsAtLocation.length === 0,
            });
          }
        }
      }

      return plantableLocations;
    } catch (e) {
      const errorMessage = isError(e)
        ? e.message
        : 'Erreur inconnue lors de la recherche des sections plantables.';

      throw new InternalServerErrorException(
        `Erreur findPlantableSections: ${errorMessage}`,
      );
    }
  }

  /**
   *
   * @param sectionPlanId
   * @param sectionNumber
   * @param startDate
   * @param endDate
   * @returns
   */
  async findPlantableVegetables(
    sectionPlanId: number,
    sectionNumber: number,
    startDate: Date,
    endDate: Date,
  ): Promise<PlantableVegetableDto[]> {
    try {
      // 1. Récupérer le SectionPlan pour obtenir le boardId et valider le numéro de section
      const sectionPlan = await this.sectionPlanRepository.findOne({
        where: { id_section_plan: sectionPlanId },
        relations: ['board'],
      });

      if (!sectionPlan) {
        throw new NotFoundException(`SectionPlan ${sectionPlanId} non trouvé.`);
      }

      if (sectionNumber < 1 || sectionNumber > sectionPlan.number_of_section) {
        throw new BadRequestException(
          `Section ${sectionNumber} invalide. Board a ${sectionPlan.number_of_section} sections.`,
        );
      }

      const boardId = sectionPlan.board.id_board;

      // 2. Charger TOUTES les sections du board (tous plans confondus)
      //    pour avoir un historique complet de la rotation
      const allBoardSections = await this.sectionRepository
        .createQueryBuilder('section')
        .leftJoinAndSelect('section.vegetable', 'vegetable')
        .leftJoinAndSelect('vegetable.family', 'family')
        .leftJoinAndSelect('family.family_importance', 'importance')
        .innerJoin('section.sectionPlan', 'sp')
        .innerJoin('sp.board', 'board')
        .where('board.id_board = :boardId', { boardId })
        .getMany();

      // 3. Occupation physique : chevauchement strict (fin exclusive)
      //    Un végétal se terminant exactement le jour du début de la nouvelle culture
      //    n'est PAS considéré comme occupant encore la section.
      const sectionsAtLocation = allBoardSections.filter(
        (s) => s.section_number === sectionNumber,
      );

      for (const section of sectionsAtLocation) {
        if (!section.vegetable) continue;
        const sd = new Date(section.start_date);
        const ed = new Date(section.end_date);
        const isOccupied = sd < endDate && ed > startDate;
        if (isOccupied) {
          return [];
        }
      }

      // 4. Construire l'historique de rotation à partir de l'ensemble du board
      const fiveYearsAgo = new Date(startDate);
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      const activePrimaryFamilies = new Set<number>();
      const recentPrimaryFamilies = new Set<number>();
      const activeFamilyIds = new Set<number>();

      for (const section of allBoardSections) {
        if (!section.vegetable?.family?.family_importance) continue;

        const familyId = section.vegetable.family.id_family;
        const isPrimary =
          section.vegetable.family.family_importance.importance_name === 'primaire';

        const isActive =
          new Date(section.end_date) > startDate &&
          new Date(section.start_date) < endDate;

        if (isActive) {
          activeFamilyIds.add(familyId);
        }

        if (!isPrimary) continue;

        if (isActive) {
          activePrimaryFamilies.add(familyId);
        }

        if (new Date(section.end_date) > fiveYearsAgo) {
          recentPrimaryFamilies.add(familyId);
        }
      }

      // Charger les incompatibilités pour toutes les familles actives
      const allIncompatibilities =
        activeFamilyIds.size > 0
          ? await this.incompatibilityRepository
              .createQueryBuilder('incompat')
              .where('incompat.family_a_id IN (:...ids)', { ids: [...activeFamilyIds] })
              .orWhere('incompat.family_b_id IN (:...ids)', { ids: [...activeFamilyIds] })
              .getMany()
          : [];

      // familyId → raison d'incompatibilité avec les familles actives
      const incompatibleFamilyReasons = new Map<number, string>();
      for (const incompat of allIncompatibilities) {
        const conflictingActiveId = activeFamilyIds.has(incompat.family_a_id)
          ? incompat.family_a_id
          : incompat.family_b_id;
        const targetId =
          incompat.family_a_id === conflictingActiveId ? incompat.family_b_id : incompat.family_a_id;
        if (!incompatibleFamilyReasons.has(targetId)) {
          incompatibleFamilyReasons.set(targetId, incompat.reason ?? 'association déconseillée');
        }
      }

      // 5. Filtrer les légumes selon les règles de rotation
      const allVegetables = await this.vegetableRepository
        .createQueryBuilder('veg')
        .leftJoinAndSelect('veg.family', 'family')
        .leftJoinAndSelect('family.family_importance', 'fi')
        .getMany();

      // Dernier légume planté à cet emplacement (pour affichage)
      const lastSectionAtLocation = sectionsAtLocation
        .filter((s) => s.vegetable)
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];

      const plantableVegetables: PlantableVegetableDto[] = [];

      for (const vegetable of allVegetables) {
        if (!vegetable.family?.family_importance) continue;

        const familyId = vegetable.family.id_family;
        const isPrimary =
          vegetable.family.family_importance.importance_name === 'primaire';

        let isPlantable = true;

        // Règle cohabitation : une seule famille primaire active à la fois
        if (isPrimary && activePrimaryFamilies.size > 0) {
          if (!activePrimaryFamilies.has(familyId)) {
            isPlantable = false;
          }
        }

        // Règle rotation 5 ans : même famille primaire récemment plantée
        if (isPrimary && recentPrimaryFamilies.has(familyId)) {
          isPlantable = false;
        }

        if (isPlantable) {
          const assocReason = incompatibleFamilyReasons.get(familyId) ?? null;
          plantableVegetables.push({
            vegetableId: vegetable.id_vegetable,
            vegetableName: vegetable.vegetable_name,
            familyId: vegetable.family.id_family,
            familyName: vegetable.family.family_name,
            importance: vegetable.family.family_importance.importance_name,
            lastPlantedInSection: lastSectionAtLocation?.start_date
              ? new Date(lastSectionAtLocation.start_date).toISOString()
              : null,
            lastQuantityPlanted: lastSectionAtLocation?.quantity_planted ?? null,
            neverPlantedInSection: sectionsAtLocation.filter((s) => s.vegetable).length === 0,
            associationWarning: assocReason !== null,
            associationWarningReason: assocReason,
          });
        }
      }

      return plantableVegetables;
    } catch (e) {
      const errorMessage = isError(e)
        ? e.message
        : 'Erreur inconnue lors de la recherche des légumes plantables.';

      throw new InternalServerErrorException(
        `Erreur findPlantableVegetables: ${errorMessage}`,
      );
    }
  }

  /**
   *
   * @param boardId
   * @param numberOfSections
   * @returns
   */
  async createOrActivatePlan(
    boardId: number,
    numberOfSections: number,
  ): Promise<PlanResult> {
    let existingPlan = await this.sectionPlanRepository.findOne({
      where: { board: { id_board: boardId }, section_plan_active: true },
      // relations: [
      //   'board',
      //   'sections',
      //   'sections.vegetable',
      //   'sections.vegetable.family',
      //   'sections.vegetable.family.family_importance',
      // ],
    });

    // CAS 1: Le plan existe.
    if (existingPlan) {
      if (numberOfSections !== existingPlan.number_of_section && numberOfSections > 0) {
        existingPlan.number_of_section = numberOfSections;
        await this.sectionPlanRepository.save(existingPlan);
      }
      return { sectionPlan: existingPlan, status: 'FOUND' };
    }

    // CAS 2: Le plan n'existe pas. Procéder à la CRÉATION.
    if (numberOfSections <= 0) {
      throw new BadRequestException(
        'Le nombre de sections pour la création du plan doit être supérieur à zéro.',
      );
    }

    const board = await this.boardRepository.findOne({
      where: { id_board: boardId },
    });
    if (!board) {
      throw new NotFoundException(`Planche ${boardId} non trouvée.`);
    }

    const newPlan = this.sectionPlanRepository.create({
      board: board,
      number_of_section: numberOfSections,
      section_plan_active: true,
    });

    const savedPlan = await this.sectionPlanRepository.save(newPlan);

    // Recharger le plan créé avec toutes les relations
    const planWithRelations = await this.sectionPlanRepository.findOneOrFail({
      where: { id_section_plan: savedPlan.id_section_plan },
      relations: [
        'board',
        'sections',
        'sections.vegetable',
        'sections.vegetable.family',
        'sections.vegetable.family.family_importance',
      ],
    });

    return { sectionPlan: planWithRelations, status: 'CREATED' };
  }

  /**
   *
   * @param boardId
   * @param sectionNumber
   * @param vegetableId
   * @param startDate
   * @param endDate
   * @param quantityPlanted
   * @param bypass
   * @param unity
   * @param varietyIdentifier
   * @param numberOfSection
   * @returns
   */
  // RotationService.ts

  async addVegetableToBoard(
    boardId: number,
    sectionNumber: number,
    vegetableId: number,
    startDate: Date | string,
    endDate: Date | string,
    quantityPlanted: number = 0,
    bypass: boolean = false,
    unity: string,
    varietyIdentifier: string | number,
    numberOfSection: number, // PARAMÈTRE RÉINTRODUIT ET UTILISÉ
  ): Promise<PlantingResult> {
    try {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      startDate = start;
      endDate = end;

      // 1. Vérification du Légume et Gestion de la variété (INCHANGÉ)
      const vegetable = await this.vegetableRepository.findOne({
        where: { id_vegetable: vegetableId },
        relations: ['family', 'family.family_importance', 'varieties'],
      });
      if (!vegetable) {
        throw new NotFoundException(`Légume ${vegetableId} non trouvé.`);
      }

      const vegetableIdFK = vegetable.id_vegetable;
      let varietyIdFK: number | null = null;
      let variety: Variety | null = null;

      // ... (Logique de gestion de la variété identique) ...
      if (typeof varietyIdentifier === 'number') {
        // ID
        variety = await this.varietyRepository.findOne({
          where: { id_variety: varietyIdentifier },
          relations: ['vegetable'],
        });

        if (!variety || variety.vegetable.id_vegetable !== vegetableId) {
          throw new NotFoundException(
            `Variété ID ${varietyIdentifier} non trouvée ou n'appartient pas au Légume ${vegetableId}.`,
          );
        }
        varietyIdFK = variety.id_variety;
      } else if (
        // String
        typeof varietyIdentifier === 'string' &&
        varietyIdentifier.trim() !== ''
      ) {
        const varietyName = varietyIdentifier.trim();
        variety = await this.varietyRepository.findOne({
          where: {
            variety_name: varietyName,
            vegetable: { id_vegetable: vegetableId },
          },
        });

        if (!variety) {
          // Création si la variété par nom n'existe pas encore pour ce légume
          variety = await this.varietyRepository.save(
            this.varietyRepository.create({
              variety_name: varietyName,
              vegetable: vegetable,
            }),
          );
        }
        varietyIdFK = variety.id_variety;
      }

      // --------------------------------------------------------------------------
      // 2. Création/Activation du Section_Plan
      // --------------------------------------------------------------------------

      // Utilisation du paramètre d'entrée pour l'initialisation du plan
      const SECTIONS_FOR_CREATION = numberOfSection;

      const planResult = await this.createOrActivatePlan(
        boardId,
        SECTIONS_FOR_CREATION,
      );

      const currentSectionPlan = planResult.sectionPlan;
      // --------------------------------------------------------------------------

      // 3. Validité de la section (INCHANGÉ)
      if (
        sectionNumber < 1 ||
        sectionNumber > currentSectionPlan.number_of_section
      ) {
        throw new BadRequestException(
          `Section ${sectionNumber} invalide. Ce plan n'a que ${currentSectionPlan.number_of_section} sections.`,
        );
      }

      // 4. Occupation de la section — chevauchement de dates
      const existingActiveSection = await this.sectionRepository
        .createQueryBuilder('section')
        .innerJoin('section.sectionPlan', 'sp')
        .where('sp.id_section_plan = :planId', { planId: currentSectionPlan.id_section_plan })
        .andWhere('section.section_number = :num', { num: sectionNumber })
        .andWhere('section.start_date < :endDate', { endDate })
        .andWhere('section.end_date > :startDate', { startDate })
        .getOne();
      if (existingActiveSection) {
        throw new BadRequestException(
          `Cette section est déjà occupée sur la période demandée.`,
        );
      }

      // 5. Vérification de la rotation/compatibilité (INCHANGÉ)
      const plantableVegetables = await this.findPlantableVegetables(
        currentSectionPlan.id_section_plan,
        sectionNumber,
        startDate,
        endDate,
      );
      const isVegetablePlantable = plantableVegetables.some(
        (pv) => pv.vegetableId === vegetableId,
      );

      if (!isVegetablePlantable && !bypass) {
        const checkResult = await this.canPlantVegetable(
          boardId,
          vegetableId,
          bypass,
        );
        if (checkResult.status === 'WARNING') {
          return {
            status: 'WARNING',
            reason:
              checkResult.reason ??
              'Violation des règles de rotation détectée.',
            neededBypass: checkResult.neededBypass ?? true,
          };
        }
      }

      // 6. Créer la section (INCHANGÉ)
      const newSection = this.sectionRepository.create({
        sectionPlan: currentSectionPlan,
        section_number: sectionNumber,
        id_vegetable_fk: vegetableIdFK,
        id_variety_fk: varietyIdFK,
        start_date: startDate,
        end_date: endDate,
        quantity_planted: quantityPlanted,
        unity: unity,
        section_active: true,
      });

      const savedSection = (await this.sectionRepository.save(
        newSection,
      )) as unknown as Section;

      // 7. Retourner le résultat (INCHANGÉ)
      const sectionWithRelations = await this.sectionRepository.findOne({
        where: { id_section: savedSection.id_section },
        relations: [
          'vegetable',
          'variety',
          'vegetable.family',
          'vegetable.family.family_importance',
          'vegetable.varieties',
          'sectionPlan',
          'sectionPlan.board',
        ],
      });

      if (!sectionWithRelations) {
        throw new InternalServerErrorException(
          'Erreur lors de la récupération de la section créée.',
        );
      }

      return { status: 'OK', section: sectionWithRelations };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de l'ajout du légume.";
      throw new InternalServerErrorException(
        `Erreur addVegetableToBoard: ${errorMessage}`,
      );
    }
  }

  async getHarvestDue(daysAhead = 7): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(today.getDate() + daysAhead);

    const sections = await this.sectionRepository
      .createQueryBuilder('section')
      .leftJoinAndSelect('section.vegetable', 'vegetable')
      .leftJoinAndSelect('section.variety', 'variety')
      .leftJoinAndSelect('section.sectionPlan', 'sectionPlan')
      .leftJoinAndSelect('sectionPlan.board', 'board')
      .leftJoinAndSelect('board.sole', 'sole')
      .leftJoinAndSelect('sole.exploitation', 'exploitation')
      .where('section.section_active = true')
      .andWhere('section.end_date <= :limit', { limit })
      .orderBy('section.end_date', 'ASC')
      .getMany();

    return sections.map((s) => {
      const endDate = new Date(s.end_date);
      endDate.setHours(0, 0, 0, 0);
      const diffMs = endDate.getTime() - today.getTime();
      const daysLeft = Math.round(diffMs / 86400000);
      return {
        id_section: s.id_section,
        section_number: s.section_number,
        end_date: s.end_date,
        days_left: daysLeft,
        overdue: daysLeft < 0,
        vegetable_name: s.vegetable?.vegetable_name ?? null,
        variety_name: s.variety?.variety_name ?? null,
        board_name: s.sectionPlan?.board?.board_name ?? null,
        sole_name: s.sectionPlan?.board?.sole?.sole_name ?? null,
        exploitation_name: s.sectionPlan?.board?.sole?.exploitation?.exploitation_name ?? null,
      };
    });
  }

  async cancelSection(sectionId: number): Promise<void> {
    const section = await this.sectionRepository.findOne({
      where: { id_section: sectionId },
    });
    if (!section) throw new NotFoundException('Section introuvable');

    await this.wateringRepository.delete({ section: { id_section: sectionId } });
    await this.harvestRepository.delete({ section: { id_section: sectionId } });
    await this.observationRepository.delete({ section: { id_section: sectionId } });

    await this.sectionRepository.remove(section);
  }
}
