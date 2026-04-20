<template>
  <div class="timeline-shell">
    <div class="timeline-header">
      <div class="year-heading">
        <label for="planning-year">Année</label>
        <input
          id="planning-year"
          type="number"
          :value="draftYear ?? ''"
          :min="2000"
          :max="currentYear + 5"
          inputmode="numeric"
          @input="handleYearInput"
          @change="handleYearInput"
          @wheel.prevent
        />
      </div>
      <div class="board-heading">
        <span>Planche</span>
        <small>{{ store.boardsForSelectedSole.length }} planche(s)</small>
      </div>
      <div class="month-heading">
        <button
          type="button"
          class="header-nav-button header-nav-button-left"
          :disabled="!canMoveBackward"
          aria-label="Mois précédents"
          @click="emit('shift-window', -3)"
        >
          <span class="nav-triangle is-left" aria-hidden="true"></span>
        </button>
        <div class="month-heading-track">
          <div class="month-heading-track-inner">
            <div
              v-for="month in monthSegments"
              :key="month.key"
              class="month-cell"
              :class="{ 'is-first': month.isFirst }"
              :style="{
                left: `${month.left}%`,
                width: `${month.width}%`,
              }"
            >
              {{ month.label }}
            </div>
          </div>
        </div>
        <button
          type="button"
          class="header-nav-button header-nav-button-right"
          :disabled="!canMoveForward"
          aria-label="Mois suivants"
          @click="emit('shift-window', 3)"
        >
          <span class="nav-triangle is-right" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div v-if="!boardRows.length" class="empty-state">
      <p>Aucune planification visible pour cette fenetre.</p>
    </div>

    <div v-else class="timeline-board-frame">
      <button
        type="button"
        class="timeline-board-rail timeline-board-rail-left"
        :disabled="!canMoveBackward"
        aria-label="Mois précédents"
        @click="emit('shift-window', -3)"
      />
      <button
        type="button"
        class="timeline-board-rail timeline-board-rail-right"
        :disabled="!canMoveForward"
        aria-label="Mois suivants"
        @click="emit('shift-window', 3)"
      />

      <div class="timeline-list">
        <article
          v-for="row in boardRows"
          :key="row.board.id_board"
          class="board-row"
        >
          <div class="board-card">
            <h3>{{ row.board.board_name }}</h3>
            <p>
              {{ row.occupiedCount }} section(s) planifiee(s)
              <span v-if="readonly"> - lecture seule</span>
            </p>
          </div>

          <div class="board-track">
            <div
              v-for="lane in row.lanes"
              :key="lane.sectionNumber"
              class="timeline-lane"
            >
              <div class="lane-label">S{{ lane.sectionNumber }}</div>
              <div class="lane-track">
                <div class="month-markers" aria-hidden="true">
                  <span
                    v-for="marker in monthMarkers"
                    :key="marker.key"
                    class="month-marker"
                    :style="{ left: `${marker.left}%` }"
                  />
                </div>

                <button
                  v-if="lane.status === 'available'"
                  type="button"
                  class="lane-slot"
                  :disabled="readonly"
                  @click="openSlot(row.board, lane.sectionNumber)"
                >
                  <span class="slot-title">Disponible</span>
                  <span class="slot-note" v-if="!readonly">Cliquer pour planifier</span>
                </button>

                <div
                  v-else
                  class="lane-bar"
                  :class="{ 'is-clipped': lane.edgeState !== 'inside' }"
                  tabindex="0"
                  :aria-label="lane.tooltipTitle"
                  :style="{
                    left: `${lane.left}%`,
                    width: `${lane.width}%`,
                    '--lane-accent': lane.accent,
                    '--lane-accent-dark': lane.accentDark,
                  }"
                  >
                    <div class="bar-content" :class="`is-${lane.displaySize}`">
                    <span v-if="lane.displaySize !== 'tiny'" class="bar-line">
                      <span class="bar-name">{{ lane.vegetableName }}</span>
                      <span class="bar-separator" aria-hidden="true">•</span>
                      <span class="bar-dates">{{ formatDate(lane.startDate) }} - {{ formatDate(lane.endDate) }}</span>
                    </span>
                    <span v-if="lane.displaySize === 'tiny'" class="bar-mini-name">
                      {{ lane.vegetableName }}
                    </span>
                  </div>

                  <div class="bar-tooltip" :class="`is-${lane.tooltipPlacement}`" role="tooltip">
                    <strong>{{ lane.vegetableName }}</strong>
                    <span>Plantation : {{ formatDate(lane.startDate) }}</span>
                    <span>Fin : {{ formatDate(lane.endDate) }}</span>
                    <span>Durée : {{ lane.durationDays }} jour(s)</span>
                    <span>Repere : {{ row.board.board_name }} - section {{ lane.sectionNumber }}</span>
                    <span class="tooltip-hint">{{ lane.windowCoverage }}</span>
                    <span class="tooltip-suggestion">{{ lane.suggestion }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="timeline-footer-nav">
      <button
        type="button"
        class="month-nav"
        :disabled="!canMoveBackward"
        @click="emit('shift-window', -3)"
      >
        <span class="nav-triangle is-left" aria-hidden="true"></span>
        <span>3 mois</span>
      </button>
      <div class="window-chip">{{ windowLabel }}</div>
      <button
        type="button"
        class="month-nav"
        :disabled="!canMoveForward"
        @click="emit('shift-window', 3)"
      >
        <span>3 mois</span>
        <span class="nav-triangle is-right" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePlanningStore } from '@/stores/planning';
import type { BoardSummary, CulturePlanEntry } from '@/types/planning';

const props = defineProps<{
  year: number;
  windowStartMonth: number;
  windowLabel: string;
  canMoveBackward: boolean;
  canMoveForward: boolean;
}>();

const emit = defineEmits<{
  (event: 'shift-window', delta: number): void;
  (event: 'year-change', year: number): void;
}>();

const store = usePlanningStore();
const auth = useAuthStore();
const readonly = computed(() => auth.isStagiaire);
const currentYear = new Date().getFullYear();
const draftYear = ref<number | null>(props.year);

const msPerDay = 24 * 60 * 60 * 1000;

type MonthColumn = {
  key: string;
  label: string;
};

type MonthSegment = MonthColumn & {
  left: number;
  width: number;
  isFirst: boolean;
};

type AvailableLane = {
  sectionNumber: number;
  status: 'available';
};

type OccupiedLane = {
  sectionNumber: number;
  status: 'occupied';
  left: number;
  width: number;
  displaySize: 'normal' | 'compact' | 'tiny';
  tooltipPlacement: 'start' | 'center' | 'end';
  edgeState: 'inside' | 'before' | 'after';
  startDate: string;
  endDate: string;
  vegetableName: string;
  durationDays: number;
  tooltipTitle: string;
  windowCoverage: string;
  suggestion: string;
  accent: string;
  accentDark: string;
};

type TimelineLane = AvailableLane | OccupiedLane;

type TimelineBoardRow = {
  board: BoardSummary;
  occupiedCount: number;
  lanes: TimelineLane[];
};

const lanePalettes = [
  { base: '#4f6d3c', dark: '#375126' },
  { base: '#7a4c32', dark: '#5a3623' },
  { base: '#315c73', dark: '#224051' },
  { base: '#8a5b99', dark: '#643f71' },
  { base: '#aa5534', dark: '#7f3e25' },
  { base: '#2f7d6d', dark: '#21584d' },
  { base: '#9b7036', dark: '#735424' },
  { base: '#526f8f', dark: '#374f66' },
];

function createUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function toUtcDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfMonthUtc(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0));
}

function diffDaysUtc(left: Date, right: Date) {
  return Math.round((left.getTime() - right.getTime()) / msPerDay);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

watch(
  () => props.year,
  (value) => {
    draftYear.value = value;
  },
  { immediate: true },
);

function handleYearInput(event: Event) {
  const rawValue = (event.target as HTMLInputElement).value.trim();
  if (!rawValue) {
    draftYear.value = null;
    return;
  }
  const value = Number(rawValue);
  draftYear.value = Number.isFinite(value) ? value : null;
  if (!Number.isFinite(value) || value < 2000 || value > currentYear + 5) return;
  emit('year-change', value);
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickPalette(seed: string) {
  return lanePalettes[hashString(seed) % lanePalettes.length];
}

function getCoverageLabel(clippedStart: boolean, clippedEnd: boolean) {
  if (clippedStart && clippedEnd) return 'Visible sur toute la fenetre';
  if (clippedStart) return 'Commence avant la fenetre visible';
  if (clippedEnd) return 'Se termine apres la fenetre visible';
  return 'Entierement visible dans la fenetre';
}

function getSuggestion(durationDays: number, clippedStart: boolean, clippedEnd: boolean) {
  if (clippedStart || clippedEnd) {
    return 'Astuce: cette culture deborde de la periode affichee, utile pour lire les chevauchements.';
  }
  if (durationDays >= 90) {
    return 'Astuce: culture longue, pratique pour verifier la rotation sur plusieurs mois.';
  }
  return 'Astuce: culture courte, facile a replacer dans une autre fenetre de calendrier.';
}

const windowStartDate = computed(() =>
  createUtcDate(props.year, props.windowStartMonth, 1),
);

const windowEndDate = computed(() =>
  endOfMonthUtc(props.year, props.windowStartMonth + 2),
);

const totalWindowDays = computed(
  () => diffDaysUtc(windowEndDate.value, windowStartDate.value) + 1,
);

const months = computed<MonthColumn[]>(() =>
  Array.from({ length: 3 }, (_, index) => {
      const monthDate = createUtcDate(
      props.year,
      props.windowStartMonth + index,
      1,
    );
    return {
      key: `${props.year}-${props.windowStartMonth + index}`,
      label: formatMonth(monthDate),
    };
  }),
);

const monthSegments = computed<MonthSegment[]>(() =>
  months.value.map((month, index) => {
    const monthStart = createUtcDate(props.year, props.windowStartMonth + index, 1);
    const nextMonthStart =
      index < months.value.length - 1
        ? createUtcDate(props.year, props.windowStartMonth + index + 1, 1)
        : windowEndDate.value;
    const left = (diffDaysUtc(monthStart, windowStartDate.value) / totalWindowDays.value) * 100;
    const nextLeft = (diffDaysUtc(nextMonthStart, windowStartDate.value) / totalWindowDays.value) * 100;
    const safeLeft = Math.max(0, Math.min(100, left));

    return {
      ...month,
      left: index === 0 ? 0 : safeLeft,
      width: index === months.value.length - 1 ? Math.max(0, 100 - safeLeft) : Math.max(0, nextLeft - left),
      isFirst: index === 0,
    };
  }),
);

const monthMarkers = computed(() =>
  Array.from({ length: 2 }, (_, index) => {
    const monthStart = createUtcDate(props.year, props.windowStartMonth + index + 1, 1);
    const left = (diffDaysUtc(monthStart, windowStartDate.value) / totalWindowDays.value) * 100;
    return {
      key: `${props.year}-${props.windowStartMonth + index + 1}`,
      left: Math.max(0, Math.min(100, left)),
    };
  }),
);

const planEntries = computed(() =>
  store.culturePlan
    .slice()
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      if (a.boardId !== b.boardId) return a.boardId - b.boardId;
      return a.sectionNumber - b.sectionNumber;
    }),
);

const boardRows = computed<TimelineBoardRow[]>(() =>
  store.boardsForSelectedSole.map((board) => {
    const lanes = Array.from({ length: 3 }, (_, index) => {
      const sectionNumber = index + 1;
      const entry = planEntries.value.find(
        (item) => item.boardId === board.id_board && item.sectionNumber === sectionNumber,
      );

      if (!entry) {
        return {
          sectionNumber,
          status: 'available',
        } as TimelineLane;
      }

      const entryStart = toUtcDate(entry.startDate);
      const entryEnd = toUtcDate(entry.endDate);
      const overlapsWindow = entryStart <= windowEndDate.value && entryEnd >= windowStartDate.value;
      const clampedStart = entryStart > windowStartDate.value ? entryStart : windowStartDate.value;
      const clampedEnd = entryEnd < windowEndDate.value ? entryEnd : windowEndDate.value;
      const durationDays = diffDaysUtc(entryEnd, entryStart) + 1;
      const left = overlapsWindow
        ? (diffDaysUtc(clampedStart, windowStartDate.value) / totalWindowDays.value) * 100
        : entryStart > windowEndDate.value
          ? 92
          : 0;
      const width = overlapsWindow
        ? (diffDaysUtc(clampedEnd, clampedStart) / totalWindowDays.value) * 100
        : 8;
      const palette = pickPalette(entry.vegetableName);
      const clippedStart = entryStart < windowStartDate.value;
      const clippedEnd = entryEnd > windowEndDate.value;
      const displaySize = width < 10 ? 'tiny' : width < 18 ? 'compact' : 'normal';
      const tooltipPlacement =
        left < 30 ? 'start' : left + width > 70 ? 'end' : 'center';

      return {
        sectionNumber,
        status: 'occupied',
        left,
        width,
        displaySize,
        tooltipPlacement,
        edgeState: overlapsWindow
          ? 'inside'
          : entryStart > windowEndDate.value
            ? 'after'
            : 'before',
        startDate: entry.startDate,
        endDate: entry.endDate,
        vegetableName: entry.vegetableName,
        durationDays,
        tooltipTitle: [
          entry.vegetableName,
          `Planche ${board.board_name}`,
          `Section ${sectionNumber}`,
          `Du ${formatDate(entry.startDate)} au ${formatDate(entry.endDate)}`,
        ].join(' - '),
        windowCoverage: getCoverageLabel(clippedStart, clippedEnd),
        suggestion: getSuggestion(durationDays, clippedStart, clippedEnd),
        accent: palette.base,
        accentDark: palette.dark,
      } as TimelineLane;
    });

    return {
      board,
      occupiedCount: lanes.filter((lane) => lane.status === 'occupied').length,
      lanes,
    };
  }),
);

function overlapsWindow(entry: CulturePlanEntry) {
  const entryStart = toUtcDate(entry.startDate);
  const entryEnd = toUtcDate(entry.endDate);
  return entryStart <= windowEndDate.value && entryEnd >= windowStartDate.value;
}

function openSlot(board: BoardSummary, sectionNumber: number) {
  if (readonly.value) return;
  store.openSectionPanel(board.id_board, board.board_name, sectionNumber, {
    startDate: windowStartDate.value.toISOString().slice(0, 10),
    endDate: windowEndDate.value.toISOString().slice(0, 10),
  });
}
</script>

<style scoped>
.timeline-shell {
  display: grid;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
  --lane-label-width: 56px;
  --lane-gap: 0.6rem;
  --nav-solid: var(--brand-deep);
  --nav-solid-hover: #355243;
  --nav-solid-ink: #f8f2e3;
}

.timeline-footer-nav {
  position: sticky;
  bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.94), rgba(251, 245, 231, 0.88));
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
  z-index: 2;
}

.month-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.9rem 1.15rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--nav-solid);
  color: var(--nav-solid-ink);
  font-weight: 800;
  box-shadow: 0 12px 22px rgba(22, 35, 29, 0.15);
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}

.month-nav:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--nav-solid-hover);
  box-shadow: 0 16px 26px rgba(22, 35, 29, 0.2);
}

.month-nav:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nav-triangle {
  display: inline-block;
  width: 0;
  height: 0;
  border-top: 0.42rem solid transparent;
  border-bottom: 0.42rem solid transparent;
  flex: 0 0 auto;
}

.nav-triangle.is-left {
  border-right: 0.64rem solid currentColor;
}

.nav-triangle.is-right {
  border-left: 0.64rem solid currentColor;
}

.timeline-header {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  grid-template-areas:
    'year .'
    'board months';
  gap: 1rem;
  align-items: start;
  position: sticky;
  top: 6.6rem;
  z-index: 2;
  padding: 0.15rem 1.45rem 0.1rem;
  background: transparent;
  backdrop-filter: none;
}

.header-nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.15rem;
  height: 2.15rem;
  padding: 0;
  border: none;
  background: var(--nav-solid);
  color: var(--nav-solid-ink);
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(22, 35, 29, 0.14);
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
  z-index: 4;
  justify-self: center;
  align-self: center;
  clip-path: polygon(100% 50%, 0 0, 0 100%);
}

.header-nav-button:hover:not(:disabled) {
  background: var(--nav-solid-hover);
  transform: scale(1.03);
  box-shadow: 0 14px 24px rgba(22, 35, 29, 0.18);
}

.header-nav-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.header-nav-button-left,
.header-nav-button-right {
  justify-self: center;
}

.header-nav-button-left {
  grid-column: 1;
  transform: scaleX(-1);
}

.header-nav-button-left:hover:not(:disabled) {
  transform: scaleX(-1) scale(1.03);
}

.header-nav-button-right {
  grid-column: 3;
}

.header-nav-button-left .nav-triangle,
.header-nav-button-right .nav-triangle {
  display: none;
}

.board-heading {
  grid-area: board;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.8rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(39, 65, 53, 0.08);
}

.board-heading span {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--brand-deep);
}

.board-heading small {
  color: rgba(39, 65, 53, 0.68);
}

.year-heading {
  grid-area: year;
  display: grid;
  gap: 0.35rem;
  align-content: start;
  padding: 0.8rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(39, 65, 53, 0.08);
  width: 100%;
}

.year-heading label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--brand-deep);
}

.year-heading input {
  width: 100%;
  padding: 0.72rem 0.9rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  font-weight: 700;
  color: var(--text-primary);
}

.month-heading {
  grid-area: months;
  position: relative;
  display: grid;
  grid-template-columns: calc(var(--lane-label-width) + var(--lane-gap)) minmax(0, 1fr) 36px;
  gap: var(--lane-gap);
  min-height: 3rem;
  align-items: center;
}

.month-heading-track {
  grid-column: 2;
}

.month-heading-track {
  position: relative;
  min-height: 3rem;
}

.month-heading-track-inner {
  position: relative;
  min-height: 3rem;
  width: 100%;
  margin-left: 0;
}

.window-chip {
  padding: 0.8rem 1.05rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(39, 65, 53, 0.1);
  color: var(--brand-deep);
  font-weight: 800;
  min-width: 140px;
  text-align: center;
  box-shadow: 0 10px 24px rgba(58, 47, 24, 0.08);
}

.month-cell {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.58rem 0.55rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(39, 65, 53, 0.08);
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 800;
  text-transform: capitalize;
  color: var(--brand-deep);
  box-shadow: 0 6px 12px rgba(58, 47, 24, 0.04);
}

.month-cell:not(.is-first) {
  padding-left: 0.55rem;
}

.timeline-board-frame {
  position: relative;
}

.timeline-board-rail {
  position: absolute;
  top: 0.45rem;
  bottom: 0.45rem;
  width: 14px;
  border-radius: 999px;
  background: var(--nav-solid);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  pointer-events: none;
  z-index: 8;
  border: none;
  padding: 0;
  appearance: none;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 160ms ease, filter 160ms ease, opacity 160ms ease;
}

.timeline-board-rail-left {
  left: 0.2rem;
}

.timeline-board-rail-right {
  right: 0.2rem;
}

.timeline-board-rail:hover:not(:disabled) {
  background: var(--nav-solid-hover);
  transform: scaleX(1.06);
}

.timeline-board-rail:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.timeline-list {
  display: grid;
  gap: 0.85rem;
  position: relative;
  z-index: 2;
  padding-inline: 1.45rem;
}

.board-row {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
}

.board-row:nth-child(odd) .board-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(250, 246, 237, 0.86));
}

.board-row:nth-child(even) .board-card {
  background: linear-gradient(180deg, rgba(246, 240, 226, 0.94), rgba(242, 234, 214, 0.9));
}

.board-row:nth-child(even) .lane-track {
  background:
    linear-gradient(180deg, rgba(255, 251, 244, 0.65), rgba(248, 240, 220, 0.42)),
    linear-gradient(90deg, rgba(39, 65, 53, 0.035) 0%, rgba(39, 65, 53, 0.018) 100%);
}

.board-row:nth-child(even) .lane-label {
  background: rgba(74, 103, 65, 0.09);
}

.board-row:nth-child(even) .month-marker {
  opacity: 0.82;
}

.board-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  padding: 1rem;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(250, 246, 237, 0.85));
  border: 1px solid rgba(39, 65, 53, 0.1);
  box-shadow: 0 10px 24px rgba(58, 47, 24, 0.06);
}

.board-card h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--brand-deep);
}

.board-card p {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(39, 65, 53, 0.68);
}

.board-track {
  position: relative;
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem 0;
  overflow: visible;
}

.timeline-lane {
  display: grid;
  grid-template-columns: var(--lane-label-width) minmax(0, 1fr);
  gap: var(--lane-gap);
  align-items: stretch;
  min-height: 56px;
}

.lane-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(74, 103, 65, 0.12);
  color: var(--brand-deep);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.lane-track {
  position: relative;
  min-height: 56px;
  border-radius: 18px;
  overflow: visible;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.52)),
    linear-gradient(90deg, rgba(39, 65, 53, 0.04) 0%, rgba(39, 65, 53, 0.02) 100%);
  border: 1px solid rgba(39, 65, 53, 0.1);
}

.month-markers {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.month-marker {
  position: absolute;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(39, 65, 53, 0.28) 18%,
    rgba(39, 65, 53, 0.55) 50%,
    rgba(39, 65, 53, 0.28) 82%,
    transparent
  );
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.lane-slot,
.lane-bar {
  position: absolute;
  top: 8px;
  bottom: 8px;
  border-radius: 16px;
  z-index: 1;
}

.lane-slot {
  inset-inline: 10px;
  width: calc(100% - 20px);
  border: 1px dashed rgba(74, 103, 65, 0.38);
  background:
    linear-gradient(135deg, rgba(74, 103, 65, 0.08), rgba(244, 228, 193, 0.36)),
    rgba(74, 103, 65, 0.09);
  color: var(--brand-deep);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0 1rem;
}

.lane-slot:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.slot-title {
  font-weight: 800;
}

.slot-note {
  font-size: 0.8rem;
  color: rgba(39, 65, 53, 0.72);
}

.lane-bar {
  background: linear-gradient(135deg, var(--lane-accent), var(--lane-accent-dark));
  color: #fffdf8;
  padding: 0;
  min-width: 26px;
  box-shadow: 0 10px 18px rgba(39, 65, 53, 0.18);
  overflow: visible;
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
  cursor: default;
  font-weight: 600;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.14);
}

.lane-bar.is-clipped {
  opacity: 0.92;
  border: 2px dashed rgba(255, 255, 255, 0.55);
}

.lane-bar:hover,
.lane-bar:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(39, 65, 53, 0.26);
  filter: saturate(1.06);
  z-index: 3;
}

.bar-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.45rem;
  padding: 0 1rem;
  border-radius: inherit;
  overflow: hidden;
  min-width: 0;
}

.bar-content.is-compact {
  padding-inline: 0.8rem;
  gap: 0.35rem;
}

.bar-content.is-tiny {
  align-items: center;
  justify-content: center;
  padding-inline: 0.55rem;
}

.bar-name {
  font-weight: 800;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  min-width: 0;
}

.bar-line {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
}

.bar-separator {
  flex: 0 0 auto;
  opacity: 0.75;
}

.bar-dates {
  font-size: 0.76rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1 1 auto;
}

.bar-content.is-tiny .bar-name,
.bar-content.is-tiny .bar-dates {
  display: none;
}

.bar-content.is-tiny .bar-separator {
  display: none;
}

.bar-mini-name {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  color: rgba(255, 255, 255, 0.98);
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-tooltip {
  position: absolute;
  bottom: calc(100% + 0.75rem);
  width: min(320px, 82vw);
  display: grid;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: rgba(17, 27, 22, 0.96);
  color: #f7f3ea;
  box-shadow: 0 18px 34px rgba(17, 27, 22, 0.24);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 140ms ease, transform 140ms ease;
  pointer-events: none;
  z-index: 20;
}

.bar-tooltip.is-start {
  left: 0;
  right: auto;
  transform: translateY(8px);
}

.bar-tooltip.is-center {
  left: 50%;
  right: auto;
  transform: translateX(-50%) translateY(8px);
}

.bar-tooltip.is-end {
  left: auto;
  right: 0;
  transform: translateY(8px);
}

.lane-bar:hover .bar-tooltip.is-start,
.lane-bar:focus-visible .bar-tooltip.is-start,
.lane-bar:hover .bar-tooltip.is-end,
.lane-bar:focus-visible .bar-tooltip.is-end {
  opacity: 1;
  transform: translateY(0);
}

.lane-bar:hover .bar-tooltip.is-center,
.lane-bar:focus-visible .bar-tooltip.is-center {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.bar-tooltip strong {
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
  font-family: var(--font-display);
}

.bar-tooltip span {
  font-size: 0.82rem;
  line-height: 1.35;
}

.tooltip-hint {
  color: #d9e6d2;
  margin-top: 0.2rem;
}

.tooltip-suggestion {
  color: #ffedc7;
  font-style: italic;
}

.empty-state {
  padding: 2rem 1rem 0.5rem;
  color: rgba(39, 65, 53, 0.68);
}

.empty-state p {
  margin: 0;
}

@media (max-width: 900px) {
  .timeline-shell {
    --lane-label-width: 48px;
  }

  .board-row {
    grid-template-columns: 1fr;
  }

  .timeline-header {
    top: 9.2rem;
    grid-template-columns: 1fr;
    grid-template-areas:
      'year'
      'board'
      'months';
    gap: 0.75rem;
  }

  .board-heading {
    min-width: 0;
  }

  .year-heading {
    width: 100%;
  }

  .year-heading input {
    width: 100%;
  }

  .month-heading {
    min-width: 0;
    grid-template-columns: calc(var(--lane-label-width) + var(--lane-gap)) minmax(0, 1fr) 32px;
  }

  .month-heading-track {
    grid-column: 2;
  }

  .header-nav-button-right {
    grid-column: 3;
  }

  .month-heading-track-inner {
    width: 100%;
    margin-left: 0;
  }

  .timeline-lane {
    grid-template-columns: var(--lane-label-width) minmax(0, 1fr);
  }

  .timeline-footer-nav {
    flex-wrap: wrap;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .timeline-header {
    top: 10.6rem;
  }

  .month-heading {
    gap: 0.45rem;
  }

  .bar-content {
    gap: 0.3rem;
    padding-inline: 0.8rem;
  }

  .bar-line {
    gap: 0.3rem;
  }

  .bar-name {
    max-width: 46%;
  }

  .timeline-footer-nav {
    bottom: 0.5rem;
    gap: 0.6rem;
    padding: 0.85rem 0.85rem;
  }

  .month-nav {
    padding-inline: 0.95rem;
  }
}
</style>
