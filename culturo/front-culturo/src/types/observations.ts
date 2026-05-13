export type ObservationPlantStatus = 'bon' | 'moyen' | 'mauvais';
export type ObservationReviewStatus =
  | 'pending'
  | 'approved'
  | 'changes_requested';

export interface ObservationVegetableSummary {
  id_vegetable: number;
  vegetable_name: string;
}

export interface ObservationExploitationSummary {
  id_exploitation: number;
  exploitation_name: string;
}

export interface ObservationSoleSummary {
  id_sole: number;
  sole_name: string;
  exploitation?: ObservationExploitationSummary;
}

export interface ObservationBoardSummary {
  id_board: number;
  board_name: string;
  sole?: ObservationSoleSummary;
}

export interface ObservationSectionPlanSummary {
  id_section_plan: number;
  board?: ObservationBoardSummary;
}

export interface ObservationSectionSummary {
  id_section: number;
  section_number: number;
  start_date: string;
  end_date: string;
  quantity_planted: number;
  unity: string;
  section_active: boolean;
  vegetable?: ObservationVegetableSummary | null;
  sectionPlan?: ObservationSectionPlanSummary;
}

export interface ObservationUserSummary {
  id_user: number;
  user_first_name: string;
  user_last_name: string;
  email: string;
}

export interface ObservationRecord {
  id_observation: number;
  observation_date: string;
  disease_observed: string | null;
  pest_observed: string | null;
  weather_conditions: string | null;
  plant_status: ObservationPlantStatus;
  notes: string;
  review_status: ObservationReviewStatus;
  review_notes: string | null;
  reviewed_at: string | null;
  seen_by_author: boolean;
  created_at: string;
  updated_at: string;
  section: ObservationSectionSummary;
  author: ObservationUserSummary;
  reviewer: ObservationUserSummary | null;
}

export interface CreateObservationPayload {
  sectionId: number;
  observationDate: string;
  diseaseObserved?: string;
  pestObserved?: string;
  weatherConditions?: string;
  plantStatus: ObservationPlantStatus;
  notes: string;
}

export interface ReviewObservationPayload {
  reviewStatus: 'approved' | 'changes_requested';
  reviewNotes?: string;
}

export interface ObservationContributor {
  userId: number;
  displayName: string;
  submittedCount: number;
  pendingCount: number;
}
