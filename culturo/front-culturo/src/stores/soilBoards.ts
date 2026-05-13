// culturo/front-culturo/src/stores/soilBoards.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import {
  soilBoardsApi,
  type ApiExploitation,
  type ApiSole,
  type ApiBoard,
} from '@/api/soilBoards';
import { rotationsApi } from '@/api/rotations';
import { usePlanningStore } from '@/stores/planning';
import { useHistoryStore } from '@/stores/history';

export interface ExploitationCoords {
  lat: number;
  lng: number;
  address?: string;
}

export interface ExploitationForm {
  exploitation_name: string;
  exploitation_locality: string;
  exploitation_active: string;
  address: string;
  coords: ExploitationCoords | null;
}

const COORDS_KEY = 'culturo_exploitation_coords';

function loadAllCoords(): Record<number, ExploitationCoords> {
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAllCoords(map: Record<number, ExploitationCoords>) {
  localStorage.setItem(COORDS_KEY, JSON.stringify(map));
}

export interface SoleForm {
  sole_name: string;
  id_exploitation: number | null;
}

export interface BoardForm {
  board_name: string;
  board_width: number;
  board_length: number;
  board_active: boolean;
  id_sole: number | null;
}

function emptyExpForm(): ExploitationForm {
  return { exploitation_name: '', exploitation_locality: '', exploitation_active: 'true', address: '', coords: null };
}

function emptySoleForm(exploitationId: number | null = null): SoleForm {
  return { sole_name: '', id_exploitation: exploitationId };
}

function emptyBoardForm(soleId: number | null = null): BoardForm {
  return { board_name: '', board_width: 120, board_length: 300, board_active: true, id_sole: soleId };
}

export const useSoilBoardsStore = defineStore('soilBoards', () => {
  // Data
  const exploitations = ref<ApiExploitation[]>([]);
  const soles = ref<ApiSole[]>([]);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref<string | null>(null);
  const exploitationCoords = ref<Record<number, ExploitationCoords>>(loadAllCoords());

  // Selection
  const selectedExploitationId = ref<number | null>(null);
  const selectedSoleId = ref<number | null>(null);

  // Exploitation modal
  const expModalOpen = ref(false);
  const expModalMode = ref<'create' | 'edit'>('create');
  const expModalId = ref<number | null>(null);
  const expForm = ref<ExploitationForm>(emptyExpForm());
  const expModalError = ref<string | null>(null);
  const expModalLoading = ref(false);

  // Sole modal
  const soleModalOpen = ref(false);
  const soleModalMode = ref<'create' | 'edit'>('create');
  const soleModalId = ref<number | null>(null);
  const soleForm = ref<SoleForm>(emptySoleForm());
  const soleModalError = ref<string | null>(null);
  const soleModalLoading = ref(false);

  // Board modal
  const boardModalOpen = ref(false);
  const boardModalMode = ref<'create' | 'edit'>('create');
  const boardModalId = ref<number | null>(null);
  const boardForm = ref<BoardForm>(emptyBoardForm());
  const boardModalError = ref<string | null>(null);
  const boardModalLoading = ref(false);

  // ── Getters ────────────────────────────────────────────────────────────────

  const selectedExploitation = computed(() =>
    exploitations.value.find((e) => e.id_exploitation === selectedExploitationId.value) ?? null,
  );

  const solesForSelected = computed(() =>
    soles.value.filter(
      (s) => s.exploitation?.id_exploitation === selectedExploitationId.value,
    ),
  );

  const selectedSole = computed(() =>
    soles.value.find((s) => s.id_sole === selectedSoleId.value) ?? null,
  );

  const boardsForSelected = computed(() =>
    (selectedSole.value?.boards ?? []),
  );

  const stats = computed(() => ({
    exploitations: exploitations.value.length,
    soles: soles.value.length,
    boards: soles.value.reduce((sum, s) => sum + (s.boards?.length ?? 0), 0),
  }));

  // ── Load ───────────────────────────────────────────────────────────────────

  async function loadAll(force = false) {
    if (loaded.value && !error.value && !force) return;
    loading.value = true;
    error.value = null;
    try {
      const [expResp, soleResp] = await Promise.all([
        soilBoardsApi.getAllExploitations(),
        soilBoardsApi.getAllSoles(),
      ]);
      exploitations.value = expResp.data;
      soles.value = soleResp.data;
      loaded.value = true;
    } catch {
      error.value = 'Impossible de charger les données.';
    } finally {
      loading.value = false;
    }
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function selectExploitation(id: number) {
    selectedExploitationId.value = id;
    selectedSoleId.value = null;
  }

  function selectSole(id: number) {
    selectedSoleId.value = id;
  }

  // ── Exploitation CRUD ──────────────────────────────────────────────────────

  function openCreateExploitation() {
    expModalMode.value = 'create';
    expModalId.value = null;
    expForm.value = emptyExpForm();
    expModalError.value = null;
    expModalOpen.value = true;
  }

  function openEditExploitation(e: ApiExploitation) {
    expModalMode.value = 'edit';
    expModalId.value = e.id_exploitation;
    expForm.value = {
      exploitation_name: e.exploitation_name,
      exploitation_locality: e.exploitation_locality,
      exploitation_active: e.exploitation_active,
      address: exploitationCoords.value[e.id_exploitation]?.address ?? '',
      coords: exploitationCoords.value[e.id_exploitation] ?? null,
    };
    expModalError.value = null;
    expModalOpen.value = true;
  }

  function closeExpModal() {
    expModalOpen.value = false;
    expModalError.value = null;
  }

  async function submitExpModal(currentUserId: number) {
    expModalLoading.value = true;
    expModalError.value = null;
    try {
      if (expModalMode.value === 'create') {
        const resp = await soilBoardsApi.createExploitation({
          exploitation_name: expForm.value.exploitation_name.trim(),
          exploitation_locality: expForm.value.exploitation_locality.trim(),
          exploitation_active: expForm.value.exploitation_active,
          id_user: currentUserId,
        });
        exploitations.value.push(resp.data);
        if (expForm.value.coords) {
          exploitationCoords.value[resp.data.id_exploitation] = {
            ...expForm.value.coords,
            address: expForm.value.address || expForm.value.coords.address,
          };
          saveAllCoords(exploitationCoords.value);
        }
      } else if (expModalId.value !== null) {
        await soilBoardsApi.updateExploitation({
          id_exploitation: expModalId.value,
          exploitation_name: expForm.value.exploitation_name.trim(),
          exploitation_locality: expForm.value.exploitation_locality.trim(),
          exploitation_active: expForm.value.exploitation_active,
        });
        const idx = exploitations.value.findIndex((e) => e.id_exploitation === expModalId.value);
        if (idx !== -1) Object.assign(exploitations.value[idx], expForm.value);
        if (expForm.value.coords) {
          exploitationCoords.value[expModalId.value] = {
            ...expForm.value.coords,
            address: expForm.value.address || expForm.value.coords.address,
          };
          saveAllCoords(exploitationCoords.value);
        }
      }
      closeExpModal();
    } catch (e: any) {
      expModalError.value = e?.response?.data?.message ?? 'Une erreur est survenue.';
    } finally {
      expModalLoading.value = false;
    }
  }

  function syncPlanningStore() {
    const planningStore = usePlanningStore();
    planningStore.invalidateSoles();
    void planningStore.loadSoles();
    const historyStore = useHistoryStore();
    historyStore.invalidateSoles();
    void historyStore.loadSoles();
  }

  // ── Sole CRUD ──────────────────────────────────────────────────────────────

  function openCreateSole() {
    soleModalMode.value = 'create';
    soleModalId.value = null;
    soleForm.value = emptySoleForm(selectedExploitationId.value);
    soleModalError.value = null;
    soleModalOpen.value = true;
  }

  function openEditSole(s: ApiSole) {
    soleModalMode.value = 'edit';
    soleModalId.value = s.id_sole;
    soleForm.value = {
      sole_name: s.sole_name,
      id_exploitation: s.exploitation?.id_exploitation ?? null,
    };
    soleModalError.value = null;
    soleModalOpen.value = true;
  }

  function closeSoleModal() {
    soleModalOpen.value = false;
    soleModalError.value = null;
  }

  async function submitSoleModal() {
    if (!soleForm.value.id_exploitation) {
      soleModalError.value = 'Veuillez choisir une exploitation.';
      return;
    }
    soleModalLoading.value = true;
    soleModalError.value = null;
    try {
      if (soleModalMode.value === 'create') {
        const resp = await soilBoardsApi.createSole({
          sole_name: soleForm.value.sole_name.trim(),
          id_exploitation: soleForm.value.id_exploitation,
        });
        soles.value.push(resp.data);
      } else if (soleModalId.value !== null) {
        await soilBoardsApi.updateSole({
          id_sole: soleModalId.value,
          sole_name: soleForm.value.sole_name.trim(),
          id_exploitation: soleForm.value.id_exploitation,
        });
        const idx = soles.value.findIndex((s) => s.id_sole === soleModalId.value);
        if (idx !== -1) {
          soles.value[idx].sole_name = soleForm.value.sole_name.trim();
        }
      }
      syncPlanningStore();
      closeSoleModal();
    } catch (e: any) {
      soleModalError.value = e?.response?.data?.message ?? 'Une erreur est survenue.';
    } finally {
      soleModalLoading.value = false;
    }
  }

  async function deleteSole(id: number) {
    try {
      await soilBoardsApi.deleteSole(id);
      soles.value = soles.value.filter((s) => s.id_sole !== id);
      if (selectedSoleId.value === id) selectedSoleId.value = null;
      syncPlanningStore();
    } catch {
      error.value = 'Impossible de supprimer cette sole.';
    }
  }

  // ── Board CRUD ─────────────────────────────────────────────────────────────

  function openCreateBoard() {
    boardModalMode.value = 'create';
    boardModalId.value = null;
    boardForm.value = emptyBoardForm(selectedSoleId.value);
    boardModalError.value = null;
    boardModalOpen.value = true;
  }

  function openEditBoard(b: ApiBoard) {
    boardModalMode.value = 'edit';
    boardModalId.value = b.id_board;
    boardForm.value = {
      board_name: b.board_name,
      board_width: b.board_width,
      board_length: b.board_length,
      board_active: b.board_active,
      id_sole: b.id_sole,
    };
    boardModalError.value = null;
    boardModalOpen.value = true;
  }

  function closeBoardModal() {
    boardModalOpen.value = false;
    boardModalError.value = null;
  }

  async function submitBoardModal() {
    if (!boardForm.value.id_sole) {
      boardModalError.value = 'Aucune sole sélectionnée.';
      return;
    }
    boardModalLoading.value = true;
    boardModalError.value = null;
    try {
      const payload = {
        board_name: boardForm.value.board_name.trim(),
        board_width: Number(boardForm.value.board_width),
        board_lenght: Number(boardForm.value.board_length), // backend typo
        board_active: boardForm.value.board_active,
        id_sole: boardForm.value.id_sole,
      };

      if (boardModalMode.value === 'create') {
        const resp = await soilBoardsApi.createBoard(payload);
        const sole = soles.value.find((s) => s.id_sole === boardForm.value.id_sole);
        if (sole) {
          if (!sole.boards) sole.boards = [];
          sole.boards.push(resp.data);
        }
      } else if (boardModalId.value !== null) {
        const resp = await soilBoardsApi.updateBoard({ id_board: boardModalId.value, ...payload });
        const sole = soles.value.find((s) => s.id_sole === boardForm.value.id_sole);
        if (sole?.boards) {
          const idx = sole.boards.findIndex((b) => b.id_board === boardModalId.value);
          if (idx !== -1) Object.assign(sole.boards[idx], resp.data);
        }
      }
      syncPlanningStore();
      closeBoardModal();
    } catch (e: any) {
      boardModalError.value = e?.response?.data?.message ?? 'Une erreur est survenue.';
    } finally {
      boardModalLoading.value = false;
    }
  }

  async function deleteBoard(soleId: number, boardId: number) {
    try {
      await soilBoardsApi.deleteBoard(boardId);
      const sole = soles.value.find((s) => s.id_sole === soleId);
      if (sole?.boards) sole.boards = sole.boards.filter((b) => b.id_board !== boardId);
    } catch {
      error.value = 'Impossible de supprimer cette planche.';
    }
  }

  async function batchCreateBoards(
    soleId: number,
    prefix: string,
    count: number,
    width: number,
    length: number,
    sectionsPerBoard: number,
  ): Promise<void> {
    const sole = soles.value.find((s) => s.id_sole === soleId);
    if (!sole) return;
    if (!sole.boards) sole.boards = [];

    for (let i = 1; i <= count; i++) {
      const boardName = `${prefix}${i}`;
      const resp = await soilBoardsApi.createBoard({
        board_name: boardName,
        board_width: width,
        board_lenght: length,
        board_active: true,
        id_sole: soleId,
      });
      sole.boards.push(resp.data);
      if (sectionsPerBoard >= 1) {
        await rotationsApi.createOrGetSectionPlan(resp.data.id_board, sectionsPerBoard);
      }
    }
    syncPlanningStore();
  }

  const sectionsLoading = ref<Record<number, boolean>>({});
  const sectionsError = ref<Record<number, string | null>>({});

  async function setSections(boardId: number, n: number): Promise<void> {
    if (n < 1 || n > 20) return;
    sectionsLoading.value = { ...sectionsLoading.value, [boardId]: true };
    sectionsError.value = { ...sectionsError.value, [boardId]: null };
    try {
      const res = await rotationsApi.createOrGetSectionPlan(boardId, n);
      // Synchroniser le cache du planning store pour que la grille reflète immédiatement le bon nombre
      const actualCount = res.data.sectionPlan.number_of_section;
      const planningStore = usePlanningStore();
      planningStore.sectionPlanCache = new Map(planningStore.sectionPlanCache).set(boardId, actualCount);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Impossible de modifier les sections.';
      sectionsError.value = { ...sectionsError.value, [boardId]: String(msg) };
      throw e;
    } finally {
      sectionsLoading.value = { ...sectionsLoading.value, [boardId]: false };
    }
  }

  return {
    exploitations,
    soles,
    loading,
    loaded,
    error,
    exploitationCoords,
    selectedExploitationId,
    selectedSoleId,
    selectedExploitation,
    solesForSelected,
    selectedSole,
    boardsForSelected,
    stats,
    expModalOpen, expModalMode, expForm, expModalError, expModalLoading,
    soleModalOpen, soleModalMode, soleForm, soleModalError, soleModalLoading,
    boardModalOpen, boardModalMode, boardForm, boardModalError, boardModalLoading,
    loadAll,
    selectExploitation,
    selectSole,
    openCreateExploitation, openEditExploitation, closeExpModal, submitExpModal,
    openCreateSole, openEditSole, closeSoleModal, submitSoleModal, deleteSole,
    openCreateBoard, openEditBoard, closeBoardModal, submitBoardModal, deleteBoard,
    batchCreateBoards,
    sectionsLoading, sectionsError, setSections,
  };
});
