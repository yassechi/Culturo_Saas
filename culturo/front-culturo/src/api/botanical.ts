// culturo/front-culturo/src/api/botanical.ts
import apiClient from './client';

export interface ApiImportance {
  id_family_importance: number;
  importance_name: string;
}

export interface ApiFamily {
  id_family: number;
  family_name: string;
  family_importance: ApiImportance;
  vegetables?: ApiVegetable[];
}

export interface ApiVegetable {
  id_vegetable: number;
  vegetable_name: string;
  planting_season: string;
  harvest_season: string;
  harvest_duration_min: number;
  harvest_duration_max: number;
  inrow_distance: number;
  in_row_spacing: number;
  estimated_yield: number;
  family: ApiFamily;
  varieties?: ApiVariety[];
}

export interface ApiVariety {
  id_variety: number;
  variety_name: string;
  vegetable?: { id_vegetable: number; vegetable_name: string };
}

export interface CreateFamilyPayload {
  family_name: string;
  id_family_importance: number;
}

export interface UpdateFamilyPayload {
  id_family: number;
  family_name?: string;
  id_family_importance?: number;
}

export interface CreateVegetablePayload {
  vegetable_name: string;
  planting_season: string;
  harvest_season: string;
  harvest_duration_min: number;
  harvest_duration_max: number;
  inrow_distance: number;
  in_row_spacing: number;
  estimated_yield: number;
  id_family: number;
}

export interface UpdateVegetablePayload extends Partial<CreateVegetablePayload> {
  id_vegetable: number;
}

export interface CreateVarietyPayload {
  variety_name: string;
  id_vegetable: number;
}

export interface UpdateVarietyPayload {
  id_variety: number;
  variety_name?: string;
  id_vegetable?: number;
}

export const botanicalApi = {
  getAllFamilies() {
    return apiClient.get<ApiFamily[]>('/family');
  },
  getAllImportances() {
    return apiClient.get<ApiImportance[]>('/family/importances');
  },
  createFamily(payload: CreateFamilyPayload) {
    return apiClient.post<ApiFamily>('/family', payload);
  },
  updateFamily(payload: UpdateFamilyPayload) {
    return apiClient.put<ApiFamily>('/family', payload);
  },
  deleteFamily(id: number) {
    return apiClient.delete(`/family/${id}`);
  },

  getAllVegetables() {
    return apiClient.get<ApiVegetable[]>('/vegetables');
  },
  createVegetable(payload: CreateVegetablePayload) {
    return apiClient.post<ApiVegetable>('/vegetables', payload);
  },
  updateVegetable(payload: UpdateVegetablePayload) {
    return apiClient.put<ApiVegetable>('/vegetables', payload);
  },
  deleteVegetable(id: number) {
    return apiClient.delete(`/vegetables/${id}`);
  },

  getVarietiesByVegetable(vegetableId: number) {
    return apiClient.get<ApiVariety[]>('/varieties', { params: { vegetable_id: vegetableId } });
  },
  createVariety(payload: CreateVarietyPayload) {
    return apiClient.post<ApiVariety>('/varieties', payload);
  },
  updateVariety(payload: UpdateVarietyPayload) {
    return apiClient.put<ApiVariety>('/varieties', payload);
  },
  deleteVariety(id: number) {
    return apiClient.delete(`/varieties/${id}`);
  },
};
