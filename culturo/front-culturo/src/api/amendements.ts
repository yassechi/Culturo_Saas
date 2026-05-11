import apiClient from './client';

export interface CreateAmendementPayload {
  amendment_date: string;
  id_amendement: number;
  id_board: number;
  quantity?: number;
  quantity_unit?: string;
  description?: string;
}

export interface CreateBulkAmendementPayload {
  amendment_date: string;
  id_amendement: number;
  id_sole: number;
  quantity?: number;
  quantity_unit?: string;
  description?: string;
}

export interface CreateCataloguePayload {
  amendment_name: string;
  notice?: string;
}

export const amendementsApi = {
  // Catalogue
  findAllCatalogue() {
    return apiClient.get('/amendements/catalogue');
  },
  createCatalogue(dto: CreateCataloguePayload) {
    return apiClient.post('/amendements/catalogue', dto);
  },
  updateCatalogue(id: number, dto: Partial<CreateCataloguePayload>) {
    return apiClient.put(`/amendements/catalogue/${id}`, dto);
  },
  removeCatalogue(id: number) {
    return apiClient.delete(`/amendements/catalogue/${id}`);
  },

  // Applications
  findAll() {
    return apiClient.get('/amendements');
  },
  findByBoard(boardId: number) {
    return apiClient.get(`/amendements/board/${boardId}`);
  },
  create(dto: CreateAmendementPayload) {
    return apiClient.post('/amendements', dto);
  },
  createBulk(dto: CreateBulkAmendementPayload) {
    return apiClient.post('/amendements/bulk', dto);
  },
  remove(id: number) {
    return apiClient.delete(`/amendements/${id}`);
  },
};
