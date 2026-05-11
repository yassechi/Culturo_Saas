import { ref } from 'vue';
import { defineStore } from 'pinia';
import { harvestsApi } from '@/api/harvests';

export interface HarvestRecord {
  id_harvest: number;
  harvest_date: string;
  quantity: number;
  quantity_unit: string;
  user_: { id_user: number; email: string };
  section: {
    id_section: number;
    section_number: number;
    vegetable?: { vegetable_name: string };
    variety?: { variety_name: string } | null;
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

export const useHarvestStore = defineStore('harvest', () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const harvests = ref<HarvestRecord[]>([]);
  const listLoading = ref(false);
  const listError = ref<string | null>(null);

  async function loadHarvests() {
    listLoading.value = true;
    listError.value = null;
    try {
      const res = await harvestsApi.findAll();
      harvests.value = res.data as HarvestRecord[];
    } catch (err: unknown) {
      listError.value = 'Impossible de charger l\'historique des récoltes.';
    } finally {
      listLoading.value = false;
    }
  }

  async function deleteHarvest(id: number) {
    await harvestsApi.remove(id);
    harvests.value = harvests.value.filter((h) => h.id_harvest !== id);
  }

  async function createHarvest(payload: {
    sectionId: number;
    harvestDate: string;
    quantity: number;
    unit: string;
    userId: number;
  }) {
    loading.value = true;
    error.value = null;
    try {
      await harvestsApi.create({
        id_section: payload.sectionId,
        harvest_date: payload.harvestDate,
        quantity: payload.quantity,
        quantity_unit: payload.unit,
        userId: payload.userId,
      });
    } catch (err: unknown) {
      error.value =
        err instanceof Error ? err.message : 'Erreur lors de la déclaration de la récolte.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, harvests, listLoading, listError, loadHarvests, deleteHarvest, createHarvest };
});
