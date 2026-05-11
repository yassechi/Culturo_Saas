import apiClient from './client';

export interface CreateTreatedPayload {
  treatment_date: string;
  id_treatment: number;
  id_board: number;
  treatment_quantity?: number;
  treatment_unit?: string;
  description?: string;
}

export interface CreateBulkTreatedPayload {
  treatment_date: string;
  id_treatment: number;
  id_sole: number;
  treatment_quantity?: number;
  treatment_unit?: string;
  description?: string;
}

export interface CreateTreatmentCataloguePayload {
  treatment_name: string;
  notice?: string;
}

export const treatmentsApi = {
  // Catalogue
  findAllCatalogue() { return apiClient.get('/treated/catalogue'); },
  createCatalogue(dto: CreateTreatmentCataloguePayload) { return apiClient.post('/treated/catalogue', dto); },
  updateCatalogue(id: number, dto: Partial<CreateTreatmentCataloguePayload>) { return apiClient.put(`/treated/catalogue/${id}`, dto); },
  removeCatalogue(id: number) { return apiClient.delete(`/treated/catalogue/${id}`); },

  // Applications
  findAll() { return apiClient.get('/treated'); },
  findByBoard(boardId: number) { return apiClient.get(`/treated/board/${boardId}`); },
  create(dto: CreateTreatedPayload) { return apiClient.post('/treated', dto); },
  createBulk(dto: CreateBulkTreatedPayload) { return apiClient.post('/treated/bulk', dto); },
  remove(id: number) { return apiClient.delete(`/treated/${id}`); },
};
