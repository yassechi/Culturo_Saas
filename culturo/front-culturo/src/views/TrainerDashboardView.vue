<template>
  <div class="trainer-dashboard">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Tableau de bord formateur</p>
        <h1>Vue d’ensemble des saisies stagiaires</h1>
        <p>
          Suivez la dynamique du groupe, identifiez les validations prioritaires
          et gardez un œil sur les parcelles qui concentrent le plus de retours
          terrain.
        </p>
      </div>

      <RouterLink class="primary-button cta-link" to="/validation">
        Ouvrir la file de validation
      </RouterLink>
    </section>

    <div v-if="store.error" class="error-banner">{{ store.error }}</div>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Observations</span>
        <strong>{{ store.trainerSummary.total }}</strong>
        <small>Total collecté</small>
      </article>
      <article class="stat-card">
        <span>En attente</span>
        <strong>{{ store.trainerSummary.pending }}</strong>
        <small>À traiter en priorité</small>
      </article>
      <article class="stat-card">
        <span>Validées</span>
        <strong>{{ store.trainerSummary.approved }}</strong>
        <small>Retours clôturés</small>
      </article>
      <article class="stat-card">
        <span>Planches suivies</span>
        <strong>{{ store.trainerSummary.observedBoards }}</strong>
        <small>Avec activité terrain</small>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Priorités</p>
            <h2>Observations à relire maintenant</h2>
          </div>
          <span class="panel-chip">{{ priorityObservations.length }} affichée(s)</span>
        </div>

        <div v-if="store.loadingTrainer" class="empty-state">
          Chargement du tableau de bord...
        </div>
        <div v-else-if="priorityObservations.length === 0" class="empty-state">
          Aucune observation en attente pour le moment.
        </div>
        <div v-else class="priority-list">
          <article
            v-for="observation in priorityObservations"
            :key="observation.id_observation"
            class="priority-card"
          >
            <div class="priority-head">
              <strong>{{ contributorName(observation) }}</strong>
              <span>{{ formatDate(observation.observation_date) }}</span>
            </div>
            <p>{{ observation.notes }}</p>
            <small>
              {{ observation.section.sectionPlan?.board?.board_name }} ·
              Section {{ observation.section.section_number }} ·
              {{ observation.section.vegetable?.vegetable_name ?? 'culture non renseignée' }}
            </small>
          </article>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Contributeurs</p>
            <h2>Activité par stagiaire</h2>
          </div>
          <span class="panel-chip">{{ store.contributors.length }} contributeur(s)</span>
        </div>

        <div v-if="store.contributors.length === 0" class="empty-state compact">
          L’activité par stagiaire apparaîtra ici dès les premières saisies.
        </div>
        <div v-else class="contributor-list">
          <article
            v-for="contributor in store.contributors.slice(0, 6)"
            :key="contributor.userId"
            class="contributor-card"
          >
            <strong>{{ contributor.displayName }}</strong>
            <div class="contributor-metrics">
              <span>{{ contributor.submittedCount }} saisie(s)</span>
              <span>{{ contributor.pendingCount }} en attente</span>
            </div>
          </article>
        </div>
      </article>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Flux récent</p>
          <h2>Dernières observations reçues</h2>
        </div>
        <span class="panel-chip">{{ store.latestTrainerObservations.length }} plus récentes</span>
      </div>

      <div v-if="store.latestTrainerObservations.length === 0" class="empty-state compact">
        Le flux d’activité s’affichera ici.
      </div>
      <div v-else class="recent-grid">
        <article
          v-for="observation in store.latestTrainerObservations"
          :key="observation.id_observation"
          class="recent-card"
        >
          <div class="recent-head">
            <strong>{{ contributorName(observation) }}</strong>
            <span class="status-badge" :class="statusClass(observation.review_status)">
              {{ statusLabel(observation.review_status) }}
            </span>
          </div>
          <p>{{ observation.notes }}</p>
          <small>
            {{ observation.section.sectionPlan?.board?.sole?.exploitation?.exploitation_name }}
            · {{ observation.section.sectionPlan?.board?.board_name }}
            · Section {{ observation.section.section_number }}
          </small>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useObservationsStore } from '@/stores/observations';
import type { ObservationRecord, ObservationReviewStatus } from '@/types/observations';

const store = useObservationsStore();

const priorityObservations = computed(() => store.pendingObservations.slice(0, 5));

onMounted(() => {
  if (store.trainerObservations.length === 0) {
    void store.loadTrainerObservations();
  }
});

function contributorName(observation: ObservationRecord) {
  const fullName = `${observation.author.user_first_name} ${observation.author.user_last_name}`.trim();
  return fullName || observation.author.email;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: ObservationReviewStatus) {
  if (status === 'approved') return 'Validée';
  if (status === 'changes_requested') return 'À corriger';
  return 'En attente';
}

function statusClass(status: ObservationReviewStatus) {
  return {
    'status-pending': status === 'pending',
    'status-approved': status === 'approved',
    'status-changes': status === 'changes_requested',
  };
}
</script>

<style scoped>
.trainer-dashboard {
  display: grid;
  gap: 1.2rem;
}

.hero-card,
.stat-card,
.panel-card,
.priority-card,
.contributor-card,
.recent-card {
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
}

.hero-copy h1,
.panel-head h2 {
  margin: 0.35rem 0 0.5rem;
  color: var(--brand-deep);
}

.hero-copy p:last-child {
  margin: 0;
  color: var(--text-muted);
  max-width: 60ch;
}

.cta-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.stats-grid,
.content-grid,
.recent-grid {
  display: grid;
  gap: 1rem;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  display: grid;
  gap: 0.25rem;
  padding: 1rem;
}

.stat-card span {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 800;
}

.stat-card strong {
  font-size: 1.65rem;
  color: var(--brand-deep);
}

.stat-card small {
  color: var(--text-muted);
}

.content-grid {
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.9fr);
  align-items: start;
}

.panel-card {
  padding: 1.3rem;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1rem;
}

.panel-chip,
.status-badge {
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
}

.panel-chip {
  background: rgba(39, 65, 53, 0.08);
  color: var(--brand-deep);
}

.priority-list,
.contributor-list {
  display: grid;
  gap: 0.85rem;
}

.priority-card,
.contributor-card,
.recent-card {
  padding: 1rem;
}

.priority-head,
.recent-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.priority-head strong,
.recent-head strong,
.contributor-card strong {
  color: var(--brand-deep);
}

.priority-card p,
.recent-card p,
.priority-card small,
.recent-card small {
  margin: 0;
}

.priority-card p,
.recent-card p {
  margin-top: 0.55rem;
}

.priority-card span,
.priority-card small,
.recent-card small,
.contributor-metrics {
  color: var(--text-muted);
}

.contributor-card {
  display: grid;
  gap: 0.35rem;
}

.contributor-metrics {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.92rem;
}

.recent-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.recent-card {
  display: grid;
  gap: 0.65rem;
}

.status-pending {
  background: rgba(181, 106, 67, 0.14);
  color: #8b4d2d;
}

.status-approved {
  background: rgba(74, 103, 65, 0.14);
  color: #35552f;
}

.status-changes {
  background: rgba(160, 87, 24, 0.14);
  color: #9c4f1c;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 220px;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed rgba(39, 65, 53, 0.16);
  border-radius: var(--radius-lg);
}

.compact {
  min-height: 150px;
}

@media (max-width: 1100px) {
  .stats-grid,
  .recent-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .hero-card,
  .content-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: start;
  }
}

@media (max-width: 720px) {
  .stats-grid,
  .recent-grid {
    grid-template-columns: 1fr;
  }

  .panel-head,
  .priority-head,
  .recent-head,
  .contributor-metrics {
    flex-direction: column;
  }
}
</style>
