import apiClient from './client';
import type { DashboardSummary } from '@/types/statistics';

export const statisticsApi = {
  getDashboard() {
    return apiClient.get<DashboardSummary>('/statistics/dashboard');
  },
};
