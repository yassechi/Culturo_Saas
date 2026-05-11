// culturo/front-culturo/src/api/soilBoards.ts
import apiClient from './client';

export interface ApiExploitation {
  id_exploitation: number;
  exploitation_name: string;
  exploitation_locality: string;
  exploitation_active: string;
  soles?: ApiSole[];
}

export interface ApiSole {
  id_sole: number;
  sole_name: string;
  sole_active: boolean;
  exploitation?: { id_exploitation: number; exploitation_name: string };
  boards?: ApiBoard[];
}

export interface ApiBoard {
  id_board: number;
  board_name: string;
  board_width: number;
  board_length: number;
  board_active: boolean;
  id_sole: number;
  sectionPlans?: unknown[];
}

// Payloads
export interface CreateExploitationPayload {
  exploitation_name: string;
  exploitation_locality: string;
  exploitation_active: string;
  id_user: number;
}

export interface UpdateExploitationPayload {
  id_exploitation: number;
  exploitation_name?: string;
  exploitation_locality?: string;
  exploitation_active?: string;
}

export interface CreateSolePayload {
  sole_name: string;
  id_exploitation: number;
}

export interface UpdateSolePayload {
  id_sole: number;
  sole_name?: string;
  id_exploitation?: number;
}

export interface CreateBoardPayload {
  board_name: string;
  board_width: number;
  board_lenght: number; // typo in backend DTO — must match
  board_active: boolean;
  id_sole: number;
}

export interface UpdateBoardPayload {
  id_board: number;
  board_name: string;
  board_width: number;
  board_lenght: number; // typo in backend DTO — must match
  board_active: boolean;
  id_sole: number;
}

export const soilBoardsApi = {
  // Exploitations
  getAllExploitations() {
    return apiClient.get<ApiExploitation[]>('/exploitation');
  },
  createExploitation(payload: CreateExploitationPayload) {
    return apiClient.post<ApiExploitation>('/exploitation', payload);
  },
  updateExploitation(payload: UpdateExploitationPayload) {
    return apiClient.put<ApiExploitation>('/exploitation', payload);
  },

  // Soles
  getAllSoles() {
    return apiClient.get<ApiSole[]>('/sole');
  },
  createSole(payload: CreateSolePayload) {
    return apiClient.post<ApiSole>('/sole', payload);
  },
  updateSole(payload: UpdateSolePayload) {
    return apiClient.put<ApiSole>('/sole', payload);
  },
  deleteSole(id: number) {
    return apiClient.delete(`/sole/${id}`);
  },

  // Boards
  createBoard(payload: CreateBoardPayload) {
    return apiClient.post<ApiBoard>('/boards', payload);
  },
  updateBoard(payload: UpdateBoardPayload) {
    return apiClient.put<ApiBoard>('/boards', payload);
  },
  deleteBoard(id: number) {
    return apiClient.delete(`/boards/${id}`);
  },
};
