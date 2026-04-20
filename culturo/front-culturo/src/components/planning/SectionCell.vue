<template>
  <button
    class="section-cell"
    :class="[`status-${display.status}`, { 'is-readonly': readonly }]"
    :disabled="display.status === 'occupied' || readonly"
    :title="cellTitle"
    type="button"
    @click="handleClick"
  >
    <span class="section-num">S{{ display.sectionNumber }}</span>
    <span v-if="display.status === 'occupied'" class="section-content">
      <span class="veg-name">{{ display.vegetableName }}</span>
      <span class="veg-dates">{{ formatDate(display.startDate) }} → {{ formatDate(display.endDate) }}</span>
    </span>
    <span v-else-if="display.status === 'available'" class="section-content">
      <span class="available-label">Disponible</span>
      <span v-if="!readonly" class="action-hint">+ Affecter</span>
    </span>
    <span v-else class="section-content">
      <span class="loading-dots">…</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlanningStore } from '@/stores/planning';
import type { SectionDisplay } from '@/types/planning';

const props = defineProps<{
  boardId: number;
  boardName: string;
  sectionNumber: number;
  display: SectionDisplay;
  readonly: boolean;
}>();

const store = usePlanningStore();

const cellTitle = computed(() => {
  if (props.display.status === 'occupied') return `${props.display.vegetableName} — planté`;
  if (props.readonly) return 'Lecture seule';
  return `Affecter un légume à ${props.boardName} section ${props.sectionNumber}`;
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function handleClick() {
  if (props.display.status === 'available' && !props.readonly) {
    store.openSectionPanel(props.boardId, props.boardName, props.sectionNumber);
  }
}
</script>

<style scoped>
.section-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  background: white;
  cursor: default;
  text-align: left;
  width: 100%;
  min-height: 64px;
  font-size: 0.85rem;
  transition: background 0.15s;
}

.status-occupied {
  background: #e8f5e9;
  border-color: #a5d6a7;
}

.status-available:not(.is-readonly) {
  cursor: pointer;
  border-style: dashed;
  border-color: #90caf9;
  background: #e3f2fd;
}

.status-available:not(.is-readonly):hover {
  background: #bbdefb;
}

.section-num {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #888;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.veg-name {
  font-weight: 600;
  color: #2e7d32;
}

.veg-dates {
  font-size: 0.75rem;
  color: #555;
}

.available-label {
  color: #1565c0;
  font-weight: 500;
}

.action-hint {
  font-size: 0.75rem;
  color: #1976d2;
}

.loading-dots {
  color: #aaa;
}
</style>
