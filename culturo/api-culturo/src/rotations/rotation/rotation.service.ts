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
  section_section_number: number;
  vegetable_vegetable_name: string;
  section_start_date: Date;
  section_end_date: Date;
}

// --- Type Guard Utile ---
function isError(error: unknown): error is Error {
  return error instanceof Error;
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
      .leftJoin('section.sectionPlan', 'sectionPlan')
      .leftJoin('sectionPlan.board', 'board')
      .leftJoin('board.sole', 'sole')
      .where('sole.id_sole = :soleId', { soleId })
      .andWhere('section.start_date <= :endDate', { endDate })
      .andWhere('section.end_date >= :startDate', { startDate })
      .select([
        'board.id_board',
        'board.board_name',
        'section.section_number',
        'vegetable.vegetable_name',
        'section.start_date',
        'section.end_date',
      ])
      .orderBy('board.board_name', 'ASC')
      .addOrderBy('section.section_number', 'ASC')
      .getRawMany<RawCulturePlanResult>();

    return results.map((r) => ({
      boardId: r.board_id_board,
      boardName: r.board_board_name,
      sectionNumber: r.section_section_number,
      vegetableName: r.vegetable_vegetable_name,
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

    if (!isPrimary) {
      return { status: 'OK' };
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

    for (const section of sections) {
      const secVegetable = section.vegetable;
      if (!secVegetable?.family?.family_importance) continue;

      const secFamilyId = secVegetable.family.id_family;
      const secIsPrimary =
        secVegetable.family.family_importance.importance_name === 'primaire';

      // RÈGLE 1 — Rotation 5 ans (MÊME famille)
      if (
        !section.section_active &&
        section.end_date &&
        secFamilyId === family.id_family
      ) {
        alreadyPlantedIn5Years = true;
      }

      // RÈGLE 2 — Cohabitation (TOUTE famille primaire ACTIVE)
      if (section.section_active === true && secIsPrimary) {
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

    // OK
    return { status: 'OK' };
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

          // RÈGLE 1 : Cohabitation de familles primaires actives
          if (section.section_active && section.vegetable.family) {
            const activeFamilyId = section.vegetable.family.id_family;
            const isActivePrimary =
              section.vegetable.family.family_importance?.importance_name ===
              'primaire';

            if (isActivePrimary && activeFamilyId !== targetFamilyId) {
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

            // RÈGLE SECTION : Occupation physique "chevauchent"
            const isOccupiedDuringPeriod =
              section.section_active ||
              (section.start_date <= endDate && section.end_date >= startDate);

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
      // 1. Récupérer le SectionPlan avec toutes ses sections
      const sectionPlan = await this.sectionPlanRepository.findOne({
        where: { id_section_plan: sectionPlanId },
        relations: [
          'board',
          'sections',
          'sections.vegetable',
          'sections.vegetable.family',
          'sections.vegetable.family.family_importance',
        ],
      });

      if (!sectionPlan) {
        throw new NotFoundException(`SectionPlan ${sectionPlanId} non trouvé.`);
      }

      if (sectionNumber < 1 || sectionNumber > sectionPlan.number_of_section) {
        throw new BadRequestException(
          `Section ${sectionNumber} invalide. Board a ${sectionPlan.number_of_section} sections.`,
        );
      }

      // Occupation physique
      const sectionsAtLocation = sectionPlan.sections.filter(
        (s) => s.section_number === sectionNumber,
      );

      for (const section of sectionsAtLocation) {
        if (!section.vegetable) continue;

        const isOccupiedDuringPeriod =
          section.section_active ||
          (section.start_date <= endDate && section.end_date >= startDate);

        if (isOccupiedDuringPeriod) {
          return [];
        }
      }

      // Borad
      const fiveYearsAgo = new Date(startDate);
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      // Familles primaires actuellement actives sur la board
      const activePrimaryFamilies = new Set<number>();

      // Familles primaires plantées dans les 5 dernières années sur la board
      const recentPrimaryFamilies = new Set<number>();

      for (const section of sectionPlan.sections) {
        if (!section.vegetable?.family) continue;

        const familyId = section.vegetable.family.id_family;
        const isPrimary =
          section.vegetable.family.family_importance?.importance_name ===
          'primaire';

        if (!isPrimary) continue;

        // Collecter les familles primaires actives
        if (section.section_active) {
          activePrimaryFamilies.add(familyId);
        }

        // Collecter les familles primaires récentes (5 ans)
        if (section.end_date >= fiveYearsAgo) {
          recentPrimaryFamilies.add(familyId);
        }
      }

      // legumes Board
      const allVegetables = await this.vegetableRepository.find({
        relations: ['family', 'family.family_importance'],
      });

      // Filter les légumes
      const plantableVegetables: PlantableVegetableDto[] = [];

      for (const vegetable of allVegetables) {
        if (!vegetable.family?.family_importance) continue;

        const familyId = vegetable.family.id_family;
        const isPrimary =
          vegetable.family.family_importance.importance_name === 'primaire';

        let isPlantable = true;

        //Cohabitation
        if (isPrimary && activePrimaryFamilies.size > 0) {
          if (!activePrimaryFamilies.has(familyId)) {
            isPlantable = false;
          }
        }

        // Rotation 5 ans
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
            lastPlantedInSection:
              sectionsAtLocation.length > 0
                ? (sectionsAtLocation[sectionsAtLocation.length - 1].vegetable
                    ?.vegetable_name ?? null)
                : null,
            neverPlantedInSection: sectionsAtLocation.length === 0,
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
    startDate: Date,
    endDate: Date,
    quantityPlanted: number = 0,
    bypass: boolean = false,
    unity: string,
    varietyIdentifier: string | number,
    numberOfSection: number, // PARAMÈTRE RÉINTRODUIT ET UTILISÉ
  ): Promise<PlantingResult> {
    try {
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

      // 4. Occupation de la section (INCHANGÉ)
      const existingActiveSection = await this.sectionRepository.findOne({
        where: {
          sectionPlan: { id_section_plan: currentSectionPlan.id_section_plan },
          section_number: sectionNumber,
          section_active: true,
        },
        relations: ['vegetable'],
      });
      if (existingActiveSection) {
        throw new BadRequestException(
          `Une section active existe déjà avec le numéro ${sectionNumber}.`,
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
