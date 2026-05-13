// culturo/front-culturo/src/api/rotations.ts
import apiClient from './client';
import type {
  CulturePlanEntry,
  PlantableVegetable,
  PlantableSection,
  SectionPlanResult,
  CanPlantResult,
} from '@/types/planning';

export const rotationsApi = {
  getCulturePlan(soleId: number, year: number, month?: number, periodMonths?: number) {
    return apiClient.get<CulturePlanEntry[]>(`/rotations/plan/${soleId}`, {
      params: {
        year,
        ...(month !== undefined && { month }),
        ...(periodMonths !== undefined && { periodMonths }),
      },
    });
  },

  createOrGetSectionPlan(boardId: number, numberOfSections?: number) {
    return apiClient.post<SectionPlanResult>(`/rotations/plan-section`, undefined, {
      params: {
        boardId,
        ...(numberOfSections !== undefined && { numberOfSections }),
      },
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

  getPlantableSections(vegetableId: number, startDate: string, endDate: string) {
    return apiClient.get<PlantableSection[]>('/rotations/plantable-sections', {
      params: { vegetableId, startDate, endDate },
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

  cancelSection(sectionId: number) {
    return apiClient.delete(`/rotations/section/${sectionId}`);
  },

  canPlantVegetable(
    boardId: number,
    vegetableId: number,
    startDate?: string,
    endDate?: string,
    bypass = false,
  ) {
    return apiClient.post<CanPlantResult>('/rotations/can', {
      boardId,
      vegetableId,
      startDate,
      endDate,
      bypass,
    });
  },
};
