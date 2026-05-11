<template>
  <div class="culture-plan-view">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Plan de culture</p>
        <h1>Lecture simple du planning</h1>
        <p>
          Consultez la sole active, les cultures présentes sur chaque planche et
          les périodes prévues sans ouvrir les outils d’édition.
        </p>
      </div>

      <div class="hero-controls">
        <label class="year-field">
          <span>Année</span>
          <input
            :value="store.selectedYear"
            type="number"
            min="2020"
            max="2035"
            @change="handleYearChange"
          />
        </label>
        <article class="metric-card">
          <span>Planches visibles</span>
          <strong>{{ store.boardsForSelectedSole.length }}</strong>
        </article>
      </div>
    </section>

    <PlanSelector />

    <div v-if="store.planError" class="error-banner">{{ store.planError }}</div>

    <div v-if="!store.selectedSoleId" class="empty-state">
      Sélectionnez une exploitation et une sole pour consulter le plan de culture.
    </div>

    <section v-else class="plan-shell">
      <header class="shell-header">
        <div>
          <p class="eyebrow">Vue stagiaire</p>
          <h2>{{ store.selectedSole?.sole_name }} · {{ store.selectedYear }}</h2>
        </div>
        <span class="shell-chip">
          {{ store.planLoading ? 'Chargement...' : `${occupiedSections} section(s) occupée(s)` }}
        </span>
      </header>

      <div v-if="store.planLoading" class="empty-state compact">
        Chargement du plan de culture...
      </div>
      <div v-else-if="store.boardsForSelectedSole.length === 0" class="empty-state compact">
        Aucune planche configurée pour cette sole.
      </div>
      <div v-else class="board-grid">
        <article
          v-for="board in store.boardsForSelectedSole"
          :key="board.id_board"
          class="board-card"
        >
          <div class="board-head">
            <div>
              <strong>{{ board.board_name }}</strong>
              <span>{{ sectionCountFor(board.id_board) }} section(s)</span>
            </div>
          </div>

          <div class="section-list">
            <article
              v-for="section in sectionsForBoard(board.id_board)"
              :key="`${board.id_board}-${section.sectionNumber}`"
              class="section-card"
              :class="section.status"
            >
              <div class="section-title">
                <span>Section {{ section.sectionNumber }}</span>
                <strong>{{ section.status === 'occupied' ? 'Occupée' : 'Disponible' }}</strong>
              </div>

              <p v-if="section.vegetableName" class="section-veg">
                {{ section.vegetableName }}
              </p>
              <p v-else class="section-veg muted">
                Aucun légume affecté sur la période visible.
              </p>

              <small v-if="section.startDate && section.endDate">
                {{ formatDate(section.startDate) }} → {{ formatDate(section.endDate) }}
              </small>
            </article>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import PlanSelector from '@/components/planning/PlanSelector.vue';
import { usePlanningStore } from '@/stores/planning';

const store = usePlanningStore();

const occupiedSections = computed(
  () => store.culturePlan.filter((entry) => Boolean(entry.vegetableName)).length,
);

onMounted(() => {
  if (store.soles.length === 0) {
    void store.loadSoles();
  }
});

function handleYearChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value) && value >= 2020) {
    void store.selectYear(value);
  }
}

function sectionCountFor(boardId: number) {
  return store.boardSectionsCount.get(boardId) ?? 0;
}

function sectionsForBoard(boardId: number) {
  const count = sectionCountFor(boardId);
  return Array.from({ length: count }, (_, index) => {
    const sectionNumber = index + 1;
    return (
      store.sectionDisplayMap.get(`${boardId}-${sectionNumber}`) ?? {
        sectionNumber,
        status: 'available' as const,
      }
    );
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>

<style scoped>
.culture-plan-view {
  display: grid;
  gap: 1.2rem;
}

.hero-card,
.metric-card,
.plan-shell,
.board-card,
.section-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(251, 246, 235, 0.88));
  border: 1px solid var(--brand-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
  margin: 0 1.5rem;
}

.hero-copy h1,
.shell-header h2 {
  margin: 0.35rem 0 0.5rem;
  color: var(--brand-deep);
}

.hero-copy p:last-child {
  margin: 0;
  max-width: 62ch;
  color: var(--text-muted);
}

.hero-controls {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.85rem;
  align-items: end;
}

.year-field {
  display: grid;
  gap: 0.35rem;
}

.year-field span,
.metric-card span,
.shell-chip {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
}

.year-field input {
  width: 120px;
  padding: 0.85rem 0.95rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.92);
}

.metric-card {
  display: grid;
  gap: 0.2rem;
  padding: 0.95rem 1rem;
}

.metric-card span,
.year-field span {
  color: var(--text-muted);
}

.metric-card strong {
  font-size: 1.55rem;
  color: var(--brand-deep);
}

.plan-shell {
  margin: 0 1.5rem 1.5rem;
  padding: 1.3rem;
}

.shell-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1rem;
}

.shell-chip {
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  background: rgba(39, 65, 53, 0.08);
  color: var(--brand-deep);
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.board-card {
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.board-head strong {
  display: block;
  color: var(--brand-deep);
}

.board-head span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.section-list {
  display: grid;
  gap: 0.75rem;
}

.section-card {
  padding: 0.9rem;
  display: grid;
  gap: 0.4rem;
}

.section-card.available {
  border-color: rgba(39, 65, 53, 0.12);
}

.section-card.occupied {
  border-color: rgba(74, 103, 65, 0.28);
  background: linear-gradient(180deg, rgba(234, 244, 230, 0.92), rgba(251, 246, 235, 0.88));
}

.section-title {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
}

.section-title span {
  font-weight: 700;
}

.section-title strong {
  font-size: 0.9rem;
  color: var(--brand-deep);
}

.section-veg,
.section-card small {
  margin: 0;
}

.section-veg {
  font-weight: 600;
}

.muted,
.section-card small {
  color: var(--text-muted);
}

.empty-state {
  display: grid;
  place-items: center;
  margin: 0 1.5rem;
  min-height: 220px;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed rgba(39, 65, 53, 0.16);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.55);
}

.compact {
  margin: 0;
  min-height: 180px;
}

@media (max-width: 920px) {
  .hero-card {
    margin-inline: 1rem;
    flex-direction: column;
    align-items: start;
  }

  .plan-shell,
  .empty-state {
    margin-inline: 1rem;
  }
}

@media (max-width: 720px) {
  .hero-controls,
  .shell-header,
  .section-title {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .hero-controls {
    width: 100%;
  }

  .year-field input {
    width: 100%;
  }
}
</style>
