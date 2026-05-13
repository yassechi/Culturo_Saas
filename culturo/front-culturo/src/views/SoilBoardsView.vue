<template>
  <div class="soil-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-title">
        <h1>Sol & Planches</h1>
        <p class="header-sub">Configuration des exploitations, soles et planches de culture</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.exploitations }}</span>
          <span class="stat-label">Exploitations</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.soles }}</span>
          <span class="stat-label">Soles</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.boards }}</span>
          <span class="stat-label">Planches</span>
        </div>
      </div>
    </div>

    <!-- Global error -->
    <div v-if="store.error" class="global-error">{{ store.error }}</div>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-state">
      <div v-for="n in 3" :key="n" class="skeleton-row" />
    </div>

    <div v-else class="panels">
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- PANEL 1: Exploitations                                            -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Exploitations</span>
          <button class="btn-add" title="Nouvelle exploitation" @click="store.openCreateExploitation()">+</button>
        </div>
        <div class="panel-list">
          <button
            v-for="exp in store.exploitations"
            :key="exp.id_exploitation"
            class="list-item"
            :class="{ active: store.selectedExploitationId === exp.id_exploitation }"
            @click="store.selectExploitation(exp.id_exploitation)"
          >
            <img
              v-if="store.exploitationCoords[exp.id_exploitation]"
              :src="staticTileUrl(store.exploitationCoords[exp.id_exploitation])"
              class="exp-thumb"
              alt="Satellite"
            />
            <div class="item-main">
              <span class="item-name">{{ exp.exploitation_name }}</span>
              <span class="item-sub">{{ exp.exploitation_locality }}</span>
              <span v-if="store.exploitationCoords[exp.id_exploitation]?.address" class="item-address">
                {{ store.exploitationCoords[exp.id_exploitation].address }}
              </span>
            </div>
            <div class="item-meta">
              <span
                class="status-dot"
                :class="exp.exploitation_active === 'true' ? 'dot-active' : 'dot-inactive'"
              />
              <span class="item-count">{{ solesCount(exp.id_exploitation) }} sole(s)</span>
              <button
                class="item-edit"
                title="Modifier"
                @click.stop="store.openEditExploitation(exp)"
              >✏️</button>
            </div>
          </button>
          <div v-if="store.exploitations.length === 0" class="panel-empty">
            Aucune exploitation.<br>Créez-en une pour commencer.
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- PANEL 2: Soles                                                    -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="panel" :class="{ dimmed: !store.selectedExploitationId }">
        <div class="panel-header">
          <span class="panel-title">
            Soles
            <span v-if="store.selectedExploitation" class="panel-context">
              — {{ store.selectedExploitation.exploitation_name }}
            </span>
          </span>
          <button
            class="btn-add"
            title="Nouvelle sole"
            :disabled="!store.selectedExploitationId"
            @click="store.openCreateSole()"
          >+</button>
        </div>
        <div class="panel-list">
          <template v-if="store.selectedExploitationId">
            <button
              v-for="sole in store.solesForSelected"
              :key="sole.id_sole"
              class="list-item"
              :class="{ active: store.selectedSoleId === sole.id_sole }"
              @click="store.selectSole(sole.id_sole)"
            >
              <div class="item-main">
                <span class="item-name">{{ sole.sole_name }}</span>
              </div>
              <div class="item-meta">
                <span class="status-dot" :class="sole.sole_active ? 'dot-active' : 'dot-inactive'" />
                <span class="item-count">{{ sole.boards?.length ?? 0 }} planche(s)</span>
                <button class="item-edit" title="Modifier" @click.stop="store.openEditSole(sole)">✏️</button>
                <button
                  class="item-del"
                  title="Supprimer"
                  @click.stop="confirmDeleteSole(sole.id_sole, sole.sole_name)"
                >🗑️</button>
              </div>
            </button>
            <div v-if="store.solesForSelected.length === 0" class="panel-empty">
              Aucune sole pour cette exploitation.
            </div>
          </template>
          <div v-else class="panel-empty muted">← Sélectionnez une exploitation</div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- PANEL 3: Planches                                                 -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="panel" :class="{ dimmed: !store.selectedSoleId }">
        <div class="panel-header">
          <span class="panel-title">
            Planches
            <span v-if="store.selectedSole" class="panel-context">
              — {{ store.selectedSole.sole_name }}
            </span>
          </span>
          <button
            class="btn-add"
            title="Créer des planches"
            :disabled="!store.selectedSoleId"
            @click="openBatchModal()"
          >+</button>
        </div>
        <div class="panel-list boards-list">
          <template v-if="store.selectedSoleId">
            <div
              v-for="board in store.boardsForSelected"
              :key="board.id_board"
              class="board-card"
              :class="{ 'board-inactive': !board.board_active, 'board-expanded': expandedBoardId === board.id_board }"
            >
              <!-- Clickable header -->
              <button type="button" class="board-header" @click="toggleBoard(board.id_board)">
                <div class="board-header-left">
                  <span class="board-name">{{ board.board_name }}</span>
                  <span class="board-dim">{{ board.board_width }} × {{ board.board_length }} cm</span>
                  <span class="status-badge" :class="board.board_active ? 'badge-active' : 'badge-inactive'">
                    {{ board.board_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="board-header-right">
                  <span class="board-toggle-arrow">{{ expandedBoardId === board.id_board ? '▲' : '▼' }}</span>
                  <button class="item-edit" title="Modifier" @click.stop="store.openEditBoard(board)">✏️</button>
                  <button
                    class="item-del"
                    title="Supprimer"
                    @click.stop="confirmDeleteBoard(board.id_board, board.board_name)"
                  >🗑️</button>
                </div>
              </button>

              <!-- Expanded sections panel -->
              <template v-if="expandedBoardId === board.id_board">
                <!-- Section count control -->
                <div class="board-sections">
                  <label class="sections-label">Nombre de sections</label>
                  <div class="sections-row">
                    <input
                      type="number"
                      class="sections-input"
                      min="1"
                      max="20"
                      :value="boardSectionInputs[board.id_board] ?? getConfig().defaultSectionsPerBoard"
                      @input="boardSectionInputs[board.id_board] = +($event.target as HTMLInputElement).value"
                    />
                    <button
                      class="btn-sections-apply"
                      :disabled="store.sectionsLoading[board.id_board]"
                      @click="applySections(board.id_board)"
                    >{{ store.sectionsLoading[board.id_board] ? '…' : 'Appliquer' }}</button>
                  </div>
                  <p v-if="store.sectionsError[board.id_board]" class="sections-error">
                    {{ store.sectionsError[board.id_board] }}
                  </p>
                  <p v-if="boardSectionSuccess[board.id_board]" class="sections-success">
                    Sections mises à jour
                  </p>
                </div>

                <!-- Sections list -->
                <div class="board-section-detail">
                  <div v-if="boardSectionsLoading[board.id_board]" class="section-loading">Chargement…</div>
                  <template v-else>
                    <div
                      v-for="n in (boardSectionCounts[board.id_board] ?? 0)"
                      :key="n"
                      class="section-row"
                    >
                      <span class="section-num">S{{ n }}</span>
                      <template v-if="boardSectionsMap[board.id_board]?.find(e => e.sectionNumber === n)">
                        <span class="section-veg">
                          {{ boardSectionsMap[board.id_board].find(e => e.sectionNumber === n)!.vegetableName }}
                          <em v-if="boardSectionsMap[board.id_board].find(e => e.sectionNumber === n)!.varietyName">
                            — {{ boardSectionsMap[board.id_board].find(e => e.sectionNumber === n)!.varietyName }}
                          </em>
                        </span>
                        <span class="section-dates">
                          {{ formatSectionDate(boardSectionsMap[board.id_board].find(e => e.sectionNumber === n)!.startDate) }}
                          → {{ formatSectionDate(boardSectionsMap[board.id_board].find(e => e.sectionNumber === n)!.endDate) }}
                        </span>
                        <button
                          class="section-del"
                          title="Supprimer la section"
                          @click="deleteSection(boardSectionsMap[board.id_board].find(e => e.sectionNumber === n)!.sectionId, board.id_board, boardSectionsMap[board.id_board].find(e => e.sectionNumber === n)!.vegetableName)"
                        >🗑️</button>
                      </template>
                      <template v-else>
                        <span class="section-empty">Disponible</span>
                        <button
                          class="section-del"
                          title="Supprimer la section"
                          @click="deleteSection(null, board.id_board)"
                        >🗑️</button>
                      </template>
                    </div>
                    <div v-if="(boardSectionCounts[board.id_board] ?? 0) === 0" class="section-none">
                      Aucune section configurée. Définissez un nombre ci-dessus.
                    </div>
                  </template>
                </div>
              </template>
            </div>
            <div v-if="store.boardsForSelected.length === 0" class="panel-empty">
              Aucune planche pour cette sole.
            </div>
          </template>
          <div v-else class="panel-empty muted">← Sélectionnez une sole</div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- SATELLITE FRAME                                                       -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <transition name="sat-slide">
      <SatelliteFrame
        v-if="selectedCoords"
        :lat="selectedCoords.lat"
        :lng="selectedCoords.lng"
        :address="selectedCoords.address"
        :locality="store.selectedExploitation?.exploitation_locality"
        class="sat-frame-block"
      />
      <div v-else-if="store.selectedExploitationId" class="sat-no-coords">
        <span>📍</span>
        <span>Aucune position enregistrée pour cette exploitation. Modifiez-la pour placer un repère satellite.</span>
      </div>
    </transition>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Exploitation                                                  -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="store.expModalOpen" class="modal-backdrop" @click.self="store.closeExpModal()">
        <div class="modal modal-exp">
          <div class="modal-header">
            <h2>{{ store.expModalMode === 'create' ? 'Nouvelle exploitation' : "Modifier l'exploitation" }}</h2>
            <button class="modal-close" @click="store.closeExpModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label>Nom</label>
              <input v-model="store.expForm.exploitation_name" placeholder="Ex: Ferme des Crêtes" />
            </div>
            <div class="field-group locality-field">
              <label>Localité</label>
              <div class="autocomplete-wrap">
                <input
                  v-model="store.expForm.exploitation_locality"
                  placeholder="Ex: Namur"
                  autocomplete="off"
                  @input="onLocalityInput"
                  @blur="onLocalityBlur"
                  @keydown.escape="localitySuggestions = []"
                  @keydown.down.prevent="highlightNext"
                  @keydown.up.prevent="highlightPrev"
                  @keydown.enter.prevent="selectHighlighted"
                />
                <ul v-if="localitySuggestions.length" class="suggestions-list">
                  <li
                    v-for="(s, i) in localitySuggestions"
                    :key="i"
                    class="suggestion-item"
                    :class="{ highlighted: i === highlightedIndex }"
                    @mousedown.prevent="selectSuggestion(s)"
                  >
                    <span class="sug-main">{{ s.display }}</span>
                    <span class="sug-type">{{ s.type }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="field-group address-field">
              <label>Adresse précise</label>
              <div class="autocomplete-wrap">
                <input
                  v-model="store.expForm.address"
                  placeholder="Ex: Rue des Potagers 12, 5000 Namur"
                  autocomplete="off"
                  @input="onAddressInput"
                  @blur="onAddressBlur"
                  @keydown.escape="addressSuggestions = []"
                  @keydown.down.prevent="addressHighlightNext"
                  @keydown.up.prevent="addressHighlightPrev"
                  @keydown.enter.prevent="addressSelectHighlighted"
                />
                <ul v-if="addressSuggestions.length" class="suggestions-list">
                  <li
                    v-for="(s, i) in addressSuggestions"
                    :key="i"
                    class="suggestion-item"
                    :class="{ highlighted: i === addressHighlightedIndex }"
                    @mousedown.prevent="selectAddressSuggestion(s)"
                  >
                    <span class="sug-main">{{ s.display }}</span>
                    <span class="sug-type">{{ s.type }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="field-group">
              <label>Statut</label>
              <select v-model="store.expForm.exploitation_active">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <!-- Satellite map picker -->
            <div class="field-group">
              <label>Localisation satellite</label>
              <SatelliteMapPicker
                :initial-coords="store.expForm.coords"
                @update:coords="store.expForm.coords = $event"
                @use-address="store.expForm.exploitation_locality = $event"
              />
            </div>

            <p v-if="store.expModalError" class="modal-error">{{ store.expModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="store.closeExpModal()">Annuler</button>
            <button
              class="btn-primary"
              :disabled="store.expModalLoading"
              @click="store.submitExpModal(currentUserId)"
            >{{ store.expModalLoading ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Sole                                                          -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="store.soleModalOpen" class="modal-backdrop" @click.self="store.closeSoleModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ store.soleModalMode === 'create' ? 'Nouvelle sole' : 'Modifier la sole' }}</h2>
            <button class="modal-close" @click="store.closeSoleModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label>Nom de la sole</label>
              <input v-model="store.soleForm.sole_name" placeholder="Ex: Sole A" />
            </div>
            <div class="field-group">
              <label>Exploitation</label>
              <select v-model.number="store.soleForm.id_exploitation">
                <option :value="null" disabled>Choisir…</option>
                <option
                  v-for="exp in store.exploitations"
                  :key="exp.id_exploitation"
                  :value="exp.id_exploitation"
                >{{ exp.exploitation_name }}</option>
              </select>
            </div>
            <p v-if="store.soleModalError" class="modal-error">{{ store.soleModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="store.closeSoleModal()">Annuler</button>
            <button
              class="btn-primary"
              :disabled="store.soleModalLoading"
              @click="store.submitSoleModal()"
            >{{ store.soleModalLoading ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Création en lot de planches                                  -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="batch.open" class="modal-backdrop" @click.self="closeBatchModal()">
        <div class="modal modal-batch">
          <div class="modal-header">
            <h2>Créer des planches</h2>
            <button class="modal-close" @click="closeBatchModal()">×</button>
          </div>

          <div v-if="batch.step === 1" class="modal-body">
            <p class="batch-hint">Définissez la structure commune à toutes les planches.</p>
            <div class="form-grid-2">
              <div class="field-group">
                <label>Nombre de planches</label>
                <input v-model.number="batch.count" type="number" min="1" max="50" />
              </div>
              <div class="field-group">
                <label>Sections par planche</label>
                <input v-model.number="batch.sections" type="number" min="1" max="20" />
              </div>
            </div>
            <div class="form-grid-2">
              <div class="field-group">
                <label>Largeur (cm)</label>
                <input v-model.number="batch.width" type="number" min="1" />
              </div>
              <div class="field-group">
                <label>Longueur (cm)</label>
                <input v-model.number="batch.length" type="number" min="1" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeBatchModal()">Annuler</button>
              <button
                class="btn-primary"
                :disabled="batch.count < 1"
                @click="batch.step = 2"
              >Suivant →</button>
            </div>
          </div>

          <div v-else class="modal-body">
            <p class="batch-hint">
              Choisissez un préfixe — les planches seront numérotées automatiquement.
            </p>
            <div class="field-group">
              <label>Préfixe</label>
              <input
                v-model="batch.prefix"
                placeholder="Ex: N, Nord, S2-"
                maxlength="12"
                autofocus
              />
            </div>
            <div v-if="batch.prefix.trim()" class="batch-preview">
              <span
                v-for="name in batchPreview"
                :key="name"
                class="preview-chip"
              >{{ name }}</span>
              <span v-if="batch.count > 8" class="preview-more">
                … +{{ batch.count - 8 }} autres
              </span>
            </div>
            <div class="batch-summary">
              <span>{{ batch.count }} planche(s)</span>
              <span>{{ batch.sections }} section(s) chacune</span>
              <span>{{ batch.width }} × {{ batch.length }} cm</span>
            </div>
            <p v-if="batch.error" class="modal-error">{{ batch.error }}</p>
            <div class="modal-footer">
              <button class="btn-secondary" @click="batch.step = 1">← Retour</button>
              <button
                class="btn-primary"
                :disabled="batch.loading || !batch.prefix.trim()"
                @click="submitBatch()"
              >{{ batch.loading ? 'Création…' : `Créer ${batch.count} planche(s)` }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL: Planche (édition uniquement)                                  -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="store.boardModalOpen" class="modal-backdrop" @click.self="store.closeBoardModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ store.boardModalMode === 'create' ? 'Nouvelle planche' : 'Modifier la planche' }}</h2>
            <button class="modal-close" @click="store.closeBoardModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label>Nom de la planche</label>
              <input v-model="store.boardForm.board_name" placeholder="Ex: Planche 1" />
            </div>
            <div class="form-grid-2">
              <div class="field-group">
                <label>Largeur (cm)</label>
                <input v-model.number="store.boardForm.board_width" type="number" min="1" />
              </div>
              <div class="field-group">
                <label>Longueur (cm)</label>
                <input v-model.number="store.boardForm.board_length" type="number" min="1" />
              </div>
            </div>
            <div class="field-group">
              <label>Sole</label>
              <select v-model.number="store.boardForm.id_sole">
                <option :value="null" disabled>Choisir…</option>
                <option
                  v-for="sole in store.soles"
                  :key="sole.id_sole"
                  :value="sole.id_sole"
                >{{ sole.sole_name }}</option>
              </select>
            </div>
            <div class="field-group toggle-group">
              <label>Statut</label>
              <button
                class="toggle-btn"
                :class="store.boardForm.board_active ? 'toggle-on' : 'toggle-off'"
                type="button"
                @click="store.boardForm.board_active = !store.boardForm.board_active"
              >
                {{ store.boardForm.board_active ? 'Active' : 'Inactive' }}
              </button>
            </div>
            <p v-if="store.boardModalError" class="modal-error">{{ store.boardModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="store.closeBoardModal()">Annuler</button>
            <button
              class="btn-primary"
              :disabled="store.boardModalLoading"
              @click="store.submitBoardModal()"
            >{{ store.boardModalLoading ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useSoilBoardsStore } from '@/stores/soilBoards';
import { useAuthStore } from '@/stores/auth';
import { getConfig } from '@/stores/config';
import { rotationsApi } from '@/api/rotations';
import { usePlanningStore } from '@/stores/planning';
import type { CulturePlanEntry } from '@/types/planning';
import SatelliteMapPicker from '@/components/SatelliteMapPicker.vue';
import SatelliteFrame from '@/components/SatelliteFrame.vue';

// ── Locality & Address autocomplete ─────────────────────────────────────────

interface Suggestion {
  display: string;
  type: string;
  lat: number;
  lng: number;
}

const localitySuggestions = ref<Suggestion[]>([]);
const highlightedIndex = ref(-1);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const addressSuggestions = ref<Suggestion[]>([]);
const addressHighlightedIndex = ref(-1);
let addressSearchTimer: ReturnType<typeof setTimeout> | null = null;

function onLocalityInput() {
  highlightedIndex.value = -1;
  const q = store.expForm.exploitation_locality.trim();
  if (searchTimer) clearTimeout(searchTimer);
  if (q.length < 2) { localitySuggestions.value = []; return; }
  searchTimer = setTimeout(() => fetchSuggestions(q), 350);
}

async function fetchSuggestions(q: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=6&accept-language=fr`;
    const resp = await fetch(url);
    const data: any[] = await resp.json();
    localitySuggestions.value = data.map((item) => {
      const a = item.address ?? {};
      const parts = [
        a.village ?? a.town ?? a.city ?? a.municipality ?? a.hamlet,
        a.county ?? a.state,
        a.country,
      ].filter(Boolean);
      return {
        display: parts.join(', ') || item.display_name.split(',').slice(0, 3).join(','),
        type: item.type ?? item.class ?? '',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });
  } catch {
    localitySuggestions.value = [];
  }
}

function selectSuggestion(s: Suggestion) {
  store.expForm.exploitation_locality = s.display;
  store.expForm.coords = { lat: s.lat, lng: s.lng };
  localitySuggestions.value = [];
  highlightedIndex.value = -1;
}

function highlightNext() {
  if (!localitySuggestions.value.length) return;
  highlightedIndex.value = (highlightedIndex.value + 1) % localitySuggestions.value.length;
}

function highlightPrev() {
  if (!localitySuggestions.value.length) return;
  highlightedIndex.value = highlightedIndex.value <= 0
    ? localitySuggestions.value.length - 1
    : highlightedIndex.value - 1;
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0 && localitySuggestions.value[highlightedIndex.value]) {
    selectSuggestion(localitySuggestions.value[highlightedIndex.value]);
  }
}

async function onLocalityBlur() {
  await new Promise(r => setTimeout(r, 150));
  localitySuggestions.value = [];
  const q = store.expForm.exploitation_locality.trim();
  if (!q) return;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&accept-language=fr`;
    const resp = await fetch(url);
    const data: any[] = await resp.json();
    if (data[0]) {
      store.expForm.coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
}

// ── Address autocomplete ─────────────────────────────────────────────────────

function onAddressInput() {
  addressHighlightedIndex.value = -1;
  const q = store.expForm.address.trim();
  if (addressSearchTimer) clearTimeout(addressSearchTimer);
  if (q.length < 3) { addressSuggestions.value = []; return; }
  addressSearchTimer = setTimeout(() => fetchAddressSuggestions(q), 350);
}

async function fetchAddressSuggestions(q: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=6&accept-language=fr`;
    const resp = await fetch(url);
    const data: any[] = await resp.json();
    addressSuggestions.value = data.map((item) => ({
      display: item.display_name.split(',').slice(0, 4).join(',').trim(),
      type: item.type ?? item.class ?? '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    addressSuggestions.value = [];
  }
}

function selectAddressSuggestion(s: Suggestion) {
  store.expForm.address = s.display;
  store.expForm.coords = { lat: s.lat, lng: s.lng, address: s.display } as any;
  addressSuggestions.value = [];
  addressHighlightedIndex.value = -1;
}

function addressHighlightNext() {
  if (!addressSuggestions.value.length) return;
  addressHighlightedIndex.value = (addressHighlightedIndex.value + 1) % addressSuggestions.value.length;
}

function addressHighlightPrev() {
  if (!addressSuggestions.value.length) return;
  addressHighlightedIndex.value = addressHighlightedIndex.value <= 0
    ? addressSuggestions.value.length - 1
    : addressHighlightedIndex.value - 1;
}

function addressSelectHighlighted() {
  if (addressHighlightedIndex.value >= 0 && addressSuggestions.value[addressHighlightedIndex.value]) {
    selectAddressSuggestion(addressSuggestions.value[addressHighlightedIndex.value]);
  }
}

async function onAddressBlur() {
  await new Promise(r => setTimeout(r, 150));
  addressSuggestions.value = [];
  const q = store.expForm.address.trim();
  if (!q) return;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&accept-language=fr`;
    const resp = await fetch(url);
    const data: any[] = await resp.json();
    if (data[0]) {
      store.expForm.coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: q,
      };
    }
  } catch {}
}

const store = useSoilBoardsStore();
const auth = useAuthStore();

const currentUserId = computed(() => (auth.user as any)?.id ?? 1);

const selectedCoords = computed(() => {
  const id = store.selectedExploitationId;
  if (!id) return null;
  return store.exploitationCoords[id] ?? null;
});

onMounted(() => store.loadAll());

function staticTileUrl(coords: { lat: number; lng: number }): string {
  // Convert lat/lng to tile coords at zoom 15 then build ESRI satellite static URL via bbox
  const zoom = 15;
  const x = Math.floor((coords.lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

function solesCount(exploitationId: number) {
  return store.soles.filter((s) => s.exploitation?.id_exploitation === exploitationId).length;
}

function confirmDeleteSole(id: number, name: string) {
  if (confirm(`Supprimer la sole "${name}" ? Ses planches seront également supprimées.`)) {
    store.deleteSole(id);
  }
}

function confirmDeleteBoard(id: number, name: string) {
  if (confirm(`Supprimer la planche "${name}" ?`)) {
    store.deleteBoard(store.selectedSoleId!, id);
  }
}

// ── Batch board creation ──────────────────────────────────────────────────────
const batch = reactive({
  open: false,
  step: 1 as 1 | 2,
  count: 5,
  width: 120,
  length: 500,
  prefix: '',
  sections: 3,
  loading: false,
  error: null as string | null,
});

const batchPreview = computed(() => {
  if (!batch.prefix.trim()) return [];
  return Array.from({ length: Math.min(batch.count, 8) }, (_, i) => `${batch.prefix.trim()}${i + 1}`);
});

function openBatchModal() {
  batch.open = true;
  batch.step = 1;
  batch.count = 5;
  batch.width = 120;
  batch.length = 500;
  batch.prefix = '';
  batch.sections = 3;
  batch.loading = false;
  batch.error = null;
}

function closeBatchModal() {
  batch.open = false;
}

async function submitBatch() {
  if (!store.selectedSoleId) return;
  const prefix = batch.prefix.trim();
  if (!prefix) { batch.error = 'Veuillez saisir un préfixe.'; return; }
  if (batch.count < 1 || batch.count > 50) { batch.error = 'Nombre de planches entre 1 et 50.'; return; }
  batch.error = null;
  batch.loading = true;
  try {
    await store.batchCreateBoards(
      store.selectedSoleId,
      prefix,
      batch.count,
      batch.width,
      batch.length,
      batch.sections,
    );
    closeBatchModal();
  } catch (e: any) {
    const raw = e?.response?.data?.message;
    batch.error = Array.isArray(raw) ? raw.join(' | ') : (raw ?? e?.message ?? 'Erreur inconnue');
  } finally {
    batch.loading = false;
  }
}

// ── Board expand / sections detail ───────────────────────────────────────────
const expandedBoardId = ref<number | null>(null);
const boardSectionsMap = reactive<Record<number, CulturePlanEntry[]>>({});
const boardSectionsLoading = reactive<Record<number, boolean>>({});
const boardSectionCounts = reactive<Record<number, number>>({});
const currentYear = new Date().getFullYear();

function formatSectionDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function toggleBoard(boardId: number) {
  if (expandedBoardId.value === boardId) {
    expandedBoardId.value = null;
    return;
  }
  expandedBoardId.value = boardId;
  await loadBoardSections(boardId);
}

async function loadBoardSections(boardId: number) {
  if (!store.selectedSoleId) return;
  boardSectionsLoading[boardId] = true;
  try {
    const [planResp, cultureResp] = await Promise.all([
      rotationsApi.createOrGetSectionPlan(boardId),
      rotationsApi.getCulturePlan(store.selectedSoleId, currentYear),
    ]);
    boardSectionCounts[boardId] = planResp.data.sectionPlan.number_of_section;
    boardSectionsMap[boardId] = cultureResp.data.filter((e) => e.boardId === boardId);
  } finally {
    boardSectionsLoading[boardId] = false;
  }
}

async function deleteSection(sectionId: number | null, boardId: number, vegetableName?: string) {
  if (sectionId !== null && vegetableName) {
    const ok = window.confirm(`Cette section contient "${vegetableName}". Supprimer quand même la section et sa culture ?`);
    if (!ok) return;
  }
  if (sectionId !== null) {
    await rotationsApi.cancelSection(sectionId);
    boardSectionsMap[boardId] = (boardSectionsMap[boardId] ?? []).filter((e) => e.sectionId !== sectionId);
  }
  const newCount = Math.max(0, (boardSectionCounts[boardId] ?? 1) - 1);
  await store.setSections(boardId, newCount);
  boardSectionCounts[boardId] = newCount;
  boardSectionInputs[boardId] = newCount;
  void usePlanningStore().loadCulturePlan();
}

// ── Sections control ─────────────────────────────────────────────────────────
const boardSectionInputs = reactive<Record<number, number>>({});
const boardSectionSuccess = reactive<Record<number, boolean>>({});

async function applySections(boardId: number) {
  const n = boardSectionInputs[boardId] ?? getConfig().defaultSectionsPerBoard;
  boardSectionSuccess[boardId] = false;
  try {
    await store.setSections(boardId, n);
    boardSectionSuccess[boardId] = true;
    setTimeout(() => { boardSectionSuccess[boardId] = false; }, 2500);
  } catch {
    // error shown via store.sectionsError
  }
}
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────────────────── */
.soil-view {
  padding: 1.5rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
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

.header-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1.1rem;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(251,246,236,0.86));
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 2px 8px rgba(39,65,53,0.06);
  min-width: 64px;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.55);
  margin-top: 0.25rem;
}

/* ── 3-panel layout ───────────────────────────────────────────────────────── */
.panels {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  gap: 1rem;
  align-items: start;
}

/* ── Panel ────────────────────────────────────────────────────────────────── */
.panel {
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(251,246,236,0.88));
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 2px 12px rgba(39,65,53,0.06);
  overflow: hidden;
  transition: opacity 200ms;
}

.panel.dimmed { opacity: 0.55; pointer-events: none; }

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem 0.8rem;
  border-bottom: 1px solid rgba(39,65,53,0.08);
  background: rgba(255,255,255,0.5);
}

.panel-title {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39,65,53,0.65);
}

.panel-context {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.8rem;
  color: rgba(39,65,53,0.5);
}

.btn-add {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid rgba(74,103,65,0.35);
  background: rgba(74,103,65,0.08);
  color: rgba(74,103,65,0.9);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 160ms, border-color 160ms;
  flex-shrink: 0;
}

.btn-add:hover { background: rgba(74,103,65,0.16); border-color: rgba(74,103,65,0.5); }
.btn-add:disabled { opacity: 0.4; cursor: not-allowed; }

.panel-list {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 120px;
  max-height: 520px;
  overflow-y: auto;
}

/* ── List items ───────────────────────────────────────────────────────────── */
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 120ms, border-color 120ms;
}

.list-item:hover {
  background: rgba(74,103,65,0.06);
  border-color: rgba(74,103,65,0.1);
}

.list-item.active {
  background: rgba(74,103,65,0.1);
  border-color: rgba(74,103,65,0.22);
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-sub {
  font-size: 0.75rem;
  color: rgba(39,65,53,0.5);
}

.item-address {
  font-size: 0.7rem;
  color: rgba(39,65,53,0.38);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.item-count {
  font-size: 0.72rem;
  color: rgba(39,65,53,0.5);
  white-space: nowrap;
}

.item-edit,
.item-del {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.78rem;
  padding: 0.2rem;
  opacity: 0.5;
  transition: opacity 120ms;
  line-height: 1;
}

.item-edit:hover,
.item-del:hover { opacity: 1; }

/* ── Status dots ──────────────────────────────────────────────────────────── */
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-active { background: #4a9840; }
.dot-inactive { background: rgba(39,65,53,0.25); }

/* ── Empty states ─────────────────────────────────────────────────────────── */
.panel-empty {
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 0.82rem;
  color: rgba(39,65,53,0.45);
  line-height: 1.5;
}

.panel-empty.muted { font-style: italic; }

/* ── Board cards ──────────────────────────────────────────────────────────── */
.boards-list { gap: 0.5rem; }

.board-card {
  border-radius: 14px;
  border: 1px solid rgba(39,65,53,0.1);
  background: rgba(255,255,255,0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 160ms;
}

.board-card:hover { border-color: rgba(74,103,65,0.2); }
.board-card.board-inactive { opacity: 0.55; }
.board-card.board-expanded { border-color: rgba(74,103,65,0.35); }

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.8rem 0.9rem;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.board-header:hover { background: rgba(74,103,65,0.04); }

.board-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.board-header-right {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.board-toggle-arrow {
  font-size: 0.65rem;
  color: rgba(39,65,53,0.4);
  margin-right: 0.2rem;
}

.board-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
}

.board-dim {
  font-size: 0.78rem;
  color: rgba(39,65,53,0.55);
  font-weight: 600;
}

/* ── Board section detail ─────────────────────────────────────────────────── */
.board-section-detail {
  border-top: 1px solid rgba(39,65,53,0.08);
  padding: 0.5rem 0.9rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.section-loading {
  font-size: 0.78rem;
  color: rgba(39,65,53,0.45);
  padding: 0.3rem 0;
}

.section-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  background: rgba(39,65,53,0.03);
  font-size: 0.8rem;
}

.section-row:hover { background: rgba(39,65,53,0.06); }

.section-num {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(39,65,53,0.5);
  min-width: 24px;
}

.section-veg {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
}

.section-veg em {
  font-style: normal;
  font-weight: 400;
  color: rgba(39,65,53,0.6);
}

.section-dates {
  font-size: 0.72rem;
  color: rgba(39,65,53,0.5);
  white-space: nowrap;
}

.section-del {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0.45;
  padding: 0.1rem;
  transition: opacity 120ms;
  flex-shrink: 0;
}

.section-del:hover { opacity: 1; }

.section-empty {
  color: rgba(39,65,53,0.35);
  font-style: italic;
  font-size: 0.78rem;
}

.section-none {
  font-size: 0.78rem;
  color: rgba(39,65,53,0.4);
  font-style: italic;
  padding: 0.2rem 0;
}

.section-count {
  font-size: 0.72rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: rgba(39,65,53,0.07);
  color: rgba(39,65,53,0.6);
  font-weight: 700;
}

.status-badge {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}

.badge-active { background: rgba(74,140,65,0.12); color: #2d6b30; }
.badge-inactive { background: rgba(100,100,100,0.1); color: rgba(39,65,53,0.5); }

/* ── Board sections control ───────────────────────────────────────────────── */
.board-sections {
  padding: 0.5rem 0.9rem 0.6rem;
  border-top: 1px solid rgba(39,65,53,0.07);
}

.sections-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(39,65,53,0.5);
  display: block;
  margin-bottom: 0.3rem;
}

.sections-row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.sections-input {
  width: 56px;
  padding: 0.28rem 0.4rem;
  border-radius: 8px;
  border: 1.5px solid rgba(74,103,65,0.2);
  background: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.sections-input:focus {
  outline: none;
  border-color: rgba(74,103,65,0.5);
}

.btn-sections-apply {
  padding: 0.28rem 0.7rem;
  border-radius: 8px;
  border: 1.5px solid rgba(74,103,65,0.3);
  background: rgba(74,103,65,0.08);
  color: rgba(39,65,53,0.85);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms;
}

.btn-sections-apply:hover:not(:disabled) {
  background: rgba(74,103,65,0.15);
}

.btn-sections-apply:disabled {
  opacity: 0.55;
  cursor: default;
}

.sections-error {
  margin: 0.3rem 0 0;
  font-size: 0.73rem;
  color: #c0392b;
}

.sections-success {
  margin: 0.3rem 0 0;
  font-size: 0.73rem;
  color: #2d6b30;
  font-weight: 600;
}

/* ── States ───────────────────────────────────────────────────────────────── */
.global-error {
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  background: rgba(200,60,60,0.08);
  border: 1px solid rgba(200,60,60,0.2);
  color: #b94040;
  font-size: 0.88rem;
}

.loading-state { display: flex; flex-direction: column; gap: 0.75rem; }

.skeleton-row {
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(39,65,53,0.06) 0%, rgba(39,65,53,0.03) 50%, rgba(39,65,53,0.06) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20,35,25,0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(251,246,236,0.96));
  border-radius: 24px;
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 24px 60px rgba(20,35,25,0.22);
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
}

.modal-exp { max-width: 580px; }
.modal-batch { max-width: 520px; }

.batch-hint {
  margin: 0;
  font-size: 0.88rem;
  color: rgba(39, 65, 53, 0.65);
  line-height: 1.5;
}

.batch-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.75rem;
  background: rgba(39, 65, 53, 0.04);
  border-radius: 12px;
  border: 1px dashed rgba(39, 65, 53, 0.15);
  min-height: 2.5rem;
  align-items: center;
}

.preview-chip {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  background: rgba(74, 140, 65, 0.12);
  border: 1px solid rgba(74, 140, 65, 0.25);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #2d6b30;
}

.preview-more {
  font-size: 0.8rem;
  color: rgba(39, 65, 53, 0.5);
  font-style: italic;
}

.batch-summary {
  display: flex;
  gap: 1rem;
  padding: 0.6rem 0.85rem;
  background: rgba(39, 65, 53, 0.05);
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(39, 65, 53, 0.75);
}

.batch-summary span::before {
  content: '• ';
  color: rgba(74, 140, 65, 0.6);
}

/* ── Locality autocomplete ────────────────────────────────────────────────── */
.locality-field,
.address-field { position: relative; }

.autocomplete-wrap { position: relative; }

.suggestions-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 2000;
  margin: 0;
  padding: 0.3rem 0;
  list-style: none;
  background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(251,246,236,0.98));
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(20,35,25,0.14);
  max-height: 220px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
  transition: background 100ms;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: rgba(74,103,65,0.08);
}

.sug-main {
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sug-type {
  font-size: 0.7rem;
  color: rgba(39,65,53,0.4);
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.exp-thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(39,65,53,0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.3rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(39,65,53,0.09);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: rgba(39,65,53,0.45);
  line-height: 1;
  padding: 0.1rem 0.3rem;
}

.modal-body {
  padding: 1.2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-height: 75vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.3rem;
  border-top: 1px solid rgba(39,65,53,0.09);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-group label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.6);
}

.field-group input,
.field-group select {
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 12px;
  font-size: 0.92rem;
  background: rgba(255,255,255,0.94);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.toggle-group {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle-btn {
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  border: 1.5px solid rgba(39,65,53,0.15);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 160ms, border-color 160ms;
}

.toggle-on { background: rgba(74,140,65,0.12); border-color: rgba(74,140,65,0.3); color: #2d6b30; }
.toggle-off { background: rgba(100,100,100,0.08); border-color: rgba(100,100,100,0.2); color: rgba(39,65,53,0.5); }

.modal-error {
  color: #b94040;
  font-size: 0.84rem;
  margin: 0;
  background: rgba(200,60,60,0.07);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

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
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

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
@media (max-width: 900px) {
  .panels { grid-template-columns: 1fr 1fr; }
  .panels > .panel:last-child { grid-column: 1 / -1; }
}

@media (max-width: 600px) {
  .soil-view { padding: 1rem; }
  .view-header { flex-direction: column; }
  .panels { grid-template-columns: 1fr; }
  .form-grid-2 { grid-template-columns: 1fr; }
}

/* ── Satellite frame ────────────────────────────────────────────────────────── */
.sat-frame-block {
  margin-top: 1.5rem;
}

.sat-no-coords {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  border: 1px dashed rgba(39, 65, 53, 0.18);
  background: rgba(255, 255, 255, 0.5);
  font-size: 0.84rem;
  color: rgba(39, 65, 53, 0.5);
}

.sat-slide-enter-active,
.sat-slide-leave-active {
  transition: opacity 280ms ease, transform 280ms ease;
}
.sat-slide-enter-from,
.sat-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
