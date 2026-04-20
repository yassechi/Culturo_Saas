// culturo/front-culturo/src/api/rotations.ts
import apiClient from './client';
import type { CulturePlanEntry, PlantableVegetable, SectionPlanResult, CanPlantResult } from '@/types/planning';

export const rotationsApi = {
  getCulturePlan(soleId: number, year: number) {
    return apiClient.get<CulturePlanEntry[]>(`/rotations/plan/${soleId}`, {
      params: { year },
    });
  },

  createOrGetSectionPlan(boardId: number) {
    return apiClient.post<SectionPlanResult>(`/rotations/plan-section`, null, {
      params: { boardId },
    });
  },

  getPlantableVegetables(
    sectionPlanId: number,
    sectionNumber: number,
    startDate: string,
    endDate: string,
  ) {
    return apiClient.get<PlantableVegetable[]>('/rotations/plantable-vegetables', {
      params: { sectionPlanId, sectionNumber, startDate, endDate },
    });
  },

  addVegetableToBoard(dto: {
    boardId: number;
    sectionNumber: number;
    vegetableId: number;
    startDate: string;
    endDate: string;
    quantityPlanted?: number;
    unity?: string;
    varietyIdentifier: string;
    bypass?: boolean;
  }) {
    return apiClient.post('/rotations/add-vegetable', dto);
  },

  canPlantVegetable(boardId: number, vegetableId: number, bypass = false) {
    return apiClient.post<CanPlantResult>('/rotations/can', { boardId, vegetableId, bypass });
  },
};
