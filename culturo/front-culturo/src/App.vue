<template>
  <component :is="currentLayout">
    <router-view v-slot="{ Component }">
      <!-- Les pages auth (login, reset...) ne sont jamais mises en cache -->
      <keep-alive :max="20" :exclude="['LoginView','ForgotPasswordView','ResetPasswordView']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePlanningStore } from '@/stores/planning';
import { useHarvestStore } from '@/stores/harvest';
import { useWateringStore } from '@/stores/watering';
import { useAmendementStore } from '@/stores/amendement';
import { useTreatmentStore } from '@/stores/treatment';
import { useSoilBoardsStore } from '@/stores/soilBoards';
import { useBotanicalStore } from '@/stores/botanical';
import { useHistoryStore } from '@/stores/history';
import { useDashboardStore } from '@/stores/dashboard';
import AuthLayout from '@/layouts/AuthLayout.vue';
import MainLayout from '@/layouts/MainLayout.vue';

const route = useRoute();
const auth = useAuthStore();

const isAuthLayout = computed(() => route.meta.layout === 'auth');
const currentLayout = computed(() => isAuthLayout.value ? AuthLayout : MainLayout);

function preloadAll() {
  if (!auth.user) return;
  const planning = usePlanningStore();
  const harvest = useHarvestStore();
  const watering = useWateringStore();
  const amendement = useAmendementStore();
  const treatment = useTreatmentStore();
  const soilBoards = useSoilBoardsStore();
  const botanical = useBotanicalStore();
  const history = useHistoryStore();
  const dashboard = useDashboardStore();

  // Tous en parallèle — les guards "loaded" évitent les doublons
  void Promise.allSettled([
    planning.loadSoles(),
    harvest.loadHarvests(),
    watering.loadAll(),
    amendement.loadAll(),
    amendement.loadCatalogue(),
    treatment.loadAll(),
    treatment.loadCatalogue(),
    soilBoards.loadAll(),
    botanical.loadAll(),
    history.loadSoles(),
    dashboard.loadDashboard(),
  ]);
}

// Déclenche le preload dès qu'un utilisateur est connecté
watch(() => auth.user, (user) => { if (user) preloadAll(); }, { immediate: true });

onMounted(preloadAll);
</script>
