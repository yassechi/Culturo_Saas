<template>
  <div class="history-view">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="view-header">
      <div class="header-title">
        <h1>Historique des cultures</h1>
        <p class="header-sub">Mémoire des parcelles, alertes de rotation et exports</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.plantings }}</span>
          <span class="stat-label">Plantations</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.uniqueVegetables }}</span>
          <span class="stat-label">Légumes</span>
        </div>
        <div class="stat-chip" :class="store.stats.criticalAlerts > 0 ? 'chip-alert' : ''">
          <span class="stat-value">{{ store.stats.alerts }}</span>
          <span class="stat-label">Alertes</span>
        </div>
      </div>
    </div>

    <!-- ── Filters ─────────────────────────────────────────────────────────── -->
    <div class="filter-bar">
      <!-- Exploitation filter -->
      <div class="filter-group">
        <label>Exploitation</label>
        <select v-model="exploitationModel">
          <option value="">Toutes</option>
          <option
            v-for="exp in store.uniqueExploitations"
            :key="exp.id_exploitation"
            :value="String(exp.id_exploitation)"
          >{{ exp.exploitation_name }}</option>
        </select>
      </div>

      <!-- Sole filter -->
      <div class="filter-group">
        <label>Sole</label>
        <select v-model="soleModel">
          <option value="">Toutes les soles</option>
          <option
            v-for="sole in filteredSoles"
            :key="sole.id_sole"
            :value="String(sole.id_sole)"
          >{{ sole.sole_name }}</option>
        </select>
      </div>

      <!-- Vegetable filter -->
      <div class="filter-group">
        <label>Légume</label>
        <div class="veg-input-wrap">
          <input
            v-model="store.searchQuery"
            list="veg-suggestions"
            class="veg-input"
            placeholder="Tous les légumes…"
            autocomplete="off"
          />
          <button
            v-if="store.searchQuery"
            class="veg-clear"
            type="button"
            @click="store.searchQuery = ''"
          >✕</button>
        </div>
        <datalist id="veg-suggestions">
          <option v-for="v in uniqueVegetableNames" :key="v" :value="v" />
        </datalist>
      </div>

      <!-- Year range -->
      <div class="filter-group year-filter">
        <label>Années analysées</label>
        <div class="year-chips">
          <button
            v-for="y in availableYears"
            :key="y"
            class="year-chip"
            :class="{ active: store.selectedYears.includes(y) }"
            @click="store.toggleYear(y)"
          >{{ y }}</button>
        </div>
      </div>

      <!-- Search + Export -->
      <div class="export-group">
        <button
          class="btn-search"
          :disabled="isLoading"
          @click="doSearch"
        >
          <span v-if="isLoading">Chargement…</span>
          <span v-else>Rechercher</span>
        </button>
        <button
          class="btn-export"
          :disabled="store.filteredEntries.length === 0"
          @click="store.exportCsv()"
        >
          ↓ CSV
        </button>
        <button
          class="btn-export btn-export-pdf"
          :disabled="store.filteredEntries.length === 0"
          @click="store.exportPdf()"
        >
          ↓ PDF
        </button>
      </div>
    </div>

    <!-- Errors -->
    <div v-if="store.loadErrors.length" class="global-error">
      {{ store.loadErrors.join(' — ') }}
    </div>

    <!-- Search result banner -->
    <div v-if="searchDone && !isLoading" class="search-banner" :class="store.filteredEntries.length > 0 ? 'banner-ok' : 'banner-empty'">
      <span v-if="store.filteredEntries.length > 0">
        <strong>{{ store.filteredEntries.length }}</strong> résultat(s) trouvé(s)
        <span v-if="store.searchQuery"> pour "{{ store.searchQuery }}"</span>
        sur <strong>{{ store.allEntries.length }}</strong> entrée(s) chargée(s)
      </span>
      <span v-else>
        Aucun résultat<span v-if="store.searchQuery"> pour "{{ store.searchQuery }}"</span>.
        {{ store.allEntries.length === 0 ? 'Aucune donnée pour cette sélection — essayez d\'autres années.' : 'Essayez un autre terme.' }}
      </span>
    </div>

    <div class="results-area">
      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-bar">
        <div class="loading-fill" />
      </div>

      <!-- ── Tabs ──────────────────────────────────────────────────────────── -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'alerts' && store.stats.alerts > 0" class="tab-badge">
            {{ store.stats.alerts }}
          </span>
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: Historique                                                    -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeTab === 'history'" class="tab-panel">
        <div class="panel-toolbar">
          <select v-model="store.filterBoard" class="filter-select">
            <option value="">Toutes les planches</option>
            <option v-for="b in store.uniqueBoards" :key="b" :value="b">{{ b }}</option>
          </select>
          <span class="result-count">
            {{ store.allEntries.length }} entrée(s) chargée(s) —
            {{ store.filteredEntries.length }} affichée(s)
          </span>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Année</th>
                <th>Exploitation</th>
                <th>Sole</th>
                <th>Planche</th>
                <th>Section</th>
                <th>Légume</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(entry, i) in store.filteredEntries"
                :key="i"
                :class="{ 'row-alert': isAlerted(entry.boardName, entry.sectionNumber, entry.vegetableName) }"
              >
                <td>
                  <span class="year-badge" :style="yearColor(entry.year)">{{ entry.year }}</span>
                </td>
                <td class="text-muted">{{ entry.exploitationName }}</td>
                <td class="fw-600">{{ entry.soleName }}</td>
                <td class="fw-600">{{ entry.boardName }}</td>
                <td class="center">{{ entry.sectionNumber }}</td>
                <td class="fw-700">{{ entry.vegetableName }}</td>
                <td class="mono">{{ formatDate(entry.startDate) }}</td>
                <td class="mono">{{ formatDate(entry.endDate) }}</td>
                <td class="center">{{ daysBetween(entry.startDate, entry.endDate) }}j</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="store.filteredEntries.length === 0 && !isLoading" class="empty-state">
          <template v-if="store.allEntries.length === 0">
            Aucune donnée chargée pour les années sélectionnées.
            <br />
            <span class="empty-hint">Essayez d'activer des années antérieures dans "Années analysées".</span>
          </template>
          <template v-else>
            Aucune culture correspondant au filtre "{{ store.searchQuery || store.filterBoard }}".
          </template>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: Mémoire des parcelles                                         -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeTab === 'memory'" class="tab-panel">
        <div class="memory-legend">
          <span class="legend-dot dot-green" /> Cultivé
          <span class="legend-dot dot-orange ml" /> Répétition détectée
          <span class="legend-dot dot-gray ml" /> Vide
        </div>

        <div class="table-wrap">
          <table class="data-table memory-table">
            <thead>
              <tr>
                <th>Planche</th>
                <th>Section</th>
                <th v-for="y in store.selectedYears" :key="y" class="center">{{ y }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in store.parcelMemory" :key="`${row.boardName}-${row.sectionNumber}`">
                <td class="fw-600">{{ row.boardName }}</td>
                <td class="center">{{ row.sectionNumber }}</td>
                <td
                  v-for="cell in row.cells"
                  :key="cell.year"
                  class="memory-cell"
                  :class="memoryCellClass(row, cell)"
                  :title="cell.vegetableName ?? 'Vide'"
                >
                  <span v-if="cell.vegetableName" class="cell-veg">{{ cell.vegetableName }}</span>
                  <span v-else class="cell-empty">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="store.parcelMemory.length === 0 && !isLoading" class="empty-state">
          Aucune donnée de parcelle pour cette sélection.
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: Alertes de rotation                                           -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeTab === 'alerts'" class="tab-panel">
        <div v-if="store.rotationAlerts.length === 0" class="no-alerts">
          <div class="no-alerts-icon">✅</div>
          <p>Aucune alerte de rotation détectée pour cette période.</p>
          <p class="no-alerts-sub">Les rotations semblent respectées sur les années sélectionnées.</p>
        </div>

        <div v-else class="alerts-list">
          <div
            v-for="(alert, i) in store.rotationAlerts"
            :key="i"
            class="alert-card"
            :class="`alert-${alert.severity}`"
          >
            <div class="alert-icon">{{ alert.severity === 'critical' ? '🔴' : '🟡' }}</div>
            <div class="alert-body">
              <div class="alert-title">
                <strong>{{ alert.vegetableName }}</strong>
                <span class="alert-location">{{ alert.boardName }} — Section {{ alert.sectionNumber }}</span>
              </div>
              <div class="alert-detail">
                Planté {{ alert.years.length }} fois sur les années :
                <span
                  v-for="y in alert.years"
                  :key="y"
                  class="alert-year"
                  :style="yearColor(y)"
                >{{ y }}</span>
              </div>
              <p class="alert-advice">
                <template v-if="alert.severity === 'critical'">
                  Même légume planté deux années consécutives — risque élevé d'appauvrissement et de maladies.
                  Recommandation : respecter au minimum 2 ans de pause.
                </template>
                <template v-else>
                  Même légume planté plusieurs fois sur la période — surveiller la santé du sol.
                </template>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHistoryStore } from '@/stores/history';
import { useBotanicalStore } from '@/stores/botanical';

const store = useHistoryStore();
const botanical = useBotanicalStore();
const activeTab = ref<'history' | 'memory' | 'alerts'>('history');

const tabs = [
  { key: 'history' as const, label: 'Historique' },
  { key: 'memory' as const, label: 'Mémoire des parcelles' },
  { key: 'alerts' as const, label: 'Alertes rotation' },
];

// v-model pour exploitation: string <-> number|null
const exploitationModel = computed({
  get: () => store.selectedExploitationId != null ? String(store.selectedExploitationId) : '',
  set: (val: string) => {
    store.selectExploitation(val ? Number(val) : null);
  },
});

// v-model pour sole: string <-> number|null
const soleModel = computed({
  get: () => store.selectedSoleId != null ? String(store.selectedSoleId) : '',
  set: (val: string) => {
    if (val) {
      store.selectSole(Number(val));
    } else {
      // "Toutes les soles" sélectionné — recharger pour l'exploitation active
      store.clearSole();
    }
  },
});

const filteredSoles = computed(() =>
  store.selectedExploitationId
    ? store.soles.filter((s) => s.exploitation?.id_exploitation === store.selectedExploitationId)
    : store.soles,
);

const uniqueVegetableNames = computed(() =>
  [...botanical.vegetables.map((v) => v.vegetable_name)].sort(),
);

// Available years: 8 years back to current
const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 7 + i);

const isLoading = computed(() => store.loadingYears.size > 0);
const searchDone = ref(false);

async function doSearch() {
  searchDone.value = false;
  await store.loadAllSelectedYears(true);
  searchDone.value = true;
  activeTab.value = 'history';
}

onMounted(async () => {
  await store.loadSoles();
  store.loadAllSelectedYears();
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const YEAR_COLORS = ['#4a6741', '#8b5e3c', '#3b6e8a', '#7a4c8a', '#5e7a4c'];

function yearColor(year: number): Record<string, string> {
  const idx = store.selectedYears.indexOf(year) % YEAR_COLORS.length;
  const color = YEAR_COLORS[idx >= 0 ? idx : 0];
  return { background: `${color}18`, color, border: `1px solid ${color}30` };
}

function formatDate(d: string | Date): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysBetween(start: string | Date, end: string | Date): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000);
}

const alertedKeys = computed(() => {
  const s = new Set<string>();
  store.rotationAlerts.forEach((a) => s.add(`${a.boardName}-${a.sectionNumber}-${a.vegetableName}`));
  return s;
});

function isAlerted(boardName: string, section: number, veg: string): boolean {
  return alertedKeys.value.has(`${boardName}-${section}-${veg}`);
}

function memoryCellClass(
  row: { boardName: string; sectionNumber: number },
  cell: { year: number; vegetableName: string | null },
) {
  if (!cell.vegetableName) return 'cell-void';
  const isAlert = alertedKeys.value.has(`${row.boardName}-${row.sectionNumber}-${cell.vegetableName}`);
  return isAlert ? 'cell-alerted' : 'cell-filled';
}
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────────────────── */
.history-view {
  padding: 1.5rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
}

.header-sub {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: rgba(39, 65, 53, 0.6);
}

.header-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1.1rem;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(251,246,236,0.86));
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 2px 8px rgba(39,65,53,0.06);
  min-width: 64px;
  transition: border-color 200ms;
}

.stat-chip.chip-alert {
  border-color: rgba(200,100,30,0.3);
  background: linear-gradient(180deg, rgba(255,240,220,0.9), rgba(255,230,200,0.86));
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.55);
  margin-top: 0.25rem;
}

/* ── Filter bar ───────────────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(251,246,236,0.86));
  border: 1px solid rgba(39,65,53,0.08);
  box-shadow: 0 2px 8px rgba(39,65,53,0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-group label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39,65,53,0.55);
}

.filter-group select {
  padding: 0.65rem 0.9rem;
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 12px;
  font-size: 0.88rem;
  background: rgba(255,255,255,0.94);
  color: var(--text-primary);
  min-width: 180px;
}

.filter-group select:disabled { opacity: 0.5; cursor: not-allowed; }

.veg-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.veg-input {
  padding: 0.65rem 2rem 0.65rem 0.9rem;
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 12px;
  font-size: 0.88rem;
  background: rgba(255,255,255,0.94);
  color: var(--text-primary);
  min-width: 180px;
}

.veg-clear {
  position: absolute;
  right: 0.5rem;
  border: none;
  background: none;
  color: rgba(39,65,53,0.4);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.2rem;
  line-height: 1;
  border-radius: 4px;
}
.veg-clear:hover { color: var(--text-primary); }

.year-filter { flex: 1; min-width: 240px; }

.year-chips {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.year-chip {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1.5px solid rgba(39,65,53,0.15);
  background: rgba(255,255,255,0.9);
  color: rgba(39,65,53,0.55);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 160ms;
}

.year-chip.active {
  background: rgba(74,103,65,0.12);
  border-color: rgba(74,103,65,0.35);
  color: rgba(39,65,53,0.9);
}

.btn-export {
  padding: 0.65rem 1.2rem;
  border-radius: 12px;
  border: 1.5px solid rgba(39,65,53,0.18);
  background: rgba(255,255,255,0.9);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  white-space: nowrap;
  align-self: flex-end;
  transition: background 160ms, border-color 160ms;
}
.btn-export:hover { background: rgba(74,103,65,0.08); border-color: rgba(74,103,65,0.3); }
.btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-export-pdf { border-color: rgba(180,120,0,0.25); color: #7a5600; }
.btn-export-pdf:hover { background: rgba(180,120,0,0.08); border-color: rgba(180,120,0,0.4); }

.export-group { display: flex; gap: 0.5rem; align-self: flex-end; }

.btn-search {
  padding: 0.65rem 1.4rem;
  border-radius: 12px;
  border: none;
  background: rgba(74,103,65,0.85);
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 160ms;
}
.btn-search:hover { background: rgba(74,103,65,1); }
.btn-search:disabled { opacity: 0.5; cursor: not-allowed; }

.results-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid rgba(39,65,53,0.1);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.4rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(39,65,53,0.5);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 160ms, border-color 160ms;
  border-radius: 8px 8px 0 0;
}

.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active {
  color: var(--text-primary);
  border-bottom-color: rgba(74,103,65,0.8);
  background: rgba(74,103,65,0.06);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.3rem;
  height: 1.3rem;
  border-radius: 999px;
  background: rgba(200,100,30,0.15);
  color: #a04010;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0 0.3rem;
}

/* ── Panel toolbar ────────────────────────────────────────────────────────── */
.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 0.6rem 0.9rem;
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 12px;
  font-size: 0.88rem;
  background: rgba(255,255,255,0.94);
  color: var(--text-primary);
  min-width: 180px;
}

.result-count {
  font-size: 0.82rem;
  color: rgba(39,65,53,0.45);
  margin-left: auto;
}

/* ── Table ────────────────────────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border-radius: 20px;
  border: 1px solid rgba(39,65,53,0.1);
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(251,246,236,0.88));
  box-shadow: 0 2px 12px rgba(39,65,53,0.06);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead tr { border-bottom: 1px solid rgba(39,65,53,0.1); }

.data-table th {
  padding: 0.8rem 1rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.55);
  white-space: nowrap;
}

.data-table td {
  padding: 0.65rem 1rem;
  color: var(--text-primary);
  border-bottom: 1px solid rgba(39,65,53,0.06);
  white-space: nowrap;
}

.data-table tbody tr:hover { background: rgba(74,103,65,0.03); }

.row-alert { background: rgba(200,100,30,0.04) !important; }
.row-alert td { border-bottom-color: rgba(200,100,30,0.12) !important; }

.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; }
.center { text-align: center; }
.mono { font-variant-numeric: tabular-nums; }
.text-muted { color: rgba(39,65,53,0.45); font-size: 0.82rem; }

.year-badge {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

/* ── Memory table ─────────────────────────────────────────────────────────── */
.memory-legend {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgba(39,65,53,0.6);
  padding: 0.2rem 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.dot-green { background: rgba(74,140,65,0.6); }
.dot-orange { background: rgba(200,100,30,0.6); }
.dot-gray { background: rgba(39,65,53,0.15); }
.ml { margin-left: 1rem; }

.memory-table .data-table th.center { text-align: center; }

.memory-cell {
  text-align: center;
  min-width: 110px;
  max-width: 150px;
}

.cell-filled { background: rgba(74,140,65,0.07); }
.cell-alerted { background: rgba(200,100,30,0.09); }
.cell-void { }

.cell-veg {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
  margin: 0 auto;
}

.cell-empty {
  color: rgba(39,65,53,0.25);
  font-size: 0.85rem;
}

/* ── Alerts ───────────────────────────────────────────────────────────────── */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-card {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 16px;
  border: 1px solid transparent;
}

.alert-critical {
  background: rgba(200,50,50,0.06);
  border-color: rgba(200,50,50,0.18);
}

.alert-warning {
  background: rgba(200,130,30,0.06);
  border-color: rgba(200,130,30,0.18);
}

.alert-icon { font-size: 1.3rem; flex-shrink: 0; }

.alert-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.alert-title {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.alert-title strong {
  font-size: 1rem;
  color: var(--text-primary);
}

.alert-location {
  font-size: 0.8rem;
  color: rgba(39,65,53,0.55);
}

.alert-detail {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.84rem;
  color: rgba(39,65,53,0.7);
}

.alert-year {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
}

.alert-advice {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(39,65,53,0.55);
  line-height: 1.4;
}

/* ── No-alerts state ──────────────────────────────────────────────────────── */
.no-alerts {
  text-align: center;
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.no-alerts-icon { font-size: 2.5rem; }

.no-alerts p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
}

.no-alerts-sub {
  font-size: 0.82rem !important;
  font-weight: 400 !important;
  color: rgba(39,65,53,0.5) !important;
}

/* ── Empty / loading ──────────────────────────────────────────────────────── */
.empty-hero {
  text-align: center;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon { font-size: 3rem; }

.empty-hero p {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(39,65,53,0.5);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(39,65,53,0.45);
  font-size: 0.9rem;
  line-height: 1.8;
}

.empty-hint {
  font-size: 0.82rem;
  color: rgba(39,65,53,0.35);
}

.global-error {
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  background: rgba(200,60,60,0.08);
  border: 1px solid rgba(200,60,60,0.2);
  color: #b94040;
  font-size: 0.88rem;
}

.search-banner {
  padding: 0.75rem 1.2rem;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
}
.banner-ok {
  background: rgba(74,140,65,0.1);
  border: 1px solid rgba(74,140,65,0.25);
  color: rgba(39,65,53,0.85);
}
.banner-empty {
  background: rgba(200,130,30,0.08);
  border: 1px solid rgba(200,130,30,0.2);
  color: rgba(120,70,0,0.85);
}

.loading-bar {
  height: 3px;
  border-radius: 2px;
  background: rgba(39,65,53,0.08);
  overflow: hidden;
}

.loading-fill {
  height: 100%;
  width: 40%;
  background: rgba(74,103,65,0.6);
  border-radius: 2px;
  animation: slide 1.2s ease-in-out infinite;
}

@keyframes slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .history-view { padding: 1rem; }
  .view-header { flex-direction: column; }
  .header-stats { flex-wrap: wrap; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .data-table th:nth-child(n+6),
  .data-table td:nth-child(n+6) { display: none; }
}
</style>
