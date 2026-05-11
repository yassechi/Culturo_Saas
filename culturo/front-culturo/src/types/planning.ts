// culturo/front-culturo/src/types/planning.ts

export interface ExploitationSummary {
  id_exploitation: number;
  exploitation_name: string;
}

export interface BoardSummary {
  id_board: number;
  board_name: string;
  id_sole: number;
}

export interface SoleWithBoards {
  id_sole: number;
  sole_name: string;
  exploitation: ExploitationSummary;
  boards: BoardSummary[];
}

export interface CulturePlanEntry {
  boardId: number;
  boardName: string;
  sectionId: number;
  sectionNumber: number;
  isHarvested: boolean;
  vegetableId: number;
  vegetableName: string;
  varietyName: string | null;
  startDate: string;
  endDate: string;
}

export interface PlantableVegetable {
  vegetableId: number;
  vegetableName: string;
  familyId: number;
  familyName: string;
  importance: string;
  lastPlantedInSection: string | null;
  neverPlantedInSection: boolean;
}

export interface SectionPlanResult {
  sectionPlan: {
    id_section_plan: number;
    number_of_section: number;
    section_plan_active: boolean;
    creation_date: string;
  };
  status: 'CREATED' | 'FOUND';
}

export interface PlantableSection {
  sectionPlanId: number;
  boardId: number;
  boardName: string;
  sectionNumber: number;
  totalSections: number;
  lastPlantedVegetable: string | null;
  neverPlanted: boolean;
}

export interface CanPlantResult {
  status: 'OK' | 'WARNING';
  reason?: string;
  neededBypass?: boolean;
}

export type SectionStatus = 'occupied' | 'available' | 'loading';

export interface SectionDisplay {
  sectionNumber: number;
  status: SectionStatus;
  vegetableName?: string;
  startDate?: string;
  endDate?: string;
}

export interface VegetableGroup {
  familyName: string;
  importance: string;
  neverPlanted: boolean;
  lastPlantedDate: string | null;
  vegetables: PlantableVegetable[];
}

export interface SelectedSection {
  boardId: number;
  boardName: string;
  sectionNumber: number;
  sectionPlanId: number | null;
}

export interface AssignmentForm {
  vegetableId: number | null;
  startDate: string;
  endDate: string;
  quantityPlanted: number;
  unity: string;
  varietyIdentifier: string;
  bypass: boolean;
}

export interface RuleMessage {
  type: 'ok' | 'warning';
  text: string;
  canProceed?: boolean;
  needsBypass?: boolean;
}
