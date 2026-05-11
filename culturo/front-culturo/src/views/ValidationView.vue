<template>
  <div class="validation-view">
    <section class="hero-card">
      <div>
        <p class="eyebrow">Validation pédagogique</p>
        <h1>Relecture des observations terrain</h1>
        <p>
          Priorisez les observations en attente, puis validez-les ou demandez
          des précisions au stagiaire avec un retour court et exploitable.
        </p>
      </div>

      <div class="hero-stats">
        <article class="stat-card">
          <span>En attente</span>
          <strong>{{ store.trainerSummary.pending }}</strong>
        </article>
        <article class="stat-card">
          <span>Validées</span>
          <strong>{{ store.trainerSummary.approved }}</strong>
        </article>
        <article class="stat-card">
          <span>À corriger</span>
          <strong>{{ store.trainerSummary.changesRequested }}</strong>
        </article>
      </div>
    </section>

    <div v-if="store.error" class="error-banner">{{ store.error }}</div>
    <div v-else-if="store.feedback" class="success-banner">{{ store.feedback }}</div>

    <section class="content-grid">
      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">File active</p>
            <h2>Observations à traiter</h2>
          </div>
          <span class="panel-chip">{{ store.pendingObservations.length }} à relire</span>
        </div>

        <div v-if="store.loadingTrainer" class="empty-state">
          Chargement des observations...
        </div>
        <div v-else-if="store.pendingObservations.length === 0" class="empty-state">
          Aucune observation en attente. La file est vide pour le moment.
        </div>
        <div v-else class="review-list">
          <article
            v-for="observation in store.pendingObservations"
            :key="observation.id_observation"
            class="review-card"
          >
            <div class="review-head">
              <div>
                <strong>{{ contributorName(observation) }}</strong>
                <span>
                  {{ observation.section.sectionPlan?.board?.sole?.exploitation?.exploitation_name }}
                  · {{ observation.section.sectionPlan?.board?.board_name }}
                  · Section {{ observation.section.section_number }}
                </span>
              </div>
              <span class="time-pill">{{ formatDate(observation.observation_date) }}</span>
            </div>

            <p class="review-note">{{ observation.notes }}</p>

            <div class="meta-grid">
              <span>État : {{ plantStatusLabel(observation.plant_status) }}</span>
              <span v-if="observation.disease_observed">Maladie : {{ observation.disease_observed }}</span>
              <span v-if="observation.pest_observed">Ravageur : {{ observation.pest_observed }}</span>
              <span v-if="observation.weather_conditions">Météo : {{ observation.weather_conditions }}</span>
            </div>

            <div class="review-form">
              <label class="field">
                <span>Décision</span>
                <select
                  :value="draftFor(observation.id_observation).reviewStatus"
                  @change="setDraftStatus(observation.id_observation, $event)"
                >
                  <option value="approved">Valider</option>
                  <option value="changes_requested">Demander des corrections</option>
                </select>
              </label>

              <label class="field">
                <span>Retour au stagiaire</span>
                <textarea
                  rows="3"
                  :value="draftFor(observation.id_observation).reviewNotes"
                  placeholder="Ajoutez un commentaire utile pour la suite."
                  @input="setDraftNotes(observation.id_observation, $event)"
                />
              </label>
            </div>

            <div class="review-actions">
              <button
                class="primary-button"
                type="button"
                :disabled="store.isReviewing(observation.id_observation)"
                @click="submitReview(observation.id_observation)"
              >
                {{ store.isReviewing(observation.id_observation) ? 'Enregistrement...' : 'Enregistrer la décision' }}
              </button>
            </div>
          </article>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Suivi récent</p>
            <h2>Dernières relectures</h2>
          </div>
          <span class="panel-chip">{{ store.reviewedObservations.length }} traitées</span>
        </div>

        <div v-if="store.reviewedObservations.length === 0" class="empty-state compact">
          Les décisions de validation apparaîtront ici.
        </div>
        <div v-else class="history-list">
          <article
            v-for="observation in store.reviewedObservations.slice(0, 8)"
            :key="observation.id_observation"
            class="history-card"
          >
            <div class="history-head">
              <strong>{{ contributorName(observation) }}</strong>
              <span class="status-badge" :class="statusClass(observation.review_status)">
                {{ statusLabel(observation.review_status) }}
              </span>
            </div>
            <p>{{ observation.section.sectionPlan?.board?.board_name }} · Section {{ observation.section.section_number }}</p>
            <small>{{ observation.review_notes || 'Aucun commentaire complémentaire.' }}</small>
          </article>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useObservationsStore } from '@/stores/observations';
import type {
  ObservationPlantStatus,
  ObservationRecord,
  ObservationReviewStatus,
  ReviewObservationPayload,
} from '@/types/observations';

type DraftDecision = 'approved' | 'changes_requested';

interface ReviewDraft {
  reviewStatus: DraftDecision;
  reviewNotes: string;
}

const store = useObservationsStore();
const drafts = reactive<Record<number, ReviewDraft>>({});

const reviewedCount = computed(() => store.reviewedObservations.length);

onMounted(() => {
  store.clearMessages();
  void store.loadTrainerObservations();
});

function draftFor(id: number): ReviewDraft {
  if (!drafts[id]) {
    drafts[id] = {
      reviewStatus: 'approved',
      reviewNotes: '',
    };
  }

  return drafts[id];
}

function setDraftStatus(id: number, event: Event) {
  draftFor(id).reviewStatus = (event.target as HTMLSelectElement)
    .value as DraftDecision;
}

function setDraftNotes(id: number, event: Event) {
  draftFor(id).reviewNotes = (event.target as HTMLTextAreaElement).value;
}

async function submitReview(id: number) {
  const draft = draftFor(id);
  const payload: ReviewObservationPayload = {
    reviewStatus: draft.reviewStatus,
    reviewNotes: draft.reviewNotes.trim() || undefined,
  };

  await store.reviewObservation(id, payload);
  delete drafts[id];
}

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
    'status-approved': status === 'approved',
    'status-changes': status === 'changes_requested',
  };
}

function plantStatusLabel(status: ObservationPlantStatus) {
  if (status === 'bon') return 'Bon';
  if (status === 'moyen') return 'Moyen';
  return 'Mauvais';
}
</script>

<style scoped>
.validation-view {
  display: grid;
  gap: 1.2rem;
}

.hero-card,
.panel-card,
.review-card,
.history-card,
.stat-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(251, 246, 235, 0.88));
  border: 1px solid var(--brand-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.hero-card h1,
.panel-head h2 {
  margin: 0.35rem 0 0.5rem;
  color: var(--brand-deep);
}

.hero-card p:last-child {
  margin: 0;
  color: var(--text-muted);
  max-width: 60ch;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.stat-card {
  display: grid;
  gap: 0.2rem;
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

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
  gap: 1rem;
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
.time-pill,
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

.review-list,
.history-list {
  display: grid;
  gap: 0.9rem;
}

.review-card,
.history-card {
  padding: 1rem;
}

.review-card {
  display: grid;
  gap: 0.85rem;
}

.review-head,
.history-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.review-head strong,
.history-head strong {
  display: block;
  color: var(--brand-deep);
}

.review-head span,
.history-card p,
.history-card small {
  color: var(--text-muted);
}

.review-note,
.history-card p,
.history-card small {
  margin: 0;
}

.meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.review-form {
  display: grid;
  gap: 0.75rem;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field span {
  font-size: 0.9rem;
  font-weight: 700;
}

.field select,
.field textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.86);
}

.field textarea {
  resize: vertical;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
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
  min-height: 240px;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed rgba(39, 65, 53, 0.16);
  border-radius: var(--radius-lg);
}

.compact {
  min-height: 160px;
}

.success-banner {
  padding: 0.85rem 1rem;
  border-radius: 16px;
  background: rgba(74, 103, 65, 0.12);
  color: #35552f;
}

@media (max-width: 980px) {
  .hero-card,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .panel-head,
  .review-head,
  .history-head {
    flex-direction: column;
  }
}
</style>
