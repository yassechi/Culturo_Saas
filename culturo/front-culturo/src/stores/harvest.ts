import { ref } from 'vue';
import { defineStore } from 'pinia';
import { isAxiosError } from 'axios';
import { harvestsApi } from '@/api/harvests';
import { usePlanningStore } from '@/stores/planning';
import { useHarvestDueStore } from '@/stores/harvestDue';
import { useNotificationsStore } from '@/stores/notifications';

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
  const listLoaded = ref(false);

  async function loadHarvests() {
    if (listLoaded.value && !listError.value) return;
    listLoading.value = true;
    listError.value = null;
    try {
      const res = await harvestsApi.findAll();
      harvests.value = res.data as HarvestRecord[];
      listLoaded.value = true;
    } catch (err: unknown) {
      listError.value = 'Impossible de charger l\'historique des récoltes.';
    } finally {
      listLoading.value = false;
    }
  }

  async function deleteHarvest(id: number) {
    await harvestsApi.remove(id);
    harvests.value = harvests.value.filter((h) => h.id_harvest !== id);
    listLoaded.value = false;
    void usePlanningStore().loadCulturePlan();
    void useHarvestDueStore().load();
    void useNotificationsStore().fetch();
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
      listLoaded.value = false;
      void usePlanningStore().loadCulturePlan();
      void loadHarvests();
      void useHarvestDueStore().load();
      void useNotificationsStore().fetch();
    } catch (err: unknown) {
      const axiosMsg = isAxiosError(err) ? (err.response?.data?.message as string | undefined) : undefined;
      error.value = axiosMsg
        ? String(axiosMsg)
        : err instanceof Error
          ? err.message
          : 'Erreur lors de la déclaration de la récolte.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, harvests, listLoading, listError, loadHarvests, deleteHarvest, createHarvest };
});
