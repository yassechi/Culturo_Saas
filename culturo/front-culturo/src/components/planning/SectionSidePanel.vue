<template>
  <div class="side-panel-overlay" @click.self="store.closeSectionPanel()">
    <aside class="side-panel" role="dialog" aria-modal="true">
      <!-- En-tête -->
      <header class="panel-header">
        <div>
          <p class="panel-eyebrow">Affectation de légume</p>
          <h3 class="panel-title">
            {{ store.openSection!.boardName }} — Section {{ store.openSection!.sectionNumber }}
          </h3>
        </div>
        <button type="button" class="close-btn" aria-label="Fermer" @click="store.closeSectionPanel()">✕</button>
      </header>

      <!-- Chargement légumes -->
      <div v-if="store.vegetablesLoading" class="panel-loading">
        <p>Chargement des légumes compatibles…</p>
      </div>

      <!-- Aucun légume compatible -->
      <div v-else-if="!store.plantableVegetables.length && !store.vegetablesLoading" class="panel-empty">
        <p>Aucun légume compatible disponible pour cette section.</p>
      </div>

      <template v-else>
        <!-- Sélection du légume -->
        <section class="panel-section">
          <h4>Légumes compatibles</h4>
          <div class="vegetable-groups">
            <div
              v-for="group in store.vegetableGroups"
              :key="group.familyName"
              class="veg-group"
            >
              <div class="group-header">
                <span class="family-name">{{ group.familyName }}</span>
                <span
                  v-if="group.neverPlanted"
                  class="badge-never"
                  title="Jamais planté sur cette planche"
                >Jamais planté ici</span>
                <span v-else-if="group.lastPlantedDate" class="badge-date">
                  Dernier : {{ formatDate(group.lastPlantedDate) }}
                </span>
              </div>
              <div class="veg-list">
                <button
                  v-for="veg in group.vegetables"
                  :key="veg.vegetableId"
                  type="button"
                  class="veg-btn"
                  :class="{ selected: store.assignmentForm.vegetableId === veg.vegetableId }"
                  @click="selectVegetable(veg.vegetableId)"
                >
                  <span class="veg-btn-name">{{ veg.vegetableName }}</span>
                  <span v-if="veg.neverPlantedInSection" class="veg-badge-never">jamais planté</span>
                  <span v-else-if="veg.lastPlantedInSection" class="veg-badge-date">
                    {{ formatDate(veg.lastPlantedInSection) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Message règle de rotation -->
        <RotationRuleMessage
          v-if="store.lastRuleMessage"
          :message="store.lastRuleMessage"
          class="panel-rule-msg"
        />

        <!-- Formulaire dates + détails -->
        <section v-if="store.assignmentForm.vegetableId" class="panel-section">
          <h4>Détails de la plantation</h4>
          <div class="form-grid">
            <div class="form-field">
              <label for="start-date">Date de début *</label>
              <input
                id="start-date"
                v-model="store.assignmentForm.startDate"
                type="date"
                required
              />
            </div>
            <div class="form-field">
              <label for="end-date">Date de fin *</label>
              <input
                id="end-date"
                v-model="store.assignmentForm.endDate"
                type="date"
                :min="store.assignmentForm.startDate"
                required
              />
            </div>
            <div class="form-field">
              <label for="variety">Variété</label>
              <input
                id="variety"
                v-model="store.assignmentForm.varietyIdentifier"
                type="text"
                placeholder="ex: Marmande, Roma…"
              />
            </div>
            <div class="form-field">
              <label for="qty">Quantité</label>
              <input
                id="qty"
                v-model.number="store.assignmentForm.quantityPlanted"
                type="number"
                min="0"
              />
            </div>
          </div>
        </section>

        <!-- Actions -->
        <footer class="panel-footer">
          <button
            type="button"
            class="primary-button"
            :disabled="!isFormValid || store.assignmentLoading"
            @click="confirm(false)"
          >
            {{ store.assignmentLoading ? 'Enregistrement…' : 'Confirmer' }}
          </button>
          <button
            v-if="showBypass && store.lastRuleMessage?.type === 'warning'"
            type="button"
            class="warning-button"
            :disabled="store.assignmentLoading"
            @click="confirm(true)"
          >
            Forcer quand même (bypass)
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="store.closeSectionPanel()"
          >
            Annuler
          </button>
        </footer>
      </template>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { usePlanningStore } from '@/stores/planning';
import { useAuthStore } from '@/stores/auth';
import RotationRuleMessage from './RotationRuleMessage.vue';

const store = usePlanningStore();
const auth = useAuthStore();

const showBypass = computed(() => auth.isAdmin || auth.isFormateur);

const isFormValid = computed(() => {
  const f = store.assignmentForm;
  return (
    f.vegetableId !== null &&
    f.startDate &&
    f.endDate &&
    f.startDate <= f.endDate
  );
});

onMounted(() => {
  store.loadPlantableVegetables();
});

function selectVegetable(id: number) {
  store.checkVegetableCompatibility(id);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function confirm(bypass: boolean) {
  store.submitAssignment(bypass);
}
</script>

<style scoped>
.side-panel-overlay {
  position: fixed;
  inset: 0;
  padding: 1rem;
  background: rgba(17, 27, 22, 0.42);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.side-panel {
  width: min(520px, 100vw);
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.98), rgba(248, 242, 231, 0.94));
  display: flex;
  flex-direction: column;
  box-shadow: -18px 0 54px rgba(26, 34, 28, 0.18);
  overflow-y: auto;
  border-left: 1px solid rgba(39, 65, 53, 0.08);
  border-radius: 28px 0 0 28px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.08);
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.98), rgba(248, 242, 231, 0.94));
  z-index: 1;
  backdrop-filter: blur(14px);
}

.panel-eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: var(--brand-clay);
  margin: 0 0 0.25rem;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  color: var(--brand-deep);
  line-height: 1.1;
}

.close-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(39, 65, 53, 0.08);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 999px;
  font-size: 1.05rem;
  cursor: pointer;
  color: var(--brand-deep);
  padding: 0;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
  transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.close-btn:hover {
  transform: translateY(-1px);
  background: rgba(39, 65, 53, 0.12);
}

.panel-section {
  padding: 1rem 1.25rem 1.15rem;
  margin: 0 1rem 1rem;
  border-radius: 22px;
  border: 1px solid rgba(39, 65, 53, 0.08);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-soft);
}

.panel-section h4 {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--brand-clay);
  margin: 0 0 0.75rem;
}

.panel-loading,
.panel-empty {
  padding: 2rem 1.5rem;
  margin: 1rem;
  color: var(--text-muted);
  text-align: center;
  border-radius: 22px;
  border: 1px dashed rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-soft);
}

.panel-rule-msg {
  margin: 0 1rem 0.75rem;
}

.vegetable-groups {
  display: grid;
  gap: 1rem;
}

.veg-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.family-name {
  font-weight: 800;
  font-size: 0.86rem;
  color: var(--brand-deep);
}

.badge-never {
  font-size: 0.68rem;
  background: rgba(74, 103, 65, 0.12);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.2);
  border-radius: 99px;
  padding: 0.1rem 0.5rem;
}

.badge-date {
  font-size: 0.7rem;
  color: rgba(39, 65, 53, 0.7);
}

.veg-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}

.veg-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  min-height: 68px;
  padding: 0.7rem 0.85rem;
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(249, 244, 233, 0.9));
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
  cursor: pointer;
  font-size: 0.85rem;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  text-align: left;
}

.veg-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(74, 103, 65, 0.22);
}

.veg-btn.selected {
  background: linear-gradient(135deg, rgba(74, 103, 65, 0.16), rgba(39, 65, 53, 0.08));
  border-color: rgba(74, 103, 65, 0.28);
  box-shadow: 0 12px 24px rgba(58, 47, 24, 0.1);
}

.veg-btn-name {
  font-weight: 800;
  color: var(--brand-deep);
}

.veg-badge-never {
  font-size: 0.65rem;
  color: var(--brand-olive);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.veg-btn.selected .veg-badge-never {
  color: var(--brand-olive);
}

.veg-badge-date {
  font-size: 0.65rem;
  color: rgba(39, 65, 53, 0.68);
}

.veg-btn.selected .veg-badge-date {
  color: rgba(39, 65, 53, 0.78);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-field label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.72);
}

.form-field input {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 16px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  color: var(--text-primary);
}

.form-field input:focus-visible {
  outline: 2px solid rgba(74, 103, 65, 0.24);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(74, 103, 65, 0.08);
}

.panel-footer {
  padding: 1rem 1.5rem 1.35rem;
  display: grid;
  gap: 0.65rem;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.84), rgba(248, 242, 231, 0.98));
  border-top: 1px solid rgba(39, 65, 53, 0.08);
  backdrop-filter: blur(14px);
}

.primary-button {
  padding: 0.85rem 1.25rem;
  background: linear-gradient(135deg, var(--brand-olive), var(--brand-deep));
  color: #fffdf8;
  border: none;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(39, 65, 53, 0.22);
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.warning-button {
  padding: 0.85rem 1.25rem;
  background: linear-gradient(135deg, #d9822b, #b85e19);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(181, 106, 67, 0.2);
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}

.secondary-button {
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-deep);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
}

.primary-button:hover,
.warning-button:hover,
.secondary-button:hover {
  transform: translateY(-1px);
}

.primary-button:disabled:hover,
.warning-button:disabled:hover {
  transform: none;
}

@media (max-width: 720px) {
  .side-panel-overlay {
    padding: 0;
  }

  .side-panel {
    width: 100vw;
    border-radius: 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
