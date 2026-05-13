import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { statisticsApi } from '@/api/statistics';
import type { DashboardSummary } from '@/types/statistics';

const DISMISSED_KEY = 'culturo:dismissed-alerts';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const dismissedAlerts = ref<Set<string>>(loadDismissed());

  const planning = computed(() => summary.value?.planning ?? null);
  const observations = computed(() => summary.value?.observations ?? null);
  const recentObservations = computed(() => summary.value?.recentObservations ?? []);
  const contributors = computed(() => summary.value?.contributors ?? []);

  const rotationAlerts = computed(() =>
    (summary.value?.rotations.alerts ?? []).filter(
      (a) => !dismissedAlerts.value.has(`${a.ruleType ?? 'rotation_5y'}-${a.boardId}-${a.familyId}`),
    ),
  );

  const rotationAlertCount = computed(() => rotationAlerts.value.length);

  function dismissAlert(boardId: number, familyId: number) {
    const key = `${boardId}-${familyId}`;
    dismissedAlerts.value = new Set([...dismissedAlerts.value, key]);
    saveDismissed(dismissedAlerts.value);
  }

  // TTL : re-fetch seulement si les données ont plus de 2 minutes
  let lastLoadedAt = 0;
  const TTL_MS = 2 * 60 * 1000;

  async function loadDashboard(force = false) {
    const stale = Date.now() - lastLoadedAt > TTL_MS;
    if (!force && !stale && summary.value !== null && !error.value) return;
    loading.value = true;
    error.value = null;

    try {
      const response = await statisticsApi.getDashboard();
      summary.value = response.data;
      lastLoadedAt = Date.now();
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
    rotationAlertCount,
    recentObservations,
    contributors,
    loadDashboard,
    dismissAlert,
  };
});
