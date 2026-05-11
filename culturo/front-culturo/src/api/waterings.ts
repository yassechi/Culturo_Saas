import apiClient from './client';

export interface CreateWateringPayload {
  watering_date: string;
  id_section: number;
}

export interface CreateBulkWateringPayload {
  watering_date: string;
  section_ids?: number[];
  board_id?: number;
  sole_id?: number;
}

export const wateringsApi = {
  findAll() {
    return apiClient.get('/waterings');
  },
  findBySection(sectionId: number) {
    return apiClient.get(`/waterings/section/${sectionId}`);
  },
  create(dto: CreateWateringPayload) {
    return apiClient.post('/waterings', dto);
  },
  createBulk(dto: CreateBulkWateringPayload) {
    return apiClient.post('/waterings/bulk', dto);
  },
  remove(id: number) {
    return apiClient.delete(`/waterings/${id}`);
  },
};
