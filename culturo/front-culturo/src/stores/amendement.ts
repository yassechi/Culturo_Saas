import { ref } from 'vue';
import { defineStore } from 'pinia';
import { amendementsApi } from '@/api/amendements';

export interface CatalogueItem {
  id_amendement: number;
  amendment_name: string;
  notice: string | null;
}

export interface AmendementRecord {
  id_amended: number;
  amendment_date: string;
  quantity: number | null;
  quantity_unit: string | null;
  description: string | null;
  amendement: CatalogueItem | null;
  board: {
    id_board: number;
    board_name: string;
    sole?: {
      sole_name: string;
      exploitation?: { exploitation_name: string };
    };
  } | null;
}

export const useAmendementStore = defineStore('amendement', () => {
  // Catalogue
  const catalogue = ref<CatalogueItem[]>([]);
  const catalogueLoading = ref(false);
  const catalogueLoaded = ref(false);

  // Historique
  const amendements = ref<AmendementRecord[]>([]);
  const listLoading = ref(false);
  const listError = ref<string | null>(null);
  const listLoaded = ref(false);

  // Soumission
  const submitting = ref(false);
  const submitError = ref<string | null>(null);

  async function loadCatalogue() {
    if (catalogueLoaded.value) return;
    catalogueLoading.value = true;
    try {
      const res = await amendementsApi.findAllCatalogue();
      catalogue.value = res.data as CatalogueItem[];
      catalogueLoaded.value = true;
    } finally {
      catalogueLoading.value = false;
    }
  }

  async function loadAll() {
    if (listLoaded.value && !listError.value) return;
    listLoading.value = true;
    listError.value = null;
    try {
      const res = await amendementsApi.findAll();
      amendements.value = res.data as AmendementRecord[];
      listLoaded.value = true;
    } catch {
      listError.value = 'Impossible de charger l\'historique des fertilisations.';
    } finally {
      listLoading.value = false;
    }
  }

  async function applyToBoard(payload: {
    date: string;
    catalogueId: number;
    boardId: number;
    quantity?: number;
    unit?: string;
    description?: string;
  }) {
    submitting.value = true;
    submitError.value = null;
    try {
      await amendementsApi.create({
        amendment_date: payload.date,
        id_amendement: payload.catalogueId,
        id_board: payload.boardId,
        quantity: payload.quantity,
        quantity_unit: payload.unit,
        description: payload.description,
      });
      listLoaded.value = false;
    } catch {
      submitError.value = 'Erreur lors de l\'enregistrement de la fertilisation.';
      throw new Error(submitError.value);
    } finally {
      submitting.value = false;
    }
  }

  async function applyToSole(payload: {
    date: string;
    catalogueId: number;
    soleId: number;
    quantity?: number;
    unit?: string;
    description?: string;
  }) {
    submitting.value = true;
    submitError.value = null;
    try {
      await amendementsApi.createBulk({
        amendment_date: payload.date,
        id_amendement: payload.catalogueId,
        id_sole: payload.soleId,
        quantity: payload.quantity,
        quantity_unit: payload.unit,
        description: payload.description,
      });
      listLoaded.value = false;
    } catch {
      submitError.value = 'Erreur lors de la fertilisation en masse.';
      throw new Error(submitError.value);
    } finally {
      submitting.value = false;
    }
  }

  async function deleteAmendement(id: number) {
    await amendementsApi.remove(id);
    amendements.value = amendements.value.filter((a) => a.id_amended !== id);
    listLoaded.value = false;
  }

  async function createCatalogueItem(name: string, notice?: string) {
    const res = await amendementsApi.createCatalogue({ amendment_name: name, notice });
    catalogue.value.push(res.data as CatalogueItem);
    catalogue.value.sort((a, b) => a.amendment_name.localeCompare(b.amendment_name));
  }

  async function updateCatalogueItem(id: number, name: string, notice?: string) {
    const res = await amendementsApi.updateCatalogue(id, { amendment_name: name, notice });
    const idx = catalogue.value.findIndex((c) => c.id_amendement === id);
    if (idx !== -1) catalogue.value[idx] = res.data as CatalogueItem;
  }

  async function deleteCatalogueItem(id: number) {
    await amendementsApi.removeCatalogue(id);
    catalogue.value = catalogue.value.filter((c) => c.id_amendement !== id);
  }

  return {
    catalogue, catalogueLoading,
    amendements, listLoading, listError,
    submitting, submitError,
    loadCatalogue, loadAll,
    applyToBoard, applyToSole,
    deleteAmendement,
    createCatalogueItem, updateCatalogueItem, deleteCatalogueItem,
  };
});
