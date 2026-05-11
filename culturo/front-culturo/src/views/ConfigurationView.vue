<template>
  <div class="config-view">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="view-header">
      <div>
        <h1>Configuration</h1>
        <p class="header-sub">Paramètres applicatifs et environnement métier</p>
      </div>
      <div v-if="saved" class="save-toast">✓ Paramètres sauvegardés</div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 1: Système                                                     -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <section class="config-section">
      <div class="section-header" @click="toggleSection('system')">
        <div class="section-title">
          <span class="section-icon">⚙️</span>
          <span>Informations système</span>
        </div>
        <span class="chevron" :class="{ open: openSections.system }">›</span>
      </div>

      <div v-if="openSections.system" class="section-body">
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Environnement</span>
            <span class="info-value">
              <span class="env-badge" :class="isDev ? 'env-dev' : 'env-prod'">
                {{ isDev ? 'Développement' : 'Production' }}
              </span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">URL de l'API</span>
            <span class="info-value mono">{{ maskedApiUrl }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Version front</span>
            <span class="info-value mono">{{ appVersion }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Navigateur</span>
            <span class="info-value mono">{{ browserInfo }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Statut API</span>
            <span class="info-value">
              <span class="status-dot" :class="apiStatus === 'ok' ? 'dot-green' : 'dot-red'" />
              {{ apiStatus === 'ok' ? 'Accessible' : apiStatus === 'checking' ? 'Vérification…' : 'Inaccessible' }}
              <button class="btn-xs" @click="checkApiStatus">Tester</button>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 2: Paramètres métier                                           -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <section class="config-section">
      <div class="section-header" @click="toggleSection('business')">
        <div class="section-title">
          <span class="section-icon">🌱</span>
          <span>Paramètres métier</span>
        </div>
        <span class="chevron" :class="{ open: openSections.business }">›</span>
      </div>

      <div v-if="openSections.business" class="section-body">
        <p class="section-desc">
          Ces paramètres configurent le comportement de l'application. Ils sont stockés localement
          sur cet appareil.
        </p>

        <div class="param-group">
          <h3 class="param-group-title">Rotations</h3>
          <div class="param-row">
            <div class="param-info">
              <span class="param-label">Seuil d'alerte (années consécutives)</span>
              <span class="param-desc">
                Nombre d'années consécutives de même légume déclenchant une alerte critique.
              </span>
            </div>
            <input
              v-model.number="params.rotationCriticalYears"
              type="number"
              class="param-input"
              min="1"
              max="10"
            />
          </div>
          <div class="param-row">
            <div class="param-info">
              <span class="param-label">Seuil d'avertissement (années non-consécutives)</span>
              <span class="param-desc">
                Nombre de répétitions sur la période complète pour déclencher un avertissement.
              </span>
            </div>
            <input
              v-model.number="params.rotationWarningOccurrences"
              type="number"
              class="param-input"
              min="2"
              max="10"
            />
          </div>
        </div>

        <div class="param-group">
          <h3 class="param-group-title">Planification</h3>
          <div class="param-row">
            <div class="param-info">
              <span class="param-label">Sections par planche (défaut)</span>
              <span class="param-desc">
                Nombre de sections affichées par défaut dans la vue Gantt du planning.
              </span>
            </div>
            <input
              v-model.number="params.defaultSectionsPerBoard"
              type="number"
              class="param-input"
              min="1"
              max="12"
            />
          </div>
          <div class="param-row">
            <div class="param-info">
              <span class="param-label">Fenêtre Gantt (mois visibles)</span>
              <span class="param-desc">
                Nombre de mois affichés simultanément dans le calendrier de planification.
              </span>
            </div>
            <input
              v-model.number="params.planningWindowMonths"
              type="number"
              class="param-input"
              min="1"
              max="12"
            />
          </div>
          <div class="param-row">
            <div class="param-info">
              <span class="param-label">Déplacement fenêtre Gantt (mois)</span>
              <span class="param-desc">
                Nombre de mois parcourus à chaque clic sur les boutons de navigation.
              </span>
            </div>
            <input
              v-model.number="params.planningWindowStep"
              type="number"
              class="param-input"
              min="1"
              max="6"
            />
          </div>
        </div>

        <div class="param-group">
          <h3 class="param-group-title">Historique</h3>
          <div class="param-row">
            <div class="param-info">
              <span class="param-label">Années chargées par défaut</span>
              <span class="param-desc">
                Nombre d'années analysées à l'ouverture de la vue Historique (années précédentes + année courante).
              </span>
            </div>
            <input
              v-model.number="params.historyDefaultYears"
              type="number"
              class="param-input"
              min="1"
              max="10"
            />
          </div>
        </div>

        <div class="param-actions">
          <button class="btn-secondary" @click="resetParams">Réinitialiser</button>
          <button class="btn-primary" @click="saveParams">Enregistrer</button>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 3: Matrice des permissions                                     -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <section class="config-section">
      <div class="section-header" @click="toggleSection('perms')">
        <div class="section-title">
          <span class="section-icon">🔐</span>
          <span>Matrice des rôles et permissions</span>
        </div>
        <span class="chevron" :class="{ open: openSections.perms }">›</span>
      </div>

      <div v-if="openSections.perms" class="section-body">
        <p class="section-desc">Vue en lecture seule des permissions accordées à chaque rôle.</p>
        <div class="table-wrap">
          <table class="perm-table">
            <thead>
              <tr>
                <th>Permission</th>
                <th class="role-col">Admin</th>
                <th class="role-col">Formateur</th>
                <th class="role-col">Stagiaire</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in permissionGroups" :key="group.label">
                <tr class="perm-group-row">
                  <td colspan="4" class="perm-group-label">{{ group.label }}</td>
                </tr>
                <tr v-for="perm in group.permissions" :key="perm.key">
                  <td class="perm-name">{{ perm.label }}</td>
                  <td class="role-col center">
                    <span class="perm-check" :class="perm.admin ? 'check-yes' : 'check-no'">
                      {{ perm.admin ? '✓' : '–' }}
                    </span>
                  </td>
                  <td class="role-col center">
                    <span class="perm-check" :class="perm.formateur ? 'check-yes' : 'check-no'">
                      {{ perm.formateur ? '✓' : '–' }}
                    </span>
                  </td>
                  <td class="role-col center">
                    <span class="perm-check" :class="perm.stagiaire ? 'check-yes' : 'check-no'">
                      {{ perm.stagiaire ? '✓' : '–' }}
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 4: Session en cours                                            -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <section class="config-section">
      <div class="section-header" @click="toggleSection('session')">
        <div class="section-title">
          <span class="section-icon">👤</span>
          <span>Session en cours</span>
        </div>
        <span class="chevron" :class="{ open: openSections.session }">›</span>
      </div>

      <div v-if="openSections.session" class="section-body">
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Utilisateur connecté</span>
            <span class="info-value fw-700">
              {{ auth.user?.firstName }} {{ auth.user?.lastName }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value mono">{{ auth.user?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Rôle</span>
            <span class="info-value">
              <span class="role-badge" :class="`role-${auth.user?.role}`">{{ auth.user?.role }}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Token JWT</span>
            <span class="info-value mono token-preview">
              {{ tokenPreview }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Stockage local</span>
            <span class="info-value">{{ localStorageKeys }} clé(s) Culturo</span>
          </div>
        </div>

        <div class="session-actions">
          <button class="btn-danger" @click="clearLocalStorage">
            Vider le cache local
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/api/client';

const auth = useAuthStore();

// ── Section toggles ──────────────────────────────────────────────────────────

const openSections = reactive({
  system: true,
  business: true,
  perms: false,
  session: false,
});

function toggleSection(key: keyof typeof openSections) {
  openSections[key] = !openSections[key];
}

// ── System info ──────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV;
const appVersion = import.meta.env.VITE_APP_VERSION ?? '1.0.0';

const maskedApiUrl = computed(() => {
  const url = import.meta.env.VITE_API_URL ?? '';
  if (!url) return '(non configurée)';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return url;
  }
});

const browserInfo = computed(() => {
  const ua = navigator.userAgent;
  const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  return match ? match[0] : ua.slice(0, 40);
});

const apiStatus = ref<'ok' | 'error' | 'checking' | 'idle'>('idle');

async function checkApiStatus() {
  apiStatus.value = 'checking';
  try {
    await apiClient.get('/users', { timeout: 4000 });
    apiStatus.value = 'ok';
  } catch (e: any) {
    apiStatus.value = e?.response ? 'ok' : 'error';
  }
}

// ── Business params ──────────────────────────────────────────────────────────

const CONFIG_KEY = 'culturo_config';

const DEFAULT_PARAMS = {
  rotationCriticalYears: 1,
  rotationWarningOccurrences: 2,
  defaultSectionsPerBoard: 3,
  planningWindowMonths: 3,
  planningWindowStep: 3,
  historyDefaultYears: 3,
};

function loadParams() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PARAMS };
}

const params = reactive(loadParams());
const saved = ref(false);

function saveParams() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...params }));
  saved.value = true;
  setTimeout(() => (saved.value = false), 2500);
}

function resetParams() {
  if (!confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) return;
  Object.assign(params, DEFAULT_PARAMS);
  localStorage.removeItem(CONFIG_KEY);
  saved.value = true;
  setTimeout(() => (saved.value = false), 2500);
}

// ── Permissions matrix ───────────────────────────────────────────────────────

const permissionGroups = [
  {
    label: 'Gestion des utilisateurs',
    permissions: [
      { key: 'ACCEDER_LISTE_UTILISATEURS', label: 'Voir la liste des utilisateurs', admin: true, formateur: true, stagiaire: false },
      { key: 'CREER_UTILISATEUR', label: 'Créer un utilisateur', admin: true, formateur: true, stagiaire: false },
      { key: 'MODIFIER_UTILISATEUR_STAGIAIRE', label: 'Modifier un stagiaire', admin: true, formateur: true, stagiaire: false },
      { key: 'SUPPRIMER_UTILISATEUR', label: 'Supprimer un utilisateur', admin: true, formateur: true, stagiaire: false },
    ],
  },
  {
    label: 'Exploitations & Sol',
    permissions: [
      { key: 'ACCEDER_TOUTES_EXPLOITATIONS', label: 'Voir toutes les exploitations', admin: true, formateur: true, stagiaire: false },
      { key: 'CREER_EXPLOITATION', label: 'Créer exploitation / sole / planche', admin: true, formateur: true, stagiaire: false },
      { key: 'MODIFIER_SUPPRIMER_EXPLOITATION', label: 'Modifier / supprimer exploitation', admin: true, formateur: true, stagiaire: false },
    ],
  },
  {
    label: 'Référentiel botanique',
    permissions: [
      { key: 'CREER_FAMILLE_LEGUME', label: 'Créer une famille de légumes', admin: true, formateur: true, stagiaire: false },
      { key: 'MODIFIER_SUPPRIMER_FAMILLE_LEGUME', label: 'Modifier / supprimer une famille', admin: true, formateur: true, stagiaire: false },
      { key: 'CREER_LEGUME', label: 'Créer un légume', admin: true, formateur: true, stagiaire: false },
      { key: 'MODIFIER_SUPPRIMER_LEGUME', label: 'Modifier / supprimer un légume', admin: true, formateur: true, stagiaire: false },
      { key: 'CREER_VARIETE_LEGUME', label: 'Créer une variété', admin: true, formateur: true, stagiaire: false },
      { key: 'MODIFIER_SUPPRIMER_VARIETE_LEGUME', label: 'Modifier / supprimer une variété', admin: true, formateur: true, stagiaire: false },
    ],
  },
  {
    label: 'Planification & Rotations',
    permissions: [
      { key: 'CONSULTER_PLAN', label: 'Consulter le plan de culture', admin: true, formateur: true, stagiaire: true },
      { key: 'PLANIFIER_CULTURE', label: 'Planifier une culture', admin: true, formateur: true, stagiaire: false },
      { key: 'BYPASS_ROTATION', label: 'Forcer une rotation non recommandée', admin: true, formateur: true, stagiaire: false },
      { key: 'MODIFIER_SUPPRIMER_RECOLTE', label: 'Modifier / supprimer une récolte', admin: true, formateur: true, stagiaire: false },
    ],
  },
  {
    label: 'Observations terrain',
    permissions: [
      { key: 'SAISIR_OBSERVATION', label: 'Saisir une observation', admin: false, formateur: false, stagiaire: true },
      { key: 'CONSULTER_OBSERVATIONS', label: 'Consulter les observations', admin: true, formateur: true, stagiaire: true },
    ],
  },
];

// ── Session ──────────────────────────────────────────────────────────────────

const tokenPreview = computed(() => {
  const t = auth.token;
  if (!t) return '(aucun)';
  return `${t.slice(0, 18)}…${t.slice(-8)}`;
});

const localStorageKeys = computed(() => {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('culturo')) count++;
  }
  return count;
});

function clearLocalStorage() {
  if (!confirm('Supprimer toutes les données Culturo du cache local ? Vous serez déconnecté.')) return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('culturo')) toRemove.push(key);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  auth.logout();
  window.location.assign('/login');
}

onMounted(() => checkApiStatus());
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────────────────── */
.config-view {
  padding: 1.5rem 2rem;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
}

.header-sub {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: rgba(39, 65, 53, 0.6);
}

.save-toast {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: rgba(74,140,65,0.12);
  border: 1px solid rgba(74,140,65,0.25);
  color: #2d6b30;
  font-size: 0.85rem;
  font-weight: 700;
  animation: fade-in 200ms ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Section card ─────────────────────────────────────────────────────────── */
.config-section {
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(251,246,236,0.88));
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 2px 12px rgba(39,65,53,0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: background 120ms;
}

.section-header:hover { background: rgba(74,103,65,0.04); }

.section-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
}

.section-icon { font-size: 1.1rem; }

.chevron {
  font-size: 1.2rem;
  color: rgba(39,65,53,0.4);
  transition: transform 200ms;
  line-height: 1;
}

.chevron.open { transform: rotate(90deg); }

.section-body {
  padding: 0 1.25rem 1.25rem;
  border-top: 1px solid rgba(39,65,53,0.07);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.section-desc {
  margin: 0.75rem 0 0;
  font-size: 0.84rem;
  color: rgba(39,65,53,0.55);
  line-height: 1.5;
}

/* ── Info grid ────────────────────────────────────────────────────────────── */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 14px;
  border: 1px solid rgba(39,65,53,0.08);
  overflow: hidden;
  margin-top: 0.75rem;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(39,65,53,0.06);
  flex-wrap: wrap;
}

.info-row:last-child { border-bottom: none; }

.info-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(39,65,53,0.55);
  white-space: nowrap;
}

.info-value {
  font-size: 0.88rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mono { font-family: 'Courier New', monospace; font-size: 0.82rem; }
.fw-700 { font-weight: 700; }

.env-badge {
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.env-dev { background: rgba(200,130,30,0.12); color: #8a6010; }
.env-prod { background: rgba(74,140,65,0.12); color: #2d6b30; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.dot-green { background: #4a9840; }
.dot-red { background: #c04040; }

.btn-xs {
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(39,65,53,0.15);
  background: rgba(255,255,255,0.9);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-primary);
}

.token-preview {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Params ───────────────────────────────────────────────────────────────── */
.param-group {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 14px;
  border: 1px solid rgba(39,65,53,0.08);
  overflow: hidden;
}

.param-group-title {
  margin: 0;
  padding: 0.6rem 1rem;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39,65,53,0.5);
  background: rgba(74,103,65,0.04);
  border-bottom: 1px solid rgba(39,65,53,0.07);
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(39,65,53,0.06);
}

.param-row:last-child { border-bottom: none; }

.param-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.param-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.param-desc {
  font-size: 0.78rem;
  color: rgba(39,65,53,0.5);
  line-height: 1.4;
}

.param-input {
  width: 72px;
  padding: 0.5rem 0.65rem;
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  background: rgba(255,255,255,0.94);
  color: var(--text-primary);
  flex-shrink: 0;
}

.param-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* ── Permissions table ────────────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(39,65,53,0.1);
  background: rgba(255,255,255,0.8);
}

.perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.perm-table th {
  padding: 0.7rem 1rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.55);
  border-bottom: 1px solid rgba(39,65,53,0.1);
  white-space: nowrap;
}

.role-col { width: 90px; text-align: center !important; }
.center { text-align: center; }

.perm-table td {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid rgba(39,65,53,0.05);
  color: var(--text-primary);
}

.perm-table tbody tr:hover { background: rgba(74,103,65,0.03); }

.perm-group-row td {
  background: rgba(74,103,65,0.04);
  border-bottom: 1px solid rgba(39,65,53,0.07) !important;
}

.perm-group-label {
  font-size: 0.7rem !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39,65,53,0.5) !important;
  padding: 0.5rem 1rem !important;
}

.perm-name {
  font-size: 0.84rem;
  color: var(--text-primary);
}

.perm-check {
  display: inline-block;
  width: 1.5rem;
  font-weight: 800;
  font-size: 0.9rem;
}

.check-yes { color: #2d6b30; }
.check-no { color: rgba(39,65,53,0.2); }

/* ── Role badges ──────────────────────────────────────────────────────────── */
.role-badge {
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: capitalize;
}

.role-admin { background: rgba(74,103,65,0.12); color: #2d5530; }
.role-formateur { background: rgba(74,100,160,0.12); color: #2d4080; }
.role-stagiaire { background: rgba(140,100,40,0.12); color: #6b4810; }

/* ── Session actions ──────────────────────────────────────────────────────── */
.session-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-danger {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  border: 1.5px solid rgba(200,60,60,0.3);
  background: rgba(200,60,60,0.06);
  color: #b94040;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 160ms;
}

.btn-danger:hover { background: rgba(200,60,60,0.12); }

/* ── Shared buttons ───────────────────────────────────────────────────────── */
.btn-primary {
  padding: 0.65rem 1.2rem;
  border-radius: 12px;
  border: none;
  background: rgba(74,103,65,0.88);
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 160ms;
}
.btn-primary:hover { background: rgba(74,103,65,1); }

.btn-secondary {
  padding: 0.65rem 1.2rem;
  border-radius: 12px;
  border: 1px solid rgba(39,65,53,0.18);
  background: rgba(255,255,255,0.9);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .config-view { padding: 1rem; }
  .param-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .param-input { width: 100%; text-align: left; }
  .perm-table th:first-child,
  .perm-table td:first-child { max-width: 180px; }
}
</style>
