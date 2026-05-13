import { ref } from 'vue';
import { defineStore } from 'pinia';
import { rotationsApi, type HarvestDueEntry } from '@/api/rotations';

export const useHarvestDueStore = defineStore('harvestDue', () => {
  const items = ref<HarvestDueEntry[]>([]);
  const loading = ref(false);

  async function load(days = 7) {
    loading.value = true;
    try {
      const res = await rotationsApi.getHarvestDue(days);
      items.value = res.data;
    } catch {
      // silently ignore
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, load };
});
