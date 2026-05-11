// culturo/front-culturo/src/stores/history.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import apiClient from '@/api/client';
import type { SoleWithBoards, ExploitationSummary, CulturePlanEntry } from '@/types/planning';

export interface HistoryEntry extends CulturePlanEntry {
  year: number;
}

export interface RotationAlert {
  boardName: string;
  sectionNumber: number;
  vegetableName: string;
  years: number[];
  severity: 'warning' | 'critical';
}

export interface ParcelMemoryCell {
  vegetableName: string | null;
  year: number;
}

export interface ParcelMemoryRow {
  boardName: string;
  sectionNumber: number;
  cells: ParcelMemoryCell[];
}

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

export const useHistoryStore = defineStore('history', () => {
  // Metadata
  const soles = ref<SoleWithBoards[]>([]);
  const solesLoading = ref(false);

  // Filters
  const selectedSoleId = ref<number | null>(null);
  const selectedYears = ref<number[]>([...DEFAULT_YEARS]);
  const searchQuery = ref('');
  const filterBoard = ref<string>('');

  // Data
  const entriesByYear = ref<Record<number, CulturePlanEntry[]>>({});
  const loadingYears = ref<Set<number>>(new Set());
  const loadErrors = ref<string[]>([]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const allEntries = computed<HistoryEntry[]>(() =>
    selectedYears.value.flatMap((year) =>
      (entriesByYear.value[year] ?? []).map((e) => ({ ...e, year })),
    ),
  );

  const filteredEntries = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    const b = filterBoard.value.trim().toLowerCase();
    return allEntries.value.filter((e) => {
      if (b && !e.boardName.toLowerCase().includes(b)) return false;
      if (q && !e.vegetableName?.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  // Rotation alerts: same vegetable in same section across ≥2 different years
  const rotationAlerts = computed<RotationAlert[]>(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const e of allEntries.value) {
      if (!e.vegetableName) continue;
      const key = `${e.boardId}-${e.sectionNumber}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }

    const alerts: RotationAlert[] = [];
    map.forEach((entries) => {
      const byVeg = new Map<string, Set<number>>();
      for (const e of entries) {
        if (!e.vegetableName) continue;
        if (!byVeg.has(e.vegetableName)) byVeg.set(e.vegetableName, new Set());
        byVeg.get(e.vegetableName)!.add(e.year);
      }
      byVeg.forEach((years, vegetableName) => {
        if (years.size < 2) return;
        const sortedYears = [...years].sort();
        const hasConsecutive = sortedYears.some((y, i) => i > 0 && y - sortedYears[i - 1] === 1);
        alerts.push({
          boardName: entries[0].boardName,
          sectionNumber: entries[0].sectionNumber,
          vegetableName,
          years: sortedYears,
          severity: hasConsecutive ? 'critical' : 'warning',
        });
      });
    });

    return alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1));
  });

  // Parcel memory: pivot table board+section × year
  const parcelMemory = computed<ParcelMemoryRow[]>(() => {
    const rowMap = new Map<string, ParcelMemoryRow>();

    for (const e of allEntries.value) {
      const key = `${e.boardId}-${e.sectionNumber}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          boardName: e.boardName,
          sectionNumber: e.sectionNumber,
          cells: selectedYears.value.map((y) => ({ year: y, vegetableName: null })),
        });
      }
      const row = rowMap.get(key)!;
      const cell = row.cells.find((c) => c.year === e.year);
      if (cell) cell.vegetableName = e.vegetableName ?? null;
    }

    return [...rowMap.values()].sort((a, b) =>
      a.boardName.localeCompare(b.boardName) || a.sectionNumber - b.sectionNumber,
    );
  });

  const stats = computed(() => ({
    plantings: allEntries.value.length,
    uniqueVegetables: new Set(allEntries.value.map((e) => e.vegetableName).filter(Boolean)).size,
    alerts: rotationAlerts.value.length,
    criticalAlerts: rotationAlerts.value.filter((a) => a.severity === 'critical').length,
    boards: new Set(allEntries.value.map((e) => e.boardId)).size,
  }));

  const uniqueBoards = computed(() =>
    [...new Set(allEntries.value.map((e) => e.boardName))].sort(),
  );

  const uniqueExploitations = computed((): ExploitationSummary[] => {
    const seen = new Map<number, ExploitationSummary>();
    soles.value.forEach((s) => {
      if (s.exploitation && !seen.has(s.exploitation.id_exploitation)) {
        seen.set(s.exploitation.id_exploitation, s.exploitation);
      }
    });
    return [...seen.values()];
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  async function loadSoles() {
    solesLoading.value = true;
    try {
      const resp = await apiClient.get<SoleWithBoards[]>('/sole');
      soles.value = resp.data;
    } catch {
      loadErrors.value.push('Impossible de charger les soles.');
    } finally {
      solesLoading.value = false;
    }
  }

  async function loadYearData(soleId: number, year: number) {
    if (loadingYears.value.has(year)) return;
    loadingYears.value = new Set([...loadingYears.value, year]);
    try {
      const resp = await apiClient.get<CulturePlanEntry[]>(
        `/rotations/plan/${soleId}`,
        { params: { year } },
      );
      entriesByYear.value = { ...entriesByYear.value, [year]: resp.data };
    } catch {
      loadErrors.value.push(`Erreur chargement année ${year}.`);
    } finally {
      const next = new Set(loadingYears.value);
      next.delete(year);
      loadingYears.value = next;
    }
  }

  async function loadAllSelectedYears() {
    if (!selectedSoleId.value) return;
    entriesByYear.value = {};
    loadErrors.value = [];
    await Promise.all(selectedYears.value.map((y) => loadYearData(selectedSoleId.value!, y)));
  }

  function selectSole(id: number) {
    selectedSoleId.value = id;
    loadAllSelectedYears();
  }

  function toggleYear(year: number) {
    if (selectedYears.value.includes(year)) {
      if (selectedYears.value.length === 1) return;
      selectedYears.value = selectedYears.value.filter((y) => y !== year);
    } else {
      selectedYears.value = [...selectedYears.value, year].sort();
      if (selectedSoleId.value) loadYearData(selectedSoleId.value, year);
    }
  }

  function setYearRange(start: number, end: number) {
    const years: number[] = [];
    for (let y = start; y <= end; y++) years.push(y);
    selectedYears.value = years;
    loadAllSelectedYears();
  }

  function exportCsv() {
    const rows = filteredEntries.value;
    if (rows.length === 0) return;

    const header = ['Année', 'Planche', 'Section', 'Légume', 'Date début', 'Date fin'];
    const lines = rows.map((r) =>
      [r.year, r.boardName, r.sectionNumber, r.vegetableName ?? '', r.startDate, r.endDate].join(';'),
    );

    const csv = [header.join(';'), ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-cultures-${selectedYears.value.join('-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    soles,
    solesLoading,
    selectedSoleId,
    selectedYears,
    searchQuery,
    filterBoard,
    entriesByYear,
    loadingYears,
    loadErrors,
    allEntries,
    filteredEntries,
    rotationAlerts,
    parcelMemory,
    stats,
    uniqueBoards,
    uniqueExploitations,
    loadSoles,
    loadAllSelectedYears,
    selectSole,
    toggleYear,
    setYearRange,
    exportCsv,
  };
});
