// culturo/front-culturo/src/stores/botanical.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import {
  botanicalApi,
  type ApiFamily,
  type ApiVegetable,
  type ApiVariety,
  type ApiImportance,
} from '@/api/botanical';

// ── Family modal form ──────────────────────────────────────────────────────────

export interface FamilyForm {
  family_name: string;
  id_family_importance: number | null;
}

function emptyFamilyForm(): FamilyForm {
  return { family_name: '', id_family_importance: null };
}

// ── Vegetable modal form ───────────────────────────────────────────────────────

export interface VegetableForm {
  vegetable_name: string;
  planting_season: string;
  harvest_season: string;
  harvest_duration_min: number;
  harvest_duration_max: number;
  inrow_distance: number;
  in_row_spacing: number;
  estimated_yield: number;
  id_family: number | null;
}

function emptyVegetableForm(): VegetableForm {
  return {
    vegetable_name: '',
    planting_season: '',
    harvest_season: '',
    harvest_duration_min: 30,
    harvest_duration_max: 90,
    inrow_distance: 10,
    in_row_spacing: 30,
    estimated_yield: 50,
    id_family: null,
  };
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useBotanicalStore = defineStore('botanical', () => {
  // State
  const families = ref<ApiFamily[]>([]);
  const vegetables = ref<ApiVegetable[]>([]);
  const importances = ref<ApiImportance[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Search / filter
  const vegSearch = ref('');
  const vegFamilyFilter = ref<number | null>(null);

  // Family modal
  const familyModalOpen = ref(false);
  const familyModalMode = ref<'create' | 'edit'>('create');
  const familyModalId = ref<number | null>(null);
  const familyForm = ref<FamilyForm>(emptyFamilyForm());
  const familyModalError = ref<string | null>(null);
  const familyModalLoading = ref(false);

  // Vegetable modal
  const vegModalOpen = ref(false);
  const vegModalMode = ref<'create' | 'edit'>('create');
  const vegModalId = ref<number | null>(null);
  const vegForm = ref<VegetableForm>(emptyVegetableForm());
  const vegModalError = ref<string | null>(null);
  const vegModalLoading = ref(false);

  // Variety panel (inline per vegetable)
  const expandedVegetableId = ref<number | null>(null);
  const varietiesMap = ref<Record<number, ApiVariety[]>>({});
  const varietiesLoading = ref<Record<number, boolean>>({});
  const newVarietyName = ref<Record<number, string>>({});
  const varietyError = ref<string | null>(null);

  // ── Getters ────────────────────────────────────────────────────────────────

  const filteredVegetables = computed(() => {
    const q = vegSearch.value.trim().toLowerCase();
    return vegetables.value.filter((v) => {
      if (vegFamilyFilter.value && v.family?.id_family !== vegFamilyFilter.value) return false;
      if (q && !v.vegetable_name.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  const stats = computed(() => ({
    families: families.value.length,
    vegetables: vegetables.value.length,
    varieties: vegetables.value.reduce((sum, v) => sum + (v.varieties?.length ?? 0), 0),
  }));

  // ── Actions ────────────────────────────────────────────────────────────────

  async function loadAll() {
    loading.value = true;
    error.value = null;
    try {
      const [fam, veg, imp] = await Promise.all([
        botanicalApi.getAllFamilies(),
        botanicalApi.getAllVegetables(),
        botanicalApi.getAllImportances(),
      ]);
      families.value = fam.data;
      vegetables.value = veg.data;
      importances.value = imp.data;
    } catch {
      error.value = 'Impossible de charger le référentiel botanique.';
    } finally {
      loading.value = false;
    }
  }

  // ── Family CRUD ────────────────────────────────────────────────────────────

  function openCreateFamily() {
    familyModalMode.value = 'create';
    familyModalId.value = null;
    familyForm.value = emptyFamilyForm();
    familyModalError.value = null;
    familyModalOpen.value = true;
  }

  function openEditFamily(f: ApiFamily) {
    familyModalMode.value = 'edit';
    familyModalId.value = f.id_family;
    familyForm.value = {
      family_name: f.family_name,
      id_family_importance: f.family_importance?.id_family_importance ?? null,
    };
    familyModalError.value = null;
    familyModalOpen.value = true;
  }

  function closeFamilyModal() {
    familyModalOpen.value = false;
    familyModalError.value = null;
  }

  async function submitFamilyModal() {
    if (!familyForm.value.id_family_importance) {
      familyModalError.value = 'Veuillez choisir une importance.';
      return;
    }
    familyModalLoading.value = true;
    familyModalError.value = null;
    try {
      if (familyModalMode.value === 'create') {
        const resp = await botanicalApi.createFamily({
          family_name: familyForm.value.family_name.trim(),
          id_family_importance: familyForm.value.id_family_importance,
        });
        families.value.push(resp.data);
      } else if (familyModalId.value !== null) {
        await botanicalApi.updateFamily({
          id_family: familyModalId.value,
          family_name: familyForm.value.family_name.trim(),
          id_family_importance: familyForm.value.id_family_importance,
        });
        const idx = families.value.findIndex((f) => f.id_family === familyModalId.value);
        if (idx !== -1) {
          const imp = importances.value.find(
            (i) => i.id_family_importance === familyForm.value.id_family_importance,
          );
          families.value[idx].family_name = familyForm.value.family_name.trim();
          if (imp) families.value[idx].family_importance = imp;
        }
      }
      closeFamilyModal();
    } catch (e: any) {
      familyModalError.value = e?.response?.data?.message ?? 'Une erreur est survenue.';
    } finally {
      familyModalLoading.value = false;
    }
  }

  async function deleteFamily(id: number) {
    try {
      await botanicalApi.deleteFamily(id);
      families.value = families.value.filter((f) => f.id_family !== id);
    } catch {
      error.value = 'Impossible de supprimer cette famille.';
    }
  }

  // ── Vegetable CRUD ─────────────────────────────────────────────────────────

  function openCreateVegetable() {
    vegModalMode.value = 'create';
    vegModalId.value = null;
    vegForm.value = emptyVegetableForm();
    vegModalError.value = null;
    vegModalOpen.value = true;
  }

  function openEditVegetable(v: ApiVegetable) {
    vegModalMode.value = 'edit';
    vegModalId.value = v.id_vegetable;
    vegForm.value = {
      vegetable_name: v.vegetable_name,
      planting_season: v.planting_season,
      harvest_season: v.harvest_season,
      harvest_duration_min: v.harvest_duration_min,
      harvest_duration_max: v.harvest_duration_max,
      inrow_distance: v.inrow_distance,
      in_row_spacing: v.in_row_spacing,
      estimated_yield: v.estimated_yield,
      id_family: v.family?.id_family ?? null,
    };
    vegModalError.value = null;
    vegModalOpen.value = true;
  }

  function closeVegModal() {
    vegModalOpen.value = false;
    vegModalError.value = null;
  }

  async function submitVegModal() {
    if (!vegForm.value.id_family) {
      vegModalError.value = 'Veuillez choisir une famille.';
      return;
    }
    vegModalLoading.value = true;
    vegModalError.value = null;
    try {
      const payload = {
        vegetable_name: vegForm.value.vegetable_name.trim(),
        planting_season: vegForm.value.planting_season.trim(),
        harvest_season: vegForm.value.harvest_season.trim(),
        harvest_duration_min: Number(vegForm.value.harvest_duration_min),
        harvest_duration_max: Number(vegForm.value.harvest_duration_max),
        inrow_distance: Number(vegForm.value.inrow_distance),
        in_row_spacing: Number(vegForm.value.in_row_spacing),
        estimated_yield: Number(vegForm.value.estimated_yield),
        id_family: vegForm.value.id_family,
      };
      if (vegModalMode.value === 'create') {
        const resp = await botanicalApi.createVegetable(payload);
        vegetables.value.push(resp.data!);
      } else if (vegModalId.value !== null) {
        await botanicalApi.updateVegetable({ id_vegetable: vegModalId.value, ...payload });
        const idx = vegetables.value.findIndex((v) => v.id_vegetable === vegModalId.value);
        if (idx !== -1) {
          const fam = families.value.find((f) => f.id_family === vegForm.value.id_family);
          Object.assign(vegetables.value[idx], payload);
          if (fam) vegetables.value[idx].family = fam;
        }
      }
      closeVegModal();
    } catch (e: any) {
      vegModalError.value = e?.response?.data?.message ?? 'Une erreur est survenue.';
    } finally {
      vegModalLoading.value = false;
    }
  }

  async function deleteVegetable(id: number) {
    try {
      await botanicalApi.deleteVegetable(id);
      vegetables.value = vegetables.value.filter((v) => v.id_vegetable !== id);
    } catch {
      error.value = 'Impossible de supprimer ce légume.';
    }
  }

  // ── Variety management ─────────────────────────────────────────────────────

  async function toggleVarieties(vegetableId: number) {
    if (expandedVegetableId.value === vegetableId) {
      expandedVegetableId.value = null;
      return;
    }
    expandedVegetableId.value = vegetableId;
    if (!varietiesMap.value[vegetableId]) {
      await loadVarieties(vegetableId);
    }
  }

  async function loadVarieties(vegetableId: number) {
    varietiesLoading.value[vegetableId] = true;
    try {
      const resp = await botanicalApi.getVarietiesByVegetable(vegetableId);
      varietiesMap.value[vegetableId] = resp.data;
    } catch {
      varietyError.value = 'Impossible de charger les variétés.';
    } finally {
      varietiesLoading.value[vegetableId] = false;
    }
  }

  async function addVariety(vegetableId: number) {
    const name = (newVarietyName.value[vegetableId] ?? '').trim();
    if (!name) return;
    try {
      const resp = await botanicalApi.createVariety({ variety_name: name, id_vegetable: vegetableId });
      if (!varietiesMap.value[vegetableId]) varietiesMap.value[vegetableId] = [];
      varietiesMap.value[vegetableId].push(resp.data);
      newVarietyName.value[vegetableId] = '';
      // keep varieties count in sync on parent vegetable
      const veg = vegetables.value.find((v) => v.id_vegetable === vegetableId);
      if (veg) veg.varieties = [...(veg.varieties ?? []), resp.data];
    } catch {
      varietyError.value = 'Impossible d\'ajouter la variété.';
    }
  }

  async function deleteVariety(vegetableId: number, varietyId: number) {
    try {
      await botanicalApi.deleteVariety(varietyId);
      if (varietiesMap.value[vegetableId]) {
        varietiesMap.value[vegetableId] = varietiesMap.value[vegetableId].filter(
          (v) => v.id_variety !== varietyId,
        );
      }
      const veg = vegetables.value.find((v) => v.id_vegetable === vegetableId);
      if (veg?.varieties) veg.varieties = veg.varieties.filter((v) => v.id_variety !== varietyId);
    } catch {
      varietyError.value = 'Impossible de supprimer la variété.';
    }
  }

  return {
    families,
    vegetables,
    importances,
    loading,
    error,
    vegSearch,
    vegFamilyFilter,
    filteredVegetables,
    stats,

    familyModalOpen,
    familyModalMode,
    familyForm,
    familyModalError,
    familyModalLoading,

    vegModalOpen,
    vegModalMode,
    vegForm,
    vegModalError,
    vegModalLoading,

    expandedVegetableId,
    varietiesMap,
    varietiesLoading,
    newVarietyName,
    varietyError,

    loadAll,
    openCreateFamily,
    openEditFamily,
    closeFamilyModal,
    submitFamilyModal,
    deleteFamily,
    openCreateVegetable,
    openEditVegetable,
    closeVegModal,
    submitVegModal,
    deleteVegetable,
    toggleVarieties,
    addVariety,
    deleteVariety,
  };
});
