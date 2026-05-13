<template>
  <section class="dashboard-view">
    <article class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">Tableau de bord</span>
        <h1>Bienvenue, {{ displayName }}</h1>
        <p>
          Vue synthétique de la planification, des observations terrain et des
          alertes qui demandent une attention rapide.
        </p>
      </div>

      <div class="hero-role">
        <span class="role-label">Rôle</span>
        <strong>{{ auth.user?.role ?? 'inconnu' }}</strong>
        <small>Dernière mise à jour : {{ generatedAtLabel }}</small>
      </div>
    </article>

    <div v-if="dashboard.error" class="error-banner">{{ dashboard.error }}</div>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Taux d’occupation</span>
        <strong>{{ occupancyLabel }}</strong>
        <small>
          {{ dashboard.planning?.occupiedSections ?? 0 }} / {{ dashboard.planning?.totalSections ?? 0 }}
          sections actives
        </small>
      </article>

      <article class="stat-card">
        <span>Observations en attente</span>
        <strong>{{ dashboard.observations?.pending ?? 0 }}</strong>
        <small>{{ pendingLabel }}</small>
      </article>


      <article class="stat-card">
        <span>Saisies 7 jours</span>
        <strong>{{ dashboard.observations?.recentSevenDays ?? 0 }}</strong>
        <small>Activité terrain récente</small>
      </article>

      <article class="stat-card" :class="{ 'stat-card--alert': dashboard.rotationAlertCount > 0 }">
        <span>Violations rotation</span>
        <strong>{{ dashboard.rotationAlertCount }}</strong>
        <small>Règle des 5 ans enfreinte</small>
      </article>
    </section>

    <section class="content-grid">
      <article class="dashboard-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">Actions</span>
            <h2>Actions disponibles</h2>
          </div>
          <span class="section-chip">{{ actionLinks.length }} raccourci(s)</span>
        </div>

        <div class="action-grid">
          <RouterLink
            v-for="action in actionLinks"
            :key="action.to"
            class="action-card"
            :to="action.to"
          >
            <strong>{{ action.label }}</strong>
            <p>{{ action.caption }}</p>
          </RouterLink>
        </div>
      </article>

      <article class="dashboard-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">Rotation</span>
            <h2>Violations de rotation</h2>
          </div>
          <span class="section-chip" :class="{ 'chip--alert': dashboard.rotationAlertCount > 0 }">
            {{ dashboard.rotationAlertCount }} violation(s)
          </span>
        </div>

        <div v-if="dashboard.loading" class="empty-state compact">
          Chargement...
        </div>
        <div v-else-if="dashboard.rotationAlerts.length === 0" class="empty-state compact">
          Aucune violation détectée. Les rotations sont respectées.
        </div>
        <div v-else class="violation-scroll">
          <article
            v-for="alert in dashboard.rotationAlerts"
            :key="`${alert.ruleType}-${alert.boardId}-${alert.familyId}`"
            class="violation-card"
            :class="`rule-${alert.ruleType ?? 'rotation_5y'}`"
          >
            <div class="violation-head">
              <strong>{{ alert.boardName }}</strong>
              <div class="violation-tags">
                <span class="violation-rule-badge" :class="`rule-badge-${alert.ruleType ?? 'rotation_5y'}`">
                  {{ ruleLabel(alert.ruleType) }}
                </span>
                <span v-if="alert.familyName" class="violation-badge">{{ alert.familyName }}</span>
              </div>
            </div>
            <p>{{ alert.exploitationName ?? 'Exploitation' }}<template v-if="alert.soleName"> · {{ alert.soleName }}</template></p>
            <small>{{ alert.description ?? ruleDescription(alert) }}</small>
          </article>
        </div>
      </article>
    </section>

    <!-- Récoltes à faire -->
    <section class="dashboard-card">
      <div class="section-head">
        <div>
          <span class="eyebrow">Récoltes</span>
          <h2>Légumes à récolter (7 prochains jours)</h2>
        </div>
        <span class="section-chip" :class="harvestDue.some(h => h.overdue) ? 'chip-urgent' : ''">
          {{ harvestDue.length }} section(s)
        </span>
      </div>

      <div v-if="harvestDueLoading" class="empty-state compact">Chargement…</div>
      <div v-else-if="harvestDue.length === 0" class="empty-state compact">
        Aucune récolte prévue dans les 7 prochains jours.
      </div>
      <div v-else class="harvest-grid">
        <article
          v-for="entry in harvestDue"
          :key="entry.id_section"
          class="harvest-card"
          :class="{ 'harvest-card--overdue': entry.overdue, 'harvest-card--today': entry.days_left === 0 }"
        >
          <div class="harvest-head">
            <strong>{{ entry.vegetable_name ?? 'Légume inconnu' }}</strong>
            <span class="harvest-badge" :class="entry.overdue ? 'badge-overdue' : entry.days_left === 0 ? 'badge-today' : 'badge-soon'">
              {{ harvestDayLabel(entry) }}
            </span>
          </div>
          <p v-if="entry.variety_name" class="harvest-variety">{{ entry.variety_name }}</p>
          <small>
            {{ entry.exploitation_name }} · {{ entry.sole_name }} · {{ entry.board_name }} · Section {{ entry.section_number }}
          </small>
        </article>
      </div>
    </section>

    <section class="content-grid">
      <article class="dashboard-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">Terrain</span>
            <h2>{{ auth.isStagiaire ? 'Mes dernières observations' : 'Flux des dernières observations' }}</h2>
          </div>
          <span class="section-chip">{{ dashboard.recentObservations.length }} plus récente(s)</span>
        </div>

        <div v-if="dashboard.loading" class="empty-state compact">
          Chargement de l’activité...
        </div>
        <div v-else-if="dashboard.recentObservations.length === 0" class="empty-state compact">
          Aucune observation enregistrée pour le moment.
        </div>
        <div v-else class="observation-list">
          <article
            v-for="observation in dashboard.recentObservations"
            :key="observation.id_observation"
            class="observation-card"
          >
            <div class="observation-head">
              <div>
                <strong>{{ contributorName(observation) }}</strong>
                <span>
                  {{ observation.section.sectionPlan?.board?.board_name }}
                  · Section {{ observation.section.section_number }}
                </span>
              </div>
              <span class="status-badge" :class="statusClass(observation.review_status)">
                {{ statusLabel(observation.review_status) }}
              </span>
            </div>
            <p>{{ observation.notes }}</p>
            <small>{{ formatDate(observation.observation_date) }}</small>
          </article>
        </div>
      </article>

      <article class="dashboard-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">Contributeurs</span>
            <h2>{{ auth.isStagiaire ? 'Votre suivi' : 'Groupe le plus actif' }}</h2>
          </div>
          <span class="section-chip">
            {{ auth.isStagiaire ? (dashboard.observations?.approved ?? 0) : dashboard.contributors.length }}
          </span>
        </div>

        <div v-if="auth.isStagiaire" class="personal-grid">
          <article class="mini-card">
            <strong>{{ dashboard.observations?.approved ?? 0 }}</strong>
            <span>Observations validées</span>
          </article>
          <article class="mini-card">
            <strong>{{ dashboard.observations?.changesRequested ?? 0 }}</strong>
            <span>Retours à reprendre</span>
          </article>
        </div>

        <div v-else-if="dashboard.contributors.length === 0" class="empty-state compact">
          L’activité par contributeur apparaîtra ici.
        </div>
        <div v-else class="contributor-list">
          <article
            v-for="contributor in dashboard.contributors"
            :key="contributor.userId"
            class="contributor-card"
          >
            <strong>{{ contributor.displayName }}</strong>
            <div class="contributor-metrics">
              <span>{{ contributor.submittedCount }} saisie(s)</span>
              <span>{{ contributor.pendingCount }} en attente</span>
            </div>
          </article>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import { useHarvestDueStore } from '@/stores/harvestDue';
import type { HarvestDueEntry } from '@/api/rotations';
import type { ObservationRecord, ObservationReviewStatus } from '@/types/observations';

const auth = useAuthStore();
const dashboard = useDashboardStore();
const harvestDueStore = useHarvestDueStore();
const { items: harvestDue, loading: harvestDueLoading } = storeToRefs(harvestDueStore);

onMounted(() => {
  void dashboard.loadDashboard();
  void harvestDueStore.load();
});

const displayName = computed(() => {
  const firstName = auth.user?.firstName?.trim();

  if (firstName) {
    return firstName;
  }

  return auth.user?.email ?? 'à toi';
});

const generatedAtLabel = computed(() => {
  if (!dashboard.summary?.generatedAt) {
    return dashboard.loading ? 'chargement...' : 'non disponible';
  }

  return new Date(dashboard.summary.generatedAt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const occupancyLabel = computed(() => {
  const value = dashboard.planning?.occupancyRate;
  return typeof value === 'number' ? `${value.toFixed(1)}%` : '0.0%';
});

const pendingLabel = computed(() => {
  if (auth.isStagiaire) {
    return 'Vos retours en attente de validation';
  }

  return 'Observations à relire côté formateur';
});

const actionLinks = computed(() => {
  if (auth.isAdmin) {
    return [
      { to: '/plan', label: 'Planifier les cultures', caption: 'Piloter la campagne en cours' },
      { to: '/historique', label: 'Consulter l’historique', caption: 'Lire les rotations multi-années' },
      { to: '/admin/utilisateurs', label: 'Gérer les utilisateurs', caption: 'Comptes, rôles et accès' },
      { to: '/admin/botanique', label: 'Mettre à jour le référentiel', caption: 'Familles, légumes, variétés' },
    ];
  }

  if (auth.isFormateur) {
    return [
      { to: '/validation', label: 'Valider les observations', caption: 'Traiter la file en attente' },
      { to: '/plan', label: 'Planification', caption: 'Affecter et ajuster les cultures' },
      { to: '/historique', label: 'Historique', caption: 'Vérifier la mémoire des parcelles' },
      { to: '/formateur/tableau-de-bord', label: 'Vue formateur', caption: 'Suivre le groupe' },
    ];
  }

  return [
    { to: '/plan-culture', label: 'Consulter le plan', caption: 'Voir les affectations prévues' },
    { to: '/observations', label: 'Saisir une observation', caption: 'Remonter un constat terrain' },
  ];
});

function contributorName(observation: ObservationRecord) {
  const fullName = `${observation.author.user_first_name} ${observation.author.user_last_name}`.trim();
  return fullName || observation.author.email;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: ObservationReviewStatus) {
  if (status === 'approved') return 'Validée';
  if (status === 'changes_requested') return 'À corriger';
  return 'En attente';
}

function statusClass(status: ObservationReviewStatus) {
  return {
    'status-pending': status === 'pending',
    'status-approved': status === 'approved',
    'status-changes': status === 'changes_requested',
  };
}

function ruleLabel(ruleType?: string) {
  if (ruleType === 'cohabitation') return 'Cohabitation';
  if (ruleType === 'fallow') return 'Jachère';
  return '5 ans';
}

function ruleDescription(alert: { ruleType?: string; lastCultivationDate?: string | null }) {
  if (alert.ruleType === 'cohabitation') return 'Plusieurs familles primaires actives sur la même planche';
  if (alert.ruleType === 'fallow') return 'Jachère recommandée — culture continue depuis 3 ans ou plus';
  return alert.lastCultivationDate
    ? `Replantée le ${formatDate(alert.lastCultivationDate)} — moins de 5 ans après la précédente`
    : 'Violation de la règle des 5 ans';
}

function harvestDayLabel(entry: HarvestDueEntry): string {
  if (entry.days_left < 0) return `En retard de ${Math.abs(entry.days_left)} j`;
  if (entry.days_left === 0) return "Aujourd'hui";
  if (entry.days_left === 1) return 'Demain';
  return `Dans ${entry.days_left} j`;
}
</script>

<style scoped>
.dashboard-view {
  display: grid;
  gap: 1.2rem;
}

.hero-card,
.stat-card,
.dashboard-card,
.action-card,
.observation-card,
.contributor-card,
.mini-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(251, 246, 235, 0.88));
  border: 1px solid var(--brand-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.hero-copy h1,
.section-head h2 {
  margin: 0.35rem 0 0.5rem;
  color: var(--brand-deep);
}

.hero-copy p:last-child {
  margin: 0;
  max-width: 62ch;
  color: var(--text-muted);
}

.hero-role {
  display: grid;
  gap: 0.25rem;
  min-width: 180px;
  padding: 1rem 1.1rem;
  border-radius: var(--radius-lg);
  background: rgba(39, 65, 53, 0.08);
}

.role-label,
.stat-card span,
.section-chip {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
}

.hero-role strong {
  font-size: 1.35rem;
  color: var(--brand-deep);
  text-transform: capitalize;
}

.hero-role small,
.stat-card small,
.contributor-metrics,
.alert-card p,
.alert-card small,
.observation-card small,
.observation-head span,
.action-card p {
  color: var(--text-muted);
}

.stats-grid,
.content-grid,
.action-grid,
.personal-grid {
  display: grid;
  gap: 1rem;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  display: grid;
  gap: 0.25rem;
  padding: 1rem;
}

.stat-card span {
  color: var(--text-muted);
}

.stat-card strong {
  font-size: 1.8rem;
  color: var(--brand-deep);
}

.content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}

.dashboard-card {
  padding: 1.3rem;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1rem;
}

.section-chip,
.status-badge {
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
}

.section-chip {
  background: rgba(39, 65, 53, 0.08);
  color: var(--brand-deep);
}

.action-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-card {
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
  transition: transform 160ms ease, border-color 160ms ease;
}

.action-card:hover {
  transform: translateY(-1px);
  border-color: rgba(74, 103, 65, 0.24);
}

.action-card strong,
.observation-head strong,
.contributor-card strong {
  color: var(--brand-deep);
}


.observation-list,
.contributor-list {
  display: grid;
  gap: 0.85rem;
}

.stat-card--alert strong {
  color: #b85c2a;
}

.chip--alert {
  background: rgba(181, 106, 67, 0.14);
  color: #8b4d2d;
}

.violation-scroll {
  display: grid;
  gap: 0.75rem;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.violation-scroll::-webkit-scrollbar { width: 4px; }
.violation-scroll::-webkit-scrollbar-track { background: transparent; }
.violation-scroll::-webkit-scrollbar-thumb { background: rgba(181, 106, 67, 0.3); border-radius: 2px; }

.violation-card {
  padding: 0.85rem 1rem;
  background: rgba(181, 106, 67, 0.06);
  border: 1px solid rgba(181, 106, 67, 0.2);
  border-radius: var(--radius-lg);
}

.violation-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 0.75rem;
  margin-bottom: 0.3rem;
}

.violation-head strong { color: var(--brand-deep); }

.violation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

.violation-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(181, 106, 67, 0.16);
  color: #8b4d2d;
}

.violation-rule-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
}

.rule-badge-rotation_5y { background: rgba(181, 106, 67, 0.16); color: #8b4d2d; }
.rule-badge-cohabitation { background: rgba(103, 58, 183, 0.14); color: #512da8; }
.rule-badge-fallow { background: rgba(2, 136, 209, 0.12); color: #01579b; }

.violation-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.violation-card small {
  color: #b85c2a;
  font-size: 0.82rem;
}

.observation-card,
.contributor-card,
.mini-card {
  padding: 1rem;
}

.observation-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.observation-card p,
.observation-card small {
  margin: 0;
}

.observation-card p {
  margin-top: 0.45rem;
}


.contributor-card {
  display: grid;
  gap: 0.35rem;
}

.contributor-metrics {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.92rem;
}

.personal-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mini-card {
  display: grid;
  gap: 0.3rem;
}

.mini-card strong {
  font-size: 1.65rem;
  color: var(--brand-deep);
}

.mini-card span {
  color: var(--text-muted);
}

.status-pending {
  background: rgba(181, 106, 67, 0.14);
  color: #8b4d2d;
}

.status-approved {
  background: rgba(74, 103, 65, 0.14);
  color: #35552f;
}

.status-changes {
  background: rgba(160, 87, 24, 0.14);
  color: #9c4f1c;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 220px;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed rgba(39, 65, 53, 0.16);
  border-radius: var(--radius-lg);
}

.compact {
  min-height: 170px;
}

.harvest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.harvest-card {
  background: rgba(251, 246, 235, 0.7);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: var(--radius-lg);
  padding: 0.9rem;
  display: grid;
  gap: 0.35rem;
}

.harvest-card--overdue {
  border-color: rgba(229, 57, 53, 0.4);
  background: rgba(255, 235, 238, 0.7);
}

.harvest-card--today {
  border-color: rgba(230, 81, 0, 0.4);
  background: rgba(255, 248, 225, 0.8);
}

.harvest-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.harvest-head strong { color: var(--brand-deep); font-size: 0.95rem; }
.harvest-variety { margin: 0; font-size: 0.82rem; color: var(--text-muted); }
.harvest-card small { color: var(--text-muted); font-size: 0.78rem; }

.harvest-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-overdue { background: rgba(229, 57, 53, 0.15); color: #c62828; }
.badge-today   { background: rgba(230, 81, 0, 0.15);  color: #bf360c; }
.badge-soon    { background: rgba(74, 103, 65, 0.12);  color: #2e5027; }

.chip-urgent {
  background: rgba(229, 57, 53, 0.15);
  color: #c62828;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .hero-card,
  .content-grid,
  .action-grid,
  .personal-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: start;
  }
}

@media (max-width: 720px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .observation-head,
  .contributor-metrics {
    flex-direction: column;
  }
}
</style>
