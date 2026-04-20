<template>
  <div class="plan-selector">
    <div class="selector-group">
      <label for="exploitation-select">Exploitation</label>
      <select
        id="exploitation-select"
        v-model.number="selectedExploitationId"
      >
        <option :value="null" disabled>Choisir une exploitation</option>
        <option
          v-for="exp in store.uniqueExploitations"
          :key="exp.id_exploitation"
          :value="exp.id_exploitation"
        >
          {{ exp.exploitation_name }}
        </option>
      </select>
    </div>

    <div class="selector-group">
      <label for="sole-select">Sole</label>
      <select
        id="sole-select"
        :disabled="!selectedExploitationId"
        :value="store.selectedSoleId"
        @change="onSoleChange"
      >
        <option :value="null" disabled>Choisir une sole</option>
        <option
          v-for="sole in filteredSoles"
          :key="sole.id_sole"
          :value="sole.id_sole"
        >
          {{ sole.sole_name }}
        </option>
      </select>
    </div>

    <div v-if="store.solesError" class="selector-status">
      <p class="selector-hint selector-error">
        {{ store.solesError }}
        <button type="button" class="retry-button" @click="store.loadSoles()">Réessayer</button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlanningStore } from '@/stores/planning';

const store = usePlanningStore();
const selectedExploitationId = computed<number | null>({
  get: () => store.selectedExploitationId,
  set: (value) => store.selectExploitation(value),
});

const filteredSoles = computed(() =>
  selectedExploitationId.value
    ? store.soles.filter(
        (s) => s.exploitation.id_exploitation === selectedExploitationId.value,
      )
    : [],
);

function onSoleChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  if (value) store.selectSole(value);
}
</script>

<style scoped>
.plan-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 1rem 1.25rem;
  align-items: start;
  margin: 0 1.5rem;
  padding: 1rem 1.25rem 1.15rem;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(251, 246, 236, 0.86));
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
}

.selector-group {
  display: grid;
  gap: 0.45rem;
  align-content: start;
}

.selector-status {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  min-height: 1.25rem;
}

.selector-hint {
  margin: 0;
  font-size: 0.84rem;
  color: rgba(39, 65, 53, 0.72);
  line-height: 1.2;
  min-height: 1rem;
}

.selector-error {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  color: #7a4c32;
}

.retry-button {
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(122, 76, 50, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #7a4c32;
  font-weight: 700;
}

label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.72);
}

select {
  width: 100%;
  min-width: 0;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 16px;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

select:hover {
  transform: translateY(-1px);
  border-color: rgba(74, 103, 65, 0.24);
}

select:focus-visible {
  outline: 2px solid rgba(74, 103, 65, 0.24);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(74, 103, 65, 0.08);
}

select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .plan-selector {
    grid-template-columns: 1fr;
    margin: 0 1rem;
  }

  .selector-status {
    grid-column: auto;
    justify-content: flex-start;
  }
}
</style>
