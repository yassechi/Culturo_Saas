// culturo/front-culturo/src/stores/planning.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { isAxiosError } from 'axios';
import { exploitationsApi } from '@/api/exploitations';
import { rotationsApi } from '@/api/rotations';
import { getConfig } from '@/stores/config';
import { useHistoryStore } from '@/stores/history';
import type {
  SoleWithBoards,
  CulturePlanEntry,
  PlantableVegetable,
  PlantableSection,
  SelectedSection,
  AssignmentForm,
  RuleMessage,
  SectionDisplay,
  VegetableGroup,
  ExploitationSummary,
  BoardSummary,
} from '@/types/planning';

function sectionsPerBoardDefault() { return getConfig().defaultSectionsPerBoard; }

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeDefaultForm(
  year = new Date().getFullYear(),
  defaults?: { startDate?: string; endDate?: string; vegetableId?: number },
): AssignmentForm {
  const today = new Date();
  const currentYear = today.getFullYear();
  const defaultStart = year === currentYear ? todayIso() : `${year}-01-01`;

  // endDate = startDate + 90 jours (plafond : 31 décembre de l'année)
  const startRef = defaults?.startDate ? new Date(defaults.startDate) : today;
  const endCandidate = new Date(startRef);
  endCandidate.setDate(endCandidate.getDate() + 90);
  const yearCap = new Date(year, 11, 31);
  const defaultEnd = dateIso(endCandidate > yearCap ? yearCap : endCandidate);

  return {
    vegetableId: defaults?.vegetableId ?? null,
    startDate: defaults?.startDate ?? defaultStart,
    endDate: defaults?.endDate ?? defaultEnd,
    quantityPlanted: 0,
    unity: 'kg',
    varietyIdentifier: '',
    bypass: false,
  };
}

export const usePlanningStore = defineStore('planning', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const soles = ref<SoleWithBoards[]>([]);
  const selectedSoleId = ref<number | null>(null);
  const selectedExploitationId = ref<number | null>(null);
  const selectedYear = ref<number>(new Date().getFullYear());
  const solesLoading = ref(false);
  const solesError = ref<string | null>(null);
  const solesLoaded = ref(false);

  const culturePlan = ref<CulturePlanEntry[]>([]);
  const planLoading = ref(false);
  const planError = ref<string | null>(null);
  let culturePlanRequestId = 0;

  const openSection = ref<SelectedSection | null>(null);
  const plantableVegetables = ref<PlantableVegetable[]>([]);
  const vegetablesLoading = ref(false);
  let plantableVegetablesRequestId = 0;

  const assignmentForm = ref<AssignmentForm>(makeDefaultForm());
  const assignmentLoading = ref(false);
  const lastRuleMessage = ref<RuleMessage | null>(null);

  // boardId → numberOfSections (populated on first open of each board)
  const sectionPlanCache = ref<Map<number, number>>(new Map());

  // ── Vegetable-first search ──────────────────────────────────────────────────
  const vegetableSearchOpen = ref(false);
  const plantableSections = ref<PlantableSection[]>([]);
  const plantableSectionsLoading = ref(false);
  const plantableSectionsError = ref<string | null>(null);

  // ── Getters ────────────────────────────────────────────────────────────────
  const selectedSole = computed<SoleWithBoards | null>(
    () => soles.value.find((s) => s.id_sole === selectedSoleId.value) ?? null,
  );

  const uniqueExploitations = computed<ExploitationSummary[]>(() => {
    const seen = new Set<number>();
    return soles.value
      .map((s) => s.exploitation)
      .filter((e) => {
        if (seen.has(e.id_exploitation)) return false;
        seen.add(e.id_exploitation);
        return true;
      });
  });

  const boardsForSelectedSole = computed<BoardSummary[]>(
    () => selectedSole.value?.boards ?? [],
  );

  const boardSectionsCount = computed<Map<number, number>>(() => {
    const result = new Map<number, number>();
    for (const board of boardsForSelectedSole.value) {
      const cached = sectionPlanCache.value.get(board.id_board);
      if (cached !== undefined) {
        result.set(board.id_board, cached);
      } else {
        // Derive from culture plan until we have actual plan data
        const maxFromPlan = culturePlan.value
          .filter((e) => e.boardId === board.id_board)
          .reduce((max, e) => Math.max(max, e.sectionNumber), 0);
        result.set(board.id_board, Math.max(maxFromPlan, sectionsPerBoardDefault()));
      }
    }
    return result;
  });

  const sectionDisplayMap = computed<Map<string, SectionDisplay>>(() => {
    const map = new Map<string, SectionDisplay>();

    for (const board of boardsForSelectedSole.value) {
      const n = boardSectionsCount.value.get(board.id_board) ?? sectionsPerBoardDefault();
      for (let k = 1; k <= n; k++) {
        map.set(`${board.id_board}-${k}`, { sectionNumber: k, status: 'available' });
      }
    }

    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const isCurrentYear = selectedYear.value === today.getFullYear();

    for (const entry of culturePlan.value) {
      const endDate = new Date(entry.endDate);
      const endUtc = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
      // Pour l'année courante : une culture terminée libère la section pour re-plantation.
      // Pour les années passées : on affiche toutes les cultures pour conserver l'historique visuel.
      if (isCurrentYear && endUtc < todayUtc) continue;
      map.set(`${entry.boardId}-${entry.sectionNumber}`, {
        sectionNumber: entry.sectionNumber,
        status: 'occupied',
        vegetableName: entry.vegetableName,
        startDate: entry.startDate,
        endDate: entry.endDate,
      });
    }

    return map;
  });

  const vegetableGroups = computed<VegetableGroup[]>(() => {
    const groupMap = new Map<string, VegetableGroup>();

    for (const veg of plantableVegetables.value) {
      if (!groupMap.has(veg.familyName)) {
        groupMap.set(veg.familyName, {
          familyName: veg.familyName,
          importance: veg.importance,
          neverPlanted: veg.neverPlantedInSection,
          lastPlantedDate: veg.lastPlantedInSection,
          vegetables: [],
        });
      }
      const group = groupMap.get(veg.familyName)!;
      group.vegetables.push(veg);
      if (!veg.neverPlantedInSection) group.neverPlanted = false;
      if (
        veg.lastPlantedInSection &&
        (!group.lastPlantedDate || veg.lastPlantedInSection > group.lastPlantedDate)
      ) {
        group.lastPlantedDate = veg.lastPlantedInSection;
      }
    }

    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.neverPlanted && !b.neverPlanted) return -1;
      if (!a.neverPlanted && b.neverPlanted) return 1;
      if (!a.lastPlantedDate && !b.lastPlantedDate) return 0;
      if (!a.lastPlantedDate) return -1;
      if (!b.lastPlantedDate) return 1;
      return a.lastPlantedDate.localeCompare(b.lastPlantedDate);
    });
  });

  // Sections grouped by board for the vegetable-first search results
  const plantableSectionsByBoard = computed(() => {
    const map = new Map<number, { boardName: string; sections: PlantableSection[] }>();
    for (const s of plantableSections.value) {
      if (!map.has(s.boardId)) {
        map.set(s.boardId, { boardName: s.boardName, sections: [] });
      }
      map.get(s.boardId)!.sections.push(s);
    }
    return Array.from(map.values()).sort((a, b) => a.boardName.localeCompare(b.boardName));
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  async function loadSoles() {
    if (solesLoaded.value && !solesError.value) return;
    solesLoading.value = true;
    solesError.value = null;
    try {
      const response = await exploitationsApi.getAllSoles();
      soles.value = response.data;
      solesLoaded.value = true;

      const availableExploitationIds = new Set(
        response.data.map((sole) => sole.exploitation.id_exploitation),
      );
      if (
        selectedExploitationId.value === null ||
        !availableExploitationIds.has(selectedExploitationId.value)
      ) {
        selectedExploitationId.value =
          response.data[0]?.exploitation.id_exploitation ?? null;
      }
    } catch {
      solesError.value = 'Impossible de charger les exploitations.';
    } finally {
      solesLoading.value = false;
    }
  }

  async function loadCulturePlan() {
    if (!selectedSoleId.value) return;
    const requestId = ++culturePlanRequestId;
    planLoading.value = true;
    planError.value = null;
    try {
      const response = await rotationsApi.getCulturePlan(selectedSoleId.value, selectedYear.value);
      if (requestId !== culturePlanRequestId) return;
      culturePlan.value = response.data;
    } catch {
      if (requestId !== culturePlanRequestId) return;
      planError.value = 'Impossible de charger le plan de culture.';
    } finally {
      if (requestId === culturePlanRequestId) {
        planLoading.value = false;
      }
    }
  }

  async function selectYear(year: number) {
    selectedYear.value = year;
    await loadCulturePlan();
  }

  async function selectSole(soleId: number) {
    selectedSoleId.value = soleId;
    culturePlan.value = [];
    closeSectionPanel();
    await loadCulturePlan();
  }

  function selectExploitation(exploitationId: number | null) {
    selectedExploitationId.value = exploitationId;
    clearSelectedSole();
  }

  function clearSelectedSole() {
    selectedSoleId.value = null;
    culturePlan.value = [];
    planError.value = null;
    culturePlanRequestId += 1;
    planLoading.value = false;
    closeSectionPanel();
  }

  function openSectionPanel(
    boardId: number,
    boardName: string,
    sectionNumber: number,
    defaults?: { startDate?: string; endDate?: string; vegetableId?: number },
    plantingMode = false,
    harvestSectionId?: number,
  ) {
    plantableVegetablesRequestId += 1;
    openSection.value = { boardId, boardName, sectionNumber, sectionPlanId: null, plantingMode, harvestSectionId };
    plantableVegetables.value = [];
    lastRuleMessage.value = null;
    assignmentForm.value = makeDefaultForm(selectedYear.value, defaults);
  }

  function closeSectionPanel() {
    openSection.value = null;
    plantableVegetables.value = [];
    lastRuleMessage.value = null;
    plantableVegetablesRequestId += 1;
    vegetablesLoading.value = false;
  }

  async function loadPlantableVegetables() {
    if (!openSection.value) return;
    const requestId = ++plantableVegetablesRequestId;
    vegetablesLoading.value = true;
    try {
      const planResp = await rotationsApi.createOrGetSectionPlan(openSection.value.boardId, getConfig().defaultSectionsPerBoard);
      if (requestId !== plantableVegetablesRequestId || !openSection.value) return;

      openSection.value.sectionPlanId = planResp.data.sectionPlan.id_section_plan;

      // Cache section count for this board
      const n = planResp.data.sectionPlan.number_of_section;
      sectionPlanCache.value = new Map(sectionPlanCache.value).set(openSection.value.boardId, n);

      const vegResp = await rotationsApi.getPlantableVegetables(
        openSection.value.sectionPlanId,
        openSection.value.sectionNumber,
        assignmentForm.value.startDate,
        assignmentForm.value.endDate,
      );
      if (requestId !== plantableVegetablesRequestId) return;
      plantableVegetables.value = vegResp.data;
    } catch {
      if (requestId !== plantableVegetablesRequestId) return;
      lastRuleMessage.value = {
        type: 'warning',
        text: 'Impossible de charger les légumes compatibles.',
        canProceed: false,
      };
    } finally {
      if (requestId === plantableVegetablesRequestId) {
        vegetablesLoading.value = false;
      }
    }
  }

  async function checkVegetableCompatibility(vegetableId: number) {
    if (!openSection.value) return;
    assignmentForm.value.vegetableId = vegetableId;
    lastRuleMessage.value = null;
    try {
      const resp = await rotationsApi.canPlantVegetable(
        openSection.value.boardId,
        vegetableId,
        assignmentForm.value.startDate,
        assignmentForm.value.endDate,
      );
      if (resp.data.status === 'OK') {
        lastRuleMessage.value = {
          type: 'ok',
          text: '✅ Compatible — aucune contrainte de rotation détectée.',
          canProceed: true,
          needsBypass: false,
        };
      } else {
        lastRuleMessage.value = {
          type: 'warning',
          text: `⚠️ ${resp.data.reason ?? 'Règle de rotation non respectée.'}`,
          canProceed: resp.data.neededBypass !== true,
          needsBypass: resp.data.neededBypass === true,
        };
      }
    } catch {
      lastRuleMessage.value = {
        type: 'warning',
        text: 'Impossible de vérifier la compatibilité pour le moment.',
        canProceed: false,
        needsBypass: false,
      };
    }
  }

  async function submitAssignment(bypass: boolean): Promise<boolean> {
    if (!openSection.value || !assignmentForm.value.vegetableId) return false;
    assignmentLoading.value = true;
    lastRuleMessage.value = null;
    try {
      await rotationsApi.addVegetableToBoard({
        boardId: openSection.value.boardId,
        sectionNumber: openSection.value.sectionNumber,
        vegetableId: assignmentForm.value.vegetableId,
        startDate: assignmentForm.value.startDate,
        endDate: assignmentForm.value.endDate,
        quantityPlanted: assignmentForm.value.quantityPlanted,
        unity: assignmentForm.value.unity,
        varietyIdentifier: assignmentForm.value.varietyIdentifier || 'Standard',
        bypass,
      });
      await loadCulturePlan();
      useHistoryStore().invalidateSoles();
      return true;
    } catch (error: unknown) {
      const data = isAxiosError(error) ? (error.response?.data as { message?: string; warningDetails?: unknown } | undefined) : undefined;
      if (data?.warningDetails) {
        const msg =
          typeof data.message === 'string' && data.message.length > 0
            ? data.message
            : "Règle de rotation non respectée. Vérifiez l'historique de la planche.";
        lastRuleMessage.value = { type: 'warning', text: `⚠️ ${msg}` };
      } else {
        lastRuleMessage.value = {
          type: 'warning',
          text: 'Une erreur est survenue. Veuillez réessayer.',
        };
      }
      return false;
    } finally {
      assignmentLoading.value = false;
    }
  }

  function resetAssignmentForm() {
    assignmentForm.value = makeDefaultForm(selectedYear.value);
    lastRuleMessage.value = null;
  }

  // ── Vegetable-first search ──────────────────────────────────────────────────

  function openVegetableSearch() {
    vegetableSearchOpen.value = true;
    plantableSections.value = [];
    plantableSectionsError.value = null;
  }

  function closeVegetableSearch() {
    vegetableSearchOpen.value = false;
    plantableSections.value = [];
    plantableSectionsError.value = null;
  }

  async function findPlantableSections(vegetableId: number, startDate: string, endDate: string) {
    plantableSectionsLoading.value = true;
    plantableSectionsError.value = null;
    try {
      const resp = await rotationsApi.getPlantableSections(vegetableId, startDate, endDate);
      plantableSections.value = resp.data;
    } catch {
      plantableSectionsError.value = 'Impossible de trouver les sections disponibles.';
    } finally {
      plantableSectionsLoading.value = false;
    }
  }

  function jumpToSection(
    section: PlantableSection,
    vegetableId: number,
    startDate: string,
    endDate: string,
  ) {
    closeVegetableSearch();
    openSectionPanel(section.boardId, section.boardName, section.sectionNumber, {
      startDate,
      endDate,
      vegetableId,
    });
  }

  return {
    // state
    soles,
    selectedSoleId,
    selectedExploitationId,
    selectedYear,
    solesLoading,
    solesError,
    culturePlan,
    planLoading,
    planError,
    openSection,
    plantableVegetables,
    vegetablesLoading,
    assignmentForm,
    assignmentLoading,
    lastRuleMessage,
    sectionPlanCache,
    vegetableSearchOpen,
    plantableSections,
    plantableSectionsLoading,
    plantableSectionsError,
    // getters
    selectedSole,
    uniqueExploitations,
    boardsForSelectedSole,
    boardSectionsCount,
    sectionDisplayMap,
    vegetableGroups,
    plantableSectionsByBoard,
    // actions
    invalidateSoles: () => { solesLoaded.value = false; },
    loadSoles,
    loadCulturePlan,
    selectYear,
    selectExploitation,
    selectSole,
    clearSelectedSole,
    openSectionPanel,
    closeSectionPanel,
    loadPlantableVegetables,
    checkVegetableCompatibility,
    submitAssignment,
    resetAssignmentForm,
    openVegetableSearch,
    closeVegetableSearch,
    findPlantableSections,
    jumpToSection,
  };
});
