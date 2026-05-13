<template>
  <div class="observations-view">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Observations terrain</p>
        <h1>Suivi de vos parcelles</h1>
        <p>
          Consignez rapidement ce que vous voyez sur le terrain : état de la
          plante, maladies, ravageurs et contexte météo. Chaque saisie part en
          validation chez le formateur.
        </p>
      </div>

      <div class="hero-stats">
        <article class="stat-card">
          <span>Total</span>
          <strong>{{ store.myStats.total }}</strong>
        </article>
        <article class="stat-card">
          <span>En attente</span>
          <strong>{{ store.myStats.pending }}</strong>
        </article>
        <article class="stat-card">
          <span>À corriger</span>
          <strong>{{ store.myStats.changesRequested }}</strong>
        </article>
      </div>
    </section>

    <div v-if="store.error" class="error-banner">{{ store.error }}</div>
    <div v-else-if="store.feedback" class="success-banner">{{ store.feedback }}</div>

    <section class="content-grid">
      <article class="panel-card form-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Nouvelle saisie</p>
            <h2>Décrire une observation</h2>
          </div>
          <span class="panel-chip">
            {{ store.loadingSections ? 'Chargement...' : `${store.activeSections.length} section(s)` }}
          </span>
        </div>

        <form class="observation-form" @submit.prevent="handleSubmit">
          <label class="field">
            <span>Section observée</span>
            <select v-model.number="form.sectionId" required>
              <option :value="null" disabled>Choisir une section active</option>
              <option
                v-for="section in store.activeSections"
                :key="section.id_section"
                :value="section.id_section"
              >
                {{ formatSectionLabel(section) }}
              </option>
            </select>
          </label>

          <div v-if="selectedSection" class="selected-section-card">
            <strong>{{ selectedSection.sectionPlan?.board?.board_name }}</strong>
            <span>
              {{ selectedSection.sectionPlan?.board?.sole?.exploitation?.exploitation_name }}
              · {{ selectedSection.sectionPlan?.board?.sole?.sole_name }}
              · Section {{ selectedSection.section_number }}
            </span>
            <small>
              Culture en place :
              {{ selectedSection.vegetable?.vegetable_name ?? 'non renseignée' }}
            </small>
          </div>

          <div class="form-row">
            <label class="field">
              <span>Date</span>
              <input v-model="form.observationDate" type="date" required />
            </label>

            <label class="field">
              <span>État de la plante</span>
              <select v-model="form.plantStatus" required>
                <option value="bon">Bon</option>
                <option value="moyen">Moyen</option>
                <option value="mauvais">Mauvais</option>
              </select>
            </label>
          </div>

          <div class="form-row">
            <label class="field">
              <span>Maladie observée</span>
              <input
                v-model="form.diseaseObserved"
                type="text"
                placeholder="Ex: mildiou léger"
              />
            </label>

            <label class="field">
              <span>Ravageur observé</span>
              <input
                v-model="form.pestObserved"
                type="text"
                placeholder="Ex: pucerons"
              />
            </label>
          </div>

          <label class="field">
            <span>Conditions météo</span>
            <input
              v-model="form.weatherConditions"
              type="text"
              placeholder="Ex: pluie la veille, forte humidité"
            />
          </label>

          <label class="field">
            <span>Notes détaillées</span>
            <textarea
              v-model="form.notes"
              rows="5"
              placeholder="Décrivez ce que vous avez vu sur la parcelle, les symptômes, l'évolution, ou une action à prévoir."
              required
            />
          </label>

          <div class="form-actions">
            <button class="primary-button" type="submit" :disabled="!isFormValid || store.submitting">
              {{ store.submitting ? 'Enregistrement...' : 'Envoyer au formateur' }}
            </button>
            <button class="secondary-button" type="button" @click="resetForm">
              Réinitialiser
            </button>
          </div>
        </form>
      </article>

      <article class="panel-card list-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Historique</p>
            <h2>Vos dernières observations</h2>
          </div>
          <span class="panel-chip">
            {{ store.loadingMine ? 'Chargement...' : `${store.myObservations.length} enregistrements` }}
          </span>
        </div>

        <div v-if="store.loadingMine" class="empty-state">
          Chargement de vos observations...
        </div>
        <div v-else-if="store.myObservations.length === 0" class="empty-state">
          Aucune observation saisie pour le moment.
        </div>
        <div v-else class="observation-list">
          <article
            v-for="observation in store.myObservations"
            :key="observation.id_observation"
            class="observation-card"
          >
            <div class="observation-head">
              <div>
                <strong>{{ observation.section.sectionPlan?.board?.board_name }}</strong>
                <span>
                  Section {{ observation.section.section_number }} ·
                  {{ formatDate(observation.observation_date) }}
                </span>
              </div>
              <span class="status-badge" :class="statusClass(observation.review_status)">
                {{ statusLabel(observation.review_status) }}
              </span>
            </div>

            <p class="observation-note">{{ observation.notes }}</p>

            <div class="meta-line">
              <span>État : {{ plantStatusLabel(observation.plant_status) }}</span>
              <span v-if="observation.disease_observed">Maladie : {{ observation.disease_observed }}</span>
              <span v-if="observation.pest_observed">Ravageur : {{ observation.pest_observed }}</span>
            </div>

            <p v-if="observation.weather_conditions" class="meta-block">
              Météo : {{ observation.weather_conditions }}
            </p>

            <div v-if="observation.review_notes" class="review-block">
              <strong>Retour formateur</strong>
              <p>{{ observation.review_notes }}</p>
            </div>
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
  CreateObservationPayload,
  ObservationPlantStatus,
  ObservationReviewStatus,
  ObservationSectionSummary,
} from '@/types/observations';

interface ObservationFormState {
  sectionId: number | null;
  observationDate: string;
  diseaseObserved: string;
  pestObserved: string;
  weatherConditions: string;
  plantStatus: ObservationPlantStatus;
  notes: string;
}

const store = useObservationsStore();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeDefaultForm(): ObservationFormState {
  return {
    sectionId: null,
    observationDate: today(),
    diseaseObserved: '',
    pestObserved: '',
    weatherConditions: '',
    plantStatus: 'bon',
    notes: '',
  };
}

const form = reactive<ObservationFormState>(makeDefaultForm());

const selectedSection = computed(() =>
  store.activeSections.find((section) => section.id_section === form.sectionId) ?? null,
);

const isFormValid = computed(
  () => form.sectionId !== null && form.notes.trim().length >= 8 && form.observationDate !== '',
);

onMounted(() => {
  store.clearMessages();
  void Promise.all([store.loadActiveSections(), store.loadMyObservations()]).then(() => {
    void store.markAllSeen();
  });
});

function resetForm() {
  Object.assign(form, makeDefaultForm());
}

async function handleSubmit() {
  if (!isFormValid.value || form.sectionId === null) return;

  const payload: CreateObservationPayload = {
    sectionId: form.sectionId,
    observationDate: form.observationDate,
    diseaseObserved: form.diseaseObserved.trim() || undefined,
    pestObserved: form.pestObserved.trim() || undefined,
    weatherConditions: form.weatherConditions.trim() || undefined,
    plantStatus: form.plantStatus,
    notes: form.notes.trim(),
  };

  await store.createObservation(payload);
  resetForm();
}

function formatSectionLabel(section: ObservationSectionSummary) {
  const exploitation = section.sectionPlan?.board?.sole?.exploitation?.exploitation_name;
  const sole = section.sectionPlan?.board?.sole?.sole_name;
  const board = section.sectionPlan?.board?.board_name;
  const vegetable = section.vegetable?.vegetable_name;

  return [exploitation, sole, board, `Section ${section.section_number}`, vegetable]
    .filter(Boolean)
    .join(' · ');
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

function plantStatusLabel(status: ObservationPlantStatus) {
  if (status === 'bon') return 'Bon';
  if (status === 'moyen') return 'Moyen';
  return 'Mauvais';
}
</script>

<style scoped>
.observations-view {
  display: grid;
  gap: 1.2rem;
}

.hero-card,
.panel-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(251, 246, 235, 0.88));
  border: 1px solid var(--brand-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  gap: 1rem;
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
  max-width: 62ch;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.stat-card,
.selected-section-card,
.observation-card,
.review-block {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(39, 65, 53, 0.1);
  border-radius: var(--radius-lg);
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
  font-size: 1.7rem;
  color: var(--brand-deep);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1.05fr) minmax(320px, 1fr);
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

.panel-chip {
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: rgba(39, 65, 53, 0.08);
  color: var(--brand-deep);
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
}

.observation-form,
.field {
  display: grid;
  gap: 0.55rem;
}

.field span {
  font-size: 0.92rem;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-primary);
}

.field textarea {
  resize: vertical;
  min-height: 140px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.selected-section-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
}

.selected-section-card span,
.selected-section-card small {
  color: var(--text-muted);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.observation-list {
  display: grid;
  gap: 0.9rem;
}

.observation-card {
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
}

.observation-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.observation-head strong {
  display: block;
  color: var(--brand-deep);
}

.observation-head span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
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

.observation-note,
.meta-block,
.review-block p {
  margin: 0;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.review-block {
  padding: 0.85rem 0.95rem;
}

.review-block strong {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--brand-deep);
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

.success-banner {
  padding: 0.85rem 1rem;
  border-radius: 16px;
  background: rgba(74, 103, 65, 0.12);
  color: #35552f;
}

@media (max-width: 980px) {
  .hero-card,
  .content-grid,
  .form-row {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .panel-head,
  .observation-head {
    flex-direction: column;
  }
}
</style>
