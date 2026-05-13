import type { ObservationRecord } from './observations';

export interface DashboardPlanningSummary {
  activeBoards: number;
  activeSoles: number;
  activeExploitations: number;
  totalSections: number;
  occupiedSections: number;
  occupancyRate: number;
}

export interface DashboardObservationsSummary {
  total: number;
  pending: number;
  approved: number;
  changesRequested: number;
  recentSevenDays: number;
}

export interface DashboardRotationAlert {
  boardId: number;
  boardName: string;
  soleName: string | null;
  exploitationName: string | null;
  familyId: number;
  familyName: string;
  lastCultivationDate: string | null;
  activeThisYear: boolean;
  ruleType: 'rotation_5y' | 'cohabitation';
  description?: string;
}

export interface DashboardContributor {
  userId: number;
  displayName: string;
  submittedCount: number;
  pendingCount: number;
}

export interface DashboardSummary {
  generatedAt: string;
  role: string;
  planning: DashboardPlanningSummary;
  observations: DashboardObservationsSummary;
  rotations: {
    alertCount: number;
    alerts: DashboardRotationAlert[];
  };
  contributors: DashboardContributor[];
  recentObservations: ObservationRecord[];
}
