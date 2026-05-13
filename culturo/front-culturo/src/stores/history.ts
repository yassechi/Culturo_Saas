// culturo/front-culturo/src/stores/history.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import apiClient from '@/api/client';
import type { SoleWithBoards, ExploitationSummary, CulturePlanEntry } from '@/types/planning';
import { getConfig } from '@/stores/config';

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

function buildDefaultYears(): number[] {
  const n = getConfig().historyDefaultYears;
  return Array.from({ length: n }, (_, i) => CURRENT_YEAR - (n - 1 - i));
}

export const useHistoryStore = defineStore('history', () => {
  // Metadata
  const soles = ref<SoleWithBoards[]>([]);
  const solesLoading = ref(false);
  const solesLoaded = ref(false);

  // Filters
  const selectedSoleId = ref<number | null>(null);
  const selectedYears = ref<number[]>(buildDefaultYears());
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

  async function loadSoles(force = false) {
    if (solesLoaded.value && !force) return;
    solesLoading.value = true;
    try {
      const resp = await apiClient.get<SoleWithBoards[]>('/sole');
      soles.value = resp.data;
      solesLoaded.value = true;
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

  function exportPdf() {
    const rows = filteredEntries.value;
    const alerts = rotationAlerts.value;
    const memory = parcelMemory.value;
    const years = selectedYears.value;

    const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '';

    const alertRows = alerts.map((a) => `
      <tr class="${a.severity}">
        <td>${a.boardName}</td>
        <td>Section ${a.sectionNumber}</td>
        <td>${a.vegetableName}</td>
        <td>${a.years.join(', ')}</td>
        <td>${a.severity === 'critical' ? 'Critique' : 'Avertissement'}</td>
      </tr>`).join('');

    const memoryHeaders = ['Planche / Section', ...years.map(String)].map((h) => `<th>${h}</th>`).join('');
    const memoryRows = memory.map((row) => {
      const cells = row.cells.map((c) => `<td>${c.vegetableName ?? '\u2014'}</td>`).join('');
      return `<tr><td><strong>${row.boardName}</strong> S${row.sectionNumber}</td>${cells}</tr>`;
    }).join('');

    const detailRows = rows.map((r) => `
      <tr>
        <td>${r.year}</td>
        <td>${r.boardName}</td>
        <td>S${r.sectionNumber}</td>
        <td>${r.vegetableName ?? '\u2014'}</td>
        <td>${fmt(r.startDate)}</td>
        <td>${fmt(r.endDate)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Historique des cultures</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1a2e1a; padding: 24px; }
  h1 { font-size: 16pt; color: #2d5016; margin-bottom: 4px; }
  .meta { color: #666; font-size: 8.5pt; margin-bottom: 24px; }
  h2 { font-size: 11pt; color: #2d5016; margin: 20px 0 8px; border-bottom: 1.5px solid #2d5016; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th { background: #2d5016; color: #fff; padding: 5px 6px; text-align: left; }
  td { padding: 4px 6px; border-bottom: 1px solid #e8f0e0; }
  tr:nth-child(even) td { background: #f5faf0; }
  .critical td { background: #fff0f0 !important; }
  .warning td { background: #fffbe6 !important; }
  .stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat { background: #f0f7e8; border: 1px solid #c8e0a8; border-radius: 6px; padding: 8px 14px; min-width: 80px; text-align: center; }
  .stat-v { font-size: 18pt; font-weight: 700; color: #2d5016; }
  .stat-l { font-size: 7pt; color: #555; text-transform: uppercase; letter-spacing: .04em; }
  @media print { body { padding: 12px; } @page { margin: 1.5cm; size: A4 landscape; } }
</style>
</head>
<body>
<h1>Historique des cultures</h1>
<div class="meta">Export\u00E9 le ${new Date().toLocaleDateString('fr-FR')} &middot; Ann\u00E9es : ${years.join(', ')}</div>
<div class="stats">
  <div class="stat"><div class="stat-v">${stats.value.plantings}</div><div class="stat-l">Plantations</div></div>
  <div class="stat"><div class="stat-v">${stats.value.uniqueVegetables}</div><div class="stat-l">L\u00E9gumes</div></div>
  <div class="stat"><div class="stat-v">${stats.value.boards}</div><div class="stat-l">Planches</div></div>
  <div class="stat"><div class="stat-v">${stats.value.alerts}</div><div class="stat-l">Alertes</div></div>
</div>
${memory.length > 0 ? `<h2>M\u00E9moire des parcelles</h2><table><thead><tr>${memoryHeaders}</tr></thead><tbody>${memoryRows}</tbody></table>` : ''}
${alerts.length > 0 ? `<h2>Alertes de rotation</h2><table><thead><tr><th>Planche</th><th>Section</th><th>L\u00E9gume</th><th>Ann\u00E9es</th><th>Niveau</th></tr></thead><tbody>${alertRows}</tbody></table>` : ''}
<h2>D\u00E9tail des cultures</h2>
<table><thead><tr><th>Ann\u00E9e</th><th>Planche</th><th>Section</th><th>L\u00E9gume</th><th>D\u00E9but</th><th>Fin</th></tr></thead><tbody>${detailRows}</tbody></table>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  return {
    soles,
    solesLoading,
    invalidateSoles: () => { solesLoaded.value = false; entriesByYear.value = {}; },
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
    exportPdf,
  };
});
