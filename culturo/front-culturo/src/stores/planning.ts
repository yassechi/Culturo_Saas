// culturo/front-culturo/src/stores/planning.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { exploitationsApi } from '@/api/exploitations';
import { rotationsApi } from '@/api/rotations';
import type {
  SoleWithBoards,
  CulturePlanEntry,
  PlantableVegetable,
  SelectedSection,
  AssignmentForm,
  RuleMessage,
  SectionDisplay,
  VegetableGroup,
  ExploitationSummary,
  BoardSummary,
} from '@/types/planning';

const SECTIONS_PER_BOARD = 3;

function makeDefaultForm(
  year = new Date().getFullYear(),
  defaults?: { startDate?: string; endDate?: string },
): AssignmentForm {
  return {
    vegetableId: null,
    startDate: defaults?.startDate ?? `${year}-01-01`,
    endDate: defaults?.endDate ?? `${year}-12-31`,
    quantityPlanted: 0,
    unity: 'unité',
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

  const sectionDisplayMap = computed<Map<string, SectionDisplay>>(() => {
    const map = new Map<string, SectionDisplay>();

    for (const board of boardsForSelectedSole.value) {
      for (let n = 1; n <= SECTIONS_PER_BOARD; n++) {
        map.set(`${board.id_board}-${n}`, { sectionNumber: n, status: 'available' });
      }
    }

    for (const entry of culturePlan.value) {
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

  // ── Actions ────────────────────────────────────────────────────────────────
  async function loadSoles() {
    solesLoading.value = true;
    solesError.value = null;
    try {
      const response = await exploitationsApi.getAllSoles();
      soles.value = response.data;

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
    defaults?: { startDate?: string; endDate?: string },
  ) {
    plantableVegetablesRequestId += 1;
    openSection.value = { boardId, boardName, sectionNumber, sectionPlanId: null };
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
      const planResp = await rotationsApi.createOrGetSectionPlan(openSection.value.boardId);
      if (requestId !== plantableVegetablesRequestId || !openSection.value) return;
      openSection.value.sectionPlanId = planResp.data.sectionPlan.id_section_plan;

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
      const resp = await rotationsApi.canPlantVegetable(openSection.value.boardId, vegetableId);
      if (resp.data.status === 'OK') {
        lastRuleMessage.value = {
          type: 'ok',
          text: '✅ Compatible — aucune contrainte de rotation détectée.',
        };
      } else {
        lastRuleMessage.value = {
          type: 'warning',
          text: `⚠️ ${resp.data.reason ?? 'Règle de rotation non respectée.'}`,
        };
      }
    } catch {
      // Ne pas bloquer l'UI si cette vérification échoue
    }
  }

  async function submitAssignment(bypass: boolean) {
    if (!openSection.value || !assignmentForm.value.vegetableId) return;
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
      closeSectionPanel();
    } catch (error: any) {
      const data = error?.response?.data;
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
    } finally {
      assignmentLoading.value = false;
    }
  }

  function resetAssignmentForm() {
    assignmentForm.value = makeDefaultForm(selectedYear.value);
    lastRuleMessage.value = null;
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
    // getters
    selectedSole,
    uniqueExploitations,
    boardsForSelectedSole,
    sectionDisplayMap,
    vegetableGroups,
    // actions
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
  };
});
