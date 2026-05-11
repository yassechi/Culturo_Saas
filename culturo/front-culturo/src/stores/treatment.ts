import { ref } from 'vue';
import { defineStore } from 'pinia';
import { treatmentsApi } from '@/api/treatments';

export interface TreatmentCatalogueItem {
  id_treatment: number;
  treatment_name: string;
  notice: string | null;
}

export interface TreatedRecord {
  id_treated: number;
  treatment_date: string;
  treatment_quantity: number | null;
  treatment_unit: string | null;
  description: string | null;
  treatment: TreatmentCatalogueItem | null;
  board: {
    id_board: number;
    board_name: string;
    sole?: {
      sole_name: string;
      exploitation?: { exploitation_name: string };
    };
  } | null;
}

export const useTreatmentStore = defineStore('treatment', () => {
  const catalogue = ref<TreatmentCatalogueItem[]>([]);
  const catalogueLoading = ref(false);

  const treatments = ref<TreatedRecord[]>([]);
  const listLoading = ref(false);
  const listError = ref<string | null>(null);

  const submitting = ref(false);
  const submitError = ref<string | null>(null);

  async function loadCatalogue() {
    catalogueLoading.value = true;
    try {
      const res = await treatmentsApi.findAllCatalogue();
      catalogue.value = res.data as TreatmentCatalogueItem[];
    } finally {
      catalogueLoading.value = false;
    }
  }

  async function loadAll() {
    listLoading.value = true;
    listError.value = null;
    try {
      const res = await treatmentsApi.findAll();
      treatments.value = res.data as TreatedRecord[];
    } catch {
      listError.value = 'Impossible de charger l\'historique des traitements.';
    } finally {
      listLoading.value = false;
    }
  }

  async function applyToBoard(payload: {
    date: string; catalogueId: number; boardId: number;
    quantity?: number; unit?: string; description?: string;
  }) {
    submitting.value = true;
    submitError.value = null;
    try {
      await treatmentsApi.create({
        treatment_date: payload.date,
        id_treatment: payload.catalogueId,
        id_board: payload.boardId,
        treatment_quantity: payload.quantity,
        treatment_unit: payload.unit,
        description: payload.description,
      });
    } catch {
      submitError.value = 'Erreur lors de l\'enregistrement du traitement.';
      throw new Error(submitError.value);
    } finally {
      submitting.value = false;
    }
  }

  async function applyToSole(payload: {
    date: string; catalogueId: number; soleId: number;
    quantity?: number; unit?: string; description?: string;
  }) {
    submitting.value = true;
    submitError.value = null;
    try {
      await treatmentsApi.createBulk({
        treatment_date: payload.date,
        id_treatment: payload.catalogueId,
        id_sole: payload.soleId,
        treatment_quantity: payload.quantity,
        treatment_unit: payload.unit,
        description: payload.description,
      });
    } catch {
      submitError.value = 'Erreur lors du traitement en masse.';
      throw new Error(submitError.value);
    } finally {
      submitting.value = false;
    }
  }

  async function deleteTreatment(id: number) {
    await treatmentsApi.remove(id);
    treatments.value = treatments.value.filter((t) => t.id_treated !== id);
  }

  async function createCatalogueItem(name: string, notice?: string) {
    const res = await treatmentsApi.createCatalogue({ treatment_name: name, notice });
    catalogue.value.push(res.data as TreatmentCatalogueItem);
    catalogue.value.sort((a, b) => a.treatment_name.localeCompare(b.treatment_name));
  }

  async function updateCatalogueItem(id: number, name: string, notice?: string) {
    const res = await treatmentsApi.updateCatalogue(id, { treatment_name: name, notice });
    const idx = catalogue.value.findIndex((c) => c.id_treatment === id);
    if (idx !== -1) catalogue.value[idx] = res.data as TreatmentCatalogueItem;
  }

  async function deleteCatalogueItem(id: number) {
    await treatmentsApi.removeCatalogue(id);
    catalogue.value = catalogue.value.filter((c) => c.id_treatment !== id);
  }

  return {
    catalogue, catalogueLoading,
    treatments, listLoading, listError,
    submitting, submitError,
    loadCatalogue, loadAll,
    applyToBoard, applyToSole,
    deleteTreatment,
    createCatalogueItem, updateCatalogueItem, deleteCatalogueItem,
  };
});
