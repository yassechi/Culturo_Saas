import { ref } from 'vue';
import { defineStore } from 'pinia';
import { wateringsApi } from '@/api/waterings';

export interface WateringRecord {
  id_watering: number;
  watering_date: string;
  section: {
    id_section: number;
    section_number: number;
    vegetable?: { vegetable_name: string };
    sectionPlan?: {
      board?: {
        board_name: string;
        sole?: {
          sole_name: string;
          exploitation?: { exploitation_name: string };
        };
      };
    };
  };
}

export const useWateringStore = defineStore('watering', () => {
  // Historique global
  const waterings = ref<WateringRecord[]>([]);
  const listLoading = ref(false);
  const listError = ref<string | null>(null);
  const listLoaded = ref(false);

  // Arrosages de la section courante (panneau)
  const sectionWaterings = ref<WateringRecord[]>([]);
  const sectionLoading = ref(false);

  // État de soumission
  const submitting = ref(false);
  const submitError = ref<string | null>(null);

  async function loadAll() {
    if (listLoaded.value && !listError.value) return;
    listLoading.value = true;
    listError.value = null;
    try {
      const res = await wateringsApi.findAll();
      waterings.value = res.data as WateringRecord[];
      listLoaded.value = true;
    } catch {
      listError.value = 'Impossible de charger l\'historique des arrosages.';
    } finally {
      listLoading.value = false;
    }
  }

  async function loadBySection(sectionId: number) {
    sectionLoading.value = true;
    sectionWaterings.value = [];
    try {
      const res = await wateringsApi.findBySection(sectionId);
      sectionWaterings.value = res.data as WateringRecord[];
    } finally {
      sectionLoading.value = false;
    }
  }

  async function waterSection(sectionId: number, datetime: string) {
    submitting.value = true;
    submitError.value = null;
    try {
      await wateringsApi.create({ id_section: sectionId, watering_date: datetime });
      listLoaded.value = false;
      void loadAll();
      await loadBySection(sectionId);
    } catch {
      submitError.value = 'Erreur lors de l\'enregistrement de l\'arrosage.';
      throw new Error(submitError.value);
    } finally {
      submitting.value = false;
    }
  }

  async function waterBulk(payload: { datetime: string; boardId?: number; soleId?: number }) {
    submitting.value = true;
    submitError.value = null;
    try {
      await wateringsApi.createBulk({
        watering_date: payload.datetime,
        board_id: payload.boardId,
        sole_id: payload.soleId,
      });
      listLoaded.value = false;
      void loadAll();
    } catch {
      submitError.value = 'Erreur lors de l\'arrosage en masse.';
      throw new Error(submitError.value);
    } finally {
      submitting.value = false;
    }
  }

  async function deleteWatering(id: number) {
    await wateringsApi.remove(id);
    waterings.value = waterings.value.filter((w) => w.id_watering !== id);
    sectionWaterings.value = sectionWaterings.value.filter((w) => w.id_watering !== id);
    listLoaded.value = false;
  }

  return {
    waterings, listLoading, listError,
    sectionWaterings, sectionLoading,
    submitting, submitError,
    loadAll, loadBySection, waterSection, waterBulk, deleteWatering,
  };
});
