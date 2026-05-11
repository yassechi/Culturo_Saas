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
  vegetable_id_vegetable: number;
  vegetable_vegetable_name: string;
  variety_variety_name: string | null;
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
        'vegetable.id_vegetable',
        'vegetable.vegetable_name',
        'variety.variety_name',
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

    // RÉSULTATS
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

    return seasonalityWarning ?? { status: 'OK' };
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

      // Pour chaque SectionPlan, vérifier la disponibilité
      const plantableLocations: any[] = [];

      for (const sectionPlan of allSectionPlans) {
        let isBoardAccessible = true;

        for (const section of sectionPlan.sections) {
          // Ignorer les sections sans légume
          if (!section.vegetable) {
            continue;
          }

          // RÈGLE 1 : Cohabitation de familles primaires — chevauchement avec la période demandée
          if (section.vegetable.family) {
            const activeFamilyId = section.vegetable.family.id_family;
            const isActivePrimary =
              section.vegetable.family.family_importance?.importance_name ===
              'primaire';
            const overlaps =
              new Date(section.end_date) > startDate &&
              new Date(section.start_date) < endDate;

            if (isActivePrimary && overlaps && activeFamilyId !== targetFamilyId) {
              isBoardAccessible = false;
              break;
            }
          }

          // RÈGLE 2 : Rotation 5 ans (si légume cible est primaire)
          if (isTargetPrimary && section.vegetable.family) {
            const pastFamilyId = section.vegetable.family.id_family;
            const isPastPrimary =
              section.vegetable.family.family_importance?.importance_name ===
              'primaire';

            if (
              isPastPrimary &&
              pastFamilyId === targetFamilyId &&
              section.end_date >= fiveYearsAgo
            ) {
              isBoardAccessible = false;
              break;
            }
          }
        }

        // Si la board n'est pas accessible, passer à la suivante
        if (!isBoardAccessible) {
          continue;
        }

        // Si la board est accessible => vérifier chaque section individuellement
        for (
          let sectionNumber = 1;
          sectionNumber <= sectionPlan.number_of_section;
          sectionNumber++
        ) {
          const sectionsAtLocation = sectionPlan.sections.filter(
            (s) => s.section_number === sectionNumber,
          );

          let isSectionPlantable = true;

          for (const section of sectionsAtLocation) {
            // Ignorer les sections sans légume
            if (!section.vegetable) {
              continue;
            }

            // Occupation physique stricte (fin exclusive)
            const isOccupiedDuringPeriod =
              new Date(section.start_date) < endDate && new Date(section.end_date) > startDate;

            if (isOccupiedDuringPeriod) {
              isSectionPlantable = false;
              break;
            }
          }

          // Si cette section est plantable, l'ajouter aux résultats
          if (isSectionPlantable) {
            plantableLocations.push({
              sectionPlanId: sectionPlan.id_section_plan,
              boardId: sectionPlan.board.id_board,
              boardName: sectionPlan.board.board_name,
              sectionNumber: sectionNumber,
              totalSections: sectionPlan.number_of_section,
              lastPlantedVegetable:
                sectionsAtLocation.length > 0
                  ? sectionsAtLocation[sectionsAtLocation.length - 1].vegetable
                      ?.vegetable_name
                  : null,
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

      for (const section of allBoardSections) {
        if (!section.vegetable?.family?.family_importance) continue;

        const familyId = section.vegetable.family.id_family;
        const isPrimary =
          section.vegetable.family.family_importance.importance_name === 'primaire';

        if (!isPrimary) continue;

        // Famille active si elle chevauche strictement la nouvelle période
        if (
          new Date(section.end_date) > startDate &&
          new Date(section.start_date) < endDate
        ) {
          activePrimaryFamilies.add(familyId);
        }

        // Famille plantée dans les 5 dernières années
        if (new Date(section.end_date) > fiveYearsAgo) {
          recentPrimaryFamilies.add(familyId);
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
          plantableVegetables.push({
            vegetableId: vegetable.id_vegetable,
            vegetableName: vegetable.vegetable_name,
            familyId: vegetable.family.id_family,
            familyName: vegetable.family.family_name,
            importance: vegetable.family.family_importance.importance_name,
            lastPlantedInSection: lastSectionAtLocation?.vegetable?.vegetable_name ?? null,
            neverPlantedInSection: sectionsAtLocation.filter((s) => s.vegetable).length === 0,
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
}
