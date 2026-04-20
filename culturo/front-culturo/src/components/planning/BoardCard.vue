<template>
  <div class="board-card">
    <h3 class="board-name">{{ board.board_name }}</h3>
    <div class="sections-grid">
      <SectionCell
        v-for="n in SECTIONS_PER_BOARD"
        :key="n"
        :board-id="board.id_board"
        :board-name="board.board_name"
        :section-number="n"
        :display="getSectionDisplay(n)"
        :readonly="readonly"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlanningStore } from '@/stores/planning';
import type { BoardSummary, SectionDisplay } from '@/types/planning';
import SectionCell from './SectionCell.vue';

const SECTIONS_PER_BOARD = 3;

const props = defineProps<{
  board: BoardSummary;
  readonly: boolean;
}>();

const store = usePlanningStore();

function getSectionDisplay(sectionNumber: number): SectionDisplay {
  return (
    store.sectionDisplayMap.get(`${props.board.id_board}-${sectionNumber}`) ?? {
      sectionNumber,
      status: 'available',
    }
  );
}
</script>

<style scoped>
.board-card {
  background: white;
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.board-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
</style>
