import apiClient from './client';

export interface CreateHarvestPayload {
  harvest_date: string;
  quantity: number;
  quantity_unit: string;
  userId: number;
  id_section: number;
}

export const harvestsApi = {
  create(dto: CreateHarvestPayload) {
    return apiClient.post('/harvests', dto);
  },
  findAll() {
    return apiClient.get('/harvests');
  },
  remove(id: number) {
    return apiClient.delete(`/harvests/${id}`);
  },
};
