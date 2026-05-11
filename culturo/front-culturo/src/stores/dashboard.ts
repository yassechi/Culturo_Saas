import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { statisticsApi } from '@/api/statistics';
import type { DashboardSummary } from '@/types/statistics';

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const planning = computed(() => summary.value?.planning ?? null);
  const observations = computed(() => summary.value?.observations ?? null);
  const rotationAlerts = computed(() => summary.value?.rotations.alerts ?? []);
  const recentObservations = computed(() => summary.value?.recentObservations ?? []);
  const contributors = computed(() => summary.value?.contributors ?? []);

  async function loadDashboard() {
    loading.value = true;
    error.value = null;

    try {
      const response = await statisticsApi.getDashboard();
      summary.value = response.data;
    } catch {
      error.value = 'Impossible de charger les statistiques du tableau de bord.';
    } finally {
      loading.value = false;
    }
  }

  return {
    summary,
    loading,
    error,
    planning,
    observations,
    rotationAlerts,
    recentObservations,
    contributors,
    loadDashboard,
  };
});
