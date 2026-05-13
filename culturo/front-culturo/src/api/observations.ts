import apiClient from './client';
import type {
  CreateObservationPayload,
  ObservationRecord,
  ObservationReviewStatus,
  ObservationSectionSummary,
  ReviewObservationPayload,
} from '@/types/observations';

export interface ObservationQuery {
  mine?: boolean;
  reviewStatus?: ObservationReviewStatus;
  sectionId?: number;
  boardId?: number;
  soleId?: number;
  authorId?: number;
  search?: string;
}

export const observationsApi = {
  getObservations(params?: ObservationQuery) {
    return apiClient.get<ObservationRecord[]>('/observations', { params });
  },

  getActiveSections() {
    return apiClient.get<ObservationSectionSummary[]>('/observations/sections/active');
  },

  createObservation(payload: CreateObservationPayload) {
    return apiClient.post<ObservationRecord>('/observations', payload);
  },

  reviewObservation(id: number, payload: ReviewObservationPayload) {
    return apiClient.patch<ObservationRecord>(`/observations/${id}/review`, payload);
  },

  markAllSeen() {
    return apiClient.patch<{ ok: boolean }>('/observations/mark-seen');
  },
};
