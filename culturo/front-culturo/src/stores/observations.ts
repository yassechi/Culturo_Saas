import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { observationsApi, type ObservationQuery } from '@/api/observations';
import type {
  CreateObservationPayload,
  ObservationContributor,
  ObservationRecord,
  ObservationReviewStatus,
  ObservationSectionSummary,
  ReviewObservationPayload,
} from '@/types/observations';

function formatContributorName(observation: ObservationRecord): string {
  const firstName = observation.author.user_first_name?.trim();
  const lastName = observation.author.user_last_name?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || observation.author.email;
}

export const useObservationsStore = defineStore('observations', () => {
  const activeSections = ref<ObservationSectionSummary[]>([]);
  const myObservations = ref<ObservationRecord[]>([]);
  const trainerObservations = ref<ObservationRecord[]>([]);

  const loadingSections = ref(false);
  const loadingMine = ref(false);
  const loadingTrainer = ref(false);
  const submitting = ref(false);
  const reviewingIds = ref<number[]>([]);

  const error = ref<string | null>(null);
  const feedback = ref<string | null>(null);

  const myStats = computed(() => ({
    total: myObservations.value.length,
    pending: myObservations.value.filter((item) => item.review_status === 'pending')
      .length,
    approved: myObservations.value.filter((item) => item.review_status === 'approved')
      .length,
    changesRequested: myObservations.value.filter(
      (item) => item.review_status === 'changes_requested',
    ).length,
  }));

  const pendingObservations = computed(() =>
    trainerObservations.value.filter((item) => item.review_status === 'pending'),
  );

  const reviewedObservations = computed(() =>
    trainerObservations.value.filter((item) => item.review_status !== 'pending'),
  );

  const trainerSummary = computed(() => ({
    total: trainerObservations.value.length,
    pending: pendingObservations.value.length,
    approved: trainerObservations.value.filter(
      (item) => item.review_status === 'approved',
    ).length,
    changesRequested: trainerObservations.value.filter(
      (item) => item.review_status === 'changes_requested',
    ).length,
    observedBoards: new Set(
      trainerObservations.value.map((item) => item.section.sectionPlan?.board?.id_board),
    ).size,
  }));

  const contributors = computed<ObservationContributor[]>(() => {
    const contributorMap = new Map<number, ObservationContributor>();

    trainerObservations.value.forEach((observation) => {
      const userId = observation.author.id_user;
      const existing = contributorMap.get(userId);

      if (existing) {
        existing.submittedCount += 1;
        if (observation.review_status === 'pending') {
          existing.pendingCount += 1;
        }
        return;
      }

      contributorMap.set(userId, {
        userId,
        displayName: formatContributorName(observation),
        submittedCount: 1,
        pendingCount: observation.review_status === 'pending' ? 1 : 0,
      });
    });

    return [...contributorMap.values()].sort((left, right) => {
      if (right.pendingCount !== left.pendingCount) {
        return right.pendingCount - left.pendingCount;
      }

      return right.submittedCount - left.submittedCount;
    });
  });

  const latestTrainerObservations = computed(() =>
    [...trainerObservations.value].slice(0, 6),
  );

  function clearMessages() {
    error.value = null;
    feedback.value = null;
  }

  async function loadActiveSections() {
    loadingSections.value = true;
    error.value = null;

    try {
      const response = await observationsApi.getActiveSections();
      activeSections.value = response.data;
    } catch {
      error.value = 'Impossible de charger les sections actives.';
    } finally {
      loadingSections.value = false;
    }
  }

  async function loadMyObservations() {
    loadingMine.value = true;
    error.value = null;

    try {
      const response = await observationsApi.getObservations({ mine: true });
      myObservations.value = response.data;
    } catch {
      error.value = 'Impossible de charger vos observations.';
    } finally {
      loadingMine.value = false;
    }
  }

  async function loadTrainerObservations(query: ObservationQuery = {}) {
    loadingTrainer.value = true;
    error.value = null;

    try {
      const response = await observationsApi.getObservations(query);
      trainerObservations.value = response.data;
    } catch {
      error.value = 'Impossible de charger les observations terrain.';
    } finally {
      loadingTrainer.value = false;
    }
  }

  async function createObservation(payload: CreateObservationPayload) {
    submitting.value = true;
    clearMessages();

    try {
      const response = await observationsApi.createObservation(payload);
      myObservations.value = [response.data, ...myObservations.value];
      feedback.value = 'Observation enregistrée et envoyée au formateur.';
      return response.data;
    } catch (apiError: any) {
      error.value =
        apiError?.response?.data?.message ??
        'Impossible d’enregistrer cette observation.';
      throw apiError;
    } finally {
      submitting.value = false;
    }
  }

  function isReviewing(id: number) {
    return reviewingIds.value.includes(id);
  }

  async function reviewObservation(
    id: number,
    payload: ReviewObservationPayload,
  ) {
    reviewingIds.value = [...reviewingIds.value, id];
    clearMessages();

    try {
      const response = await observationsApi.reviewObservation(id, payload);
      trainerObservations.value = trainerObservations.value.map((item) =>
        item.id_observation === id ? response.data : item,
      );
      feedback.value = 'Observation relue avec succès.';
      return response.data;
    } catch (apiError: any) {
      error.value =
        apiError?.response?.data?.message ??
        'Impossible de relire cette observation.';
      throw apiError;
    } finally {
      reviewingIds.value = reviewingIds.value.filter((value) => value !== id);
    }
  }

  function getObservationsByStatus(status: ObservationReviewStatus) {
    return trainerObservations.value.filter((item) => item.review_status === status);
  }

  return {
    activeSections,
    myObservations,
    trainerObservations,
    loadingSections,
    loadingMine,
    loadingTrainer,
    submitting,
    error,
    feedback,
    myStats,
    pendingObservations,
    reviewedObservations,
    trainerSummary,
    contributors,
    latestTrainerObservations,
    clearMessages,
    loadActiveSections,
    loadMyObservations,
    loadTrainerObservations,
    createObservation,
    reviewObservation,
    isReviewing,
    getObservationsByStatus,
  };
});
