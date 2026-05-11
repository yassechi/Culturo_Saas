<template>
  <div class="planning-view">
    <section class="planning-hero">
      <div class="planning-hero-copy">
        <p class="planning-hero-eyebrow">Phase 4</p>
        <h2>Planification des cultures</h2>
        <p class="planning-hero-text">
          Parcourez le calendrier par tranche de 3 mois, comparez les planches occupées
          et ouvrez une section pour affecter une culture compatible.
        </p>
      </div>

      <div v-if="store.selectedSoleId && !auth.isStagiaire" class="hero-search-cta">
        <button type="button" class="btn-veg-search" @click="store.openVegetableSearch()">
          Trouver une section pour un légume →
        </button>
      </div>

      <div class="planning-hero-metrics" aria-label="Résumé de la planification">
        <article class="hero-metric">
          <span>Fenêtre</span>
          <strong>{{ visibleWindowLabel }}</strong>
          <small>{{ planningYear }}</small>
        </article>
        <article class="hero-metric">
          <span>Sole</span>
          <strong>{{ store.selectedSole?.sole_name ?? 'Aucune' }}</strong>
          <small>
            {{ store.selectedSole ? 'Prête à planifier' : 'Sélectionnez une exploitation' }}
          </small>
        </article>
        <article class="hero-metric">
          <span>Planches</span>
          <strong>{{ selectedBoardCount }}</strong>
          <small>Vue calendrier</small>
        </article>
      </div>
    </section>

    <PlanSelector />

    <div v-if="!store.selectedSoleId" class="no-selection">
      <p>Sélectionnez une exploitation et une sole pour afficher le plan de culture.</p>
    </div>

    <div v-else class="plan-content">
      <div v-if="store.planLoading" class="loading-state">
        <p>Chargement du plan de culture...</p>
      </div>
      <div v-else-if="store.planError" class="error-state">
        <p>{{ store.planError }}</p>
      </div>
      <div v-else-if="store.boardsForSelectedSole.length === 0" class="empty-state">
        <p>Aucune planche configurée pour la sole sélectionnée.</p>
      </div>
      <template v-else>
        <div class="plan-header">
          <div>
            <p class="plan-eyebrow">Vue calendrier</p>
            <h2>Plan de culture {{ planningYear }} - {{ store.selectedSole?.sole_name }}</h2>
          </div>
          <span class="plan-meta">
            {{ store.boardsForSelectedSole.length }} planche(s) - fenêtre {{ visibleWindowLabel }}
          </span>
        </div>
        <CulturePlanGrid
          :year="planningYear"
          :window-start-month="visibleWindowStartMonth"
          :window-label="visibleWindowLabel"
          :can-move-backward="canMoveBackward"
          :can-move-forward="canMoveForward"
          @shift-window="shiftWindow"
          @year-change="onYearChange"
        />
      </template>
    </div>

    <SectionSidePanel v-if="store.openSection" />
    <VegetableSearchPanel v-if="store.vegetableSearchOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PlanSelector from '@/components/planning/PlanSelector.vue';
import CulturePlanGrid from '@/components/planning/CulturePlanGrid.vue';
import SectionSidePanel from '@/components/planning/SectionSidePanel.vue';
import VegetableSearchPanel from '@/components/planning/VegetableSearchPanel.vue';
import { useAuthStore } from '@/stores/auth';
import { usePlanningStore } from '@/stores/planning';

const store = usePlanningStore();
const auth = useAuthStore();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const planningYear = ref(store.selectedYear);
const visibleWindowStartMonth = ref(initialWindowStartMonth(store.selectedYear));

function initialWindowStartMonth(year: number) {
  return year === currentYear ? Math.min(currentMonth, 10) : 1;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
}

function buildWindowLabel(year: number, startMonth: number) {
  const startDate = new Date(Date.UTC(year, startMonth - 1, 1));
  const endDate = new Date(Date.UTC(year, startMonth + 2, 0));
  return `${getMonthLabel(startDate)} - ${getMonthLabel(endDate)}`;
}

const visibleWindowLabel = computed(() =>
  buildWindowLabel(planningYear.value, visibleWindowStartMonth.value),
);

const selectedBoardCount = computed(() => store.boardsForSelectedSole.length);

const canMoveBackward = computed(() => true);
const canMoveForward = computed(() => true);

function getDefaultWindowStartMonth(year: number) {
  if (store.culturePlan.length === 0) {
    return initialWindowStartMonth(year);
  }

  let bestStartMonth = initialWindowStartMonth(year);
  let bestCount = -1;

  for (let startMonth = 1; startMonth <= 10; startMonth += 1) {
    const windowStart = new Date(Date.UTC(year, startMonth - 1, 1));
    const windowEnd = new Date(Date.UTC(year, startMonth + 2, 0));
    const count = store.culturePlan.reduce((total, entry) => {
      const entryStart = new Date(entry.startDate);
      const entryEnd = new Date(entry.endDate);
      return total + (entryStart <= windowEnd && entryEnd >= windowStart ? 1 : 0);
    }, 0);

    if (count > bestCount) {
      bestCount = count;
      bestStartMonth = startMonth;
    }
  }

  return bestStartMonth;
}

async function shiftWindow(delta: number) {
  const nextValue = visibleWindowStartMonth.value + delta;
  if (nextValue > 10) {
    await onYearChange(planningYear.value + 1);
    visibleWindowStartMonth.value = 1;
  } else if (nextValue < 1) {
    await onYearChange(planningYear.value - 1);
    visibleWindowStartMonth.value = 10;
  } else {
    visibleWindowStartMonth.value = nextValue;
  }
}

async function onYearChange(value: number) {
  if (!Number.isFinite(value) || value < 2000) return;
  planningYear.value = value;
  await store.selectYear(value);
  visibleWindowStartMonth.value = getDefaultWindowStartMonth(value);
}

watch(
  () => [auth.isAuthenticated, store.soles.length] as const,
  ([isAuthenticated, solesCount]) => {
    if (isAuthenticated && solesCount === 0) {
      void store.loadSoles();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.planning-view {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  min-height: 100%;
  height: 100%;
  overflow: hidden;
  padding-bottom: 1rem;
}

.planning-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  grid-template-rows: auto auto;
  gap: 0.75rem 1.25rem;
  align-items: start;
  margin: 0 1.5rem;
  padding: 1.35rem 1.45rem;
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 251, 244, 0.98), rgba(248, 240, 220, 0.95)),
    radial-gradient(circle at top right, rgba(244, 228, 193, 0.42), transparent 36%);
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(14px);
}

.planning-hero-copy {
  display: grid;
  gap: 0.55rem;
  max-width: 720px;
  align-content: start;
}

.hero-search-cta {
  grid-column: 1;
  align-self: end;
}

.btn-veg-search {
  padding: 0.65rem 1.1rem;
  border-radius: 999px;
  border: 1.5px solid rgba(74, 103, 65, 0.3);
  background: rgba(255, 255, 255, 0.85);
  color: var(--brand-deep);
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 160ms, border-color 160ms, transform 160ms;
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
}

.btn-veg-search:hover {
  background: rgba(74, 103, 65, 0.1);
  border-color: rgba(74, 103, 65, 0.45);
  transform: translateY(-1px);
}

.planning-hero-eyebrow {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand-clay);
}

.planning-hero h2 {
  margin: 0;
  font-size: clamp(1.65rem, 3.2vw, 2.35rem);
  font-weight: 700;
  color: var(--brand-deep);
}

.planning-hero-text {
  margin: 0;
  max-width: 62ch;
  color: var(--text-muted);
  font-size: 0.98rem;
  line-height: 1.6;
}

.planning-hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  grid-row: 1 / span 2;
  grid-column: 2;
  align-self: stretch;
}

.hero-metric {
  display: grid;
  gap: 0.25rem;
  align-content: start;
  padding: 0.9rem 1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: 0 10px 22px rgba(58, 47, 24, 0.06);
}

.hero-metric span {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(39, 65, 53, 0.68);
}

.hero-metric strong {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--brand-deep);
}

.hero-metric small {
  color: rgba(39, 65, 53, 0.68);
}

.plan-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
  display: grid;
  gap: 1rem;
  margin: 0 1.5rem 1.5rem;
}

.no-selection,
.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 1.5rem;
  padding: 3rem 2rem;
  color: var(--text-muted);
  font-size: 0.98rem;
  border-radius: 24px;
  border: 1px dashed rgba(39, 65, 53, 0.14);
  background: rgba(255, 251, 244, 0.7);
  box-shadow: var(--shadow-soft);
}

.error-state {
  color: #c62828;
}

.plan-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
}

.plan-eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand-clay);
}

.plan-header h2 {
  margin: 0;
  font-size: clamp(1.45rem, 2.4vw, 2.05rem);
  font-weight: 700;
  color: var(--brand-deep);
}

.plan-meta {
  font-size: 0.84rem;
  color: rgba(39, 65, 53, 0.76);
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
  font-weight: 700;
}

@media (max-width: 900px) {
  .planning-hero {
    grid-template-columns: 1fr;
    margin-inline: 1rem;
  }

  .planning-hero-metrics {
    grid-template-columns: 1fr;
  }

  .plan-content,
  .no-selection,
  .loading-state,
  .error-state,
  .empty-state {
    margin-inline: 1rem;
  }

  .plan-content {
    margin-bottom: 1rem;
  }

}
</style>
