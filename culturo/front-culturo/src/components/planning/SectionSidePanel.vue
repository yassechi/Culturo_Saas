<template>
  <div class="side-panel-overlay" @click.self="store.closeSectionPanel()">
    <aside class="side-panel" role="dialog" aria-modal="true">

      <!-- En-tête -->
      <header class="panel-header">
        <div>
          <p class="panel-eyebrow">{{ harvestableEntry ? 'Récolte' : 'Affectation de légume' }}</p>
          <h3 class="panel-title">
            {{ store.openSection!.boardName }} — Section {{ store.openSection!.sectionNumber }}
          </h3>
        </div>
        <button type="button" class="close-btn" aria-label="Fermer" @click="store.closeSectionPanel()">✕</button>
      </header>

      <!-- Chargement (seulement en mode plantation) -->
      <div v-if="!harvestableEntry && (store.vegetablesLoading || botanical.loading)" class="panel-loading">
        <p>Chargement du catalogue…</p>
      </div>

      <template v-else>

        <!-- ── Recherche de légume (mode plantation uniquement) ─────────── -->
        <div v-if="!harvestableEntry" class="veg-search-wrapper" :class="{ 'search-open': showSuggestions && searchSuggestions.length > 0 }">
          <span class="search-icon">🔍</span>
          <input
            ref="searchInputEl"
            v-model="vegSearch"
            type="text"
            class="veg-search-input"
            placeholder="Rechercher un légume…"
            autocomplete="off"
            @focus="showSuggestions = true"
            @blur="hideSuggestionsDelayed"
          />
          <button v-if="vegSearch" type="button" class="search-clear" @mousedown.prevent="clearSearch">✕</button>
          <ul v-if="showSuggestions && searchSuggestions.length > 0" class="veg-suggestions" role="listbox">
            <li
              v-for="item in searchSuggestions"
              :key="item.vegetableId"
              class="veg-suggestion-item"
              :class="{ 'suggestion-restricted': !item.compatible, 'suggestion-selected': store.assignmentForm.vegetableId === item.vegetableId }"
              role="option"
              @mousedown.prevent="selectFromSearch(item.vegetableId, item.vegetableName)"
            >
              <span class="suggestion-name">{{ item.vegetableName }}</span>
              <span class="suggestion-family">{{ item.familyName }}</span>
              <span v-if="!item.compatible" class="suggestion-warn">⚠</span>
              <span v-else class="suggestion-ok">✓</span>
            </li>
          </ul>
          <div v-else-if="showSuggestions && vegSearch.trim().length >= 1 && searchSuggestions.length === 0" class="veg-no-result">
            Aucun légume trouvé pour « {{ vegSearch.trim() }} »
          </div>
        </div>

        <!-- ── Légumes compatibles (mode plantation uniquement) ─────────── -->
        <section v-if="!harvestableEntry" class="panel-section">
          <button
            type="button"
            class="section-toggle"
            :class="{ open: showCompatible }"
            @click="showCompatible = !showCompatible"
          >
            <div class="section-toggle-left">
              <h4>Légumes compatibles</h4>
              <span class="count-chip count-ok">{{ store.plantableVegetables.length }}</span>
            </div>
            <span class="toggle-arrow">{{ showCompatible ? '▲' : '▼' }}</span>
          </button>

          <template v-if="showCompatible">
            <div v-if="store.vegetableGroups.length === 0 && occupyingEntry" class="occupied-banner">
              <p>
                <strong>{{ occupyingEntry.vegetableName }}</strong> occupe cette section
                jusqu'au <strong>{{ formatDate(occupyingEntry.endDate) }}</strong>.
              </p>
              <button type="button" class="btn-plant-after" @click="plantAfterOccupation">
                Planter à la suite →
              </button>
            </div>
            <div v-else-if="store.vegetableGroups.length === 0" class="inline-empty">
              Aucun légume compatible avec les règles de rotation pour cette section.
            </div>

            <div v-else class="vegetable-groups">
              <div
                v-for="group in store.vegetableGroups"
                :key="group.familyName"
                class="veg-group"
              >
                <div class="group-header">
                  <span class="family-name">{{ group.familyName }}</span>
                  <span v-if="group.neverPlanted" class="badge-never">Jamais planté ici</span>
                  <span v-else-if="group.lastPlantedDate" class="badge-date">
                    Dernier : {{ formatDate(group.lastPlantedDate) }}
                  </span>
                </div>
                <div class="veg-list">
                  <div
                    v-for="veg in group.vegetables"
                    :key="veg.vegetableId"
                    class="veg-item"
                  >
                    <button
                      type="button"
                      class="veg-btn"
                      :class="{
                        selected: store.assignmentForm.vegetableId === veg.vegetableId,
                        'veg-btn-assoc-warn': veg.associationWarning,
                      }"
                      :title="veg.associationWarning ? `Association déconseillée : ${veg.associationWarningReason}` : undefined"
                      @click="selectVegetable(veg.vegetableId)"
                    >
                      <span class="veg-btn-name">{{ veg.vegetableName }}</span>
                      <span v-if="veg.associationWarning" class="veg-badge-assoc" title="Association déconseillée">⚠</span>
                      <span v-else-if="veg.neverPlantedInSection" class="veg-badge-never">jamais planté</span>
                      <span v-else-if="veg.lastPlantedInSection" class="veg-badge-date">
                        {{ formatDate(veg.lastPlantedInSection) }}<template v-if="veg.lastQuantityPlanted"> · {{ veg.lastQuantityPlanted }} pl.</template>
                      </span>
                    </button>

                    <!-- Variétés inline — affichées dès que ce légume est sélectionné -->
                    <div
                      v-if="store.assignmentForm.vegetableId === veg.vegetableId"
                      class="veg-varieties"
                    >
                      <span v-if="varietiesLoading" class="varieties-loading">Chargement variétés…</span>
                      <template v-else>
                        <button
                          v-for="v in currentVarieties"
                          :key="v.id_variety"
                          type="button"
                          class="variety-chip"
                          :class="{ 'variety-chip-selected': store.assignmentForm.varietyIdentifier === v.variety_name }"
                          @click.stop="selectVariety(v.variety_name)"
                        >{{ v.variety_name }}</button>
                        <button
                          type="button"
                          class="variety-chip variety-chip-custom"
                          :class="{ 'variety-chip-selected': varietySelectValue === '__custom__' }"
                          @click.stop="selectVariety('__custom__')"
                        >Autre…</button>
                        <span v-if="currentVarieties.length === 0" class="varieties-none">Aucune variété enregistrée</span>
                      </template>
                      <input
                        v-if="varietySelectValue === '__custom__'"
                        v-model="store.assignmentForm.varietyIdentifier"
                        type="text"
                        class="variety-custom-inline"
                        placeholder="Saisir une variété…"
                        @click.stop
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>

        <!-- ── Légumes avec restrictions (mode plantation uniquement) ────── -->
        <section v-if="!harvestableEntry && incompatibleGroups.length > 0" class="panel-section panel-section-restricted">
          <button
            type="button"
            class="section-toggle"
            :class="{ open: showRestricted }"
            @click="showRestricted = !showRestricted"
          >
            <div class="section-title-row">
              <h4>Légumes avec restrictions</h4>
              <span class="count-chip count-warn">{{ incompatibleTotal }}</span>
            </div>
            <span class="toggle-arrow">{{ showRestricted ? '▲' : '▼' }}</span>
          </button>

          <div v-if="showRestricted" class="vegetable-groups restricted-groups">
            <p class="restricted-hint">
              Ces légumes violent une règle de rotation. Sélectionnez-en un pour connaître la raison, puis confirmez si vous souhaitez quand même planter.
            </p>
            <div
              v-for="group in incompatibleGroups"
              :key="group.familyId"
              class="veg-group"
            >
              <div class="group-header">
                <span class="family-name">{{ group.familyName }}</span>
                <span
                  class="importance-badge"
                  :class="group.importance === 'primaire' ? 'imp-primary' : 'imp-secondary'"
                >{{ group.importance }}</span>
              </div>
              <div class="veg-list">
                <button
                  v-for="veg in group.vegetables"
                  :key="veg.id_vegetable"
                  type="button"
                  class="veg-btn veg-btn-restricted"
                  :class="{ selected: store.assignmentForm.vegetableId === veg.id_vegetable }"
                  @click="selectVegetable(veg.id_vegetable)"
                >
                  <span class="veg-btn-name">{{ veg.vegetable_name }}</span>
                  <span class="warn-icon">⚠</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Message règle de rotation (mode plantation uniquement) ─────── -->
        <RotationRuleMessage
          v-if="!harvestableEntry && store.lastRuleMessage"
          :message="store.lastRuleMessage"
          class="panel-rule-msg"
        />

        <!-- ── Formulaire dates + détails (mode plantation uniquement) ─────── -->
        <section v-if="!harvestableEntry && store.assignmentForm.vegetableId !== null" class="panel-section">
          <h4>Détails de la plantation</h4>
          <div class="form-grid">
            <div class="form-field">
              <label for="start-date">Date de début *</label>
              <input
                id="start-date"
                v-model="store.assignmentForm.startDate"
                type="date"
                required
              />
            </div>
            <div class="form-field">
              <label for="end-date">Date de fin *</label>
              <input
                id="end-date"
                v-model="store.assignmentForm.endDate"
                type="date"
                :min="store.assignmentForm.startDate"
                required
              />
            </div>
            <!-- Sélection de variété — toujours visible dès qu'un légume est choisi -->
            <div class="form-field form-field-full">
              <label>Variété</label>
              <span v-if="varietiesLoading" class="variety-loading">Chargement des variétés…</span>
              <template v-else>
                <div class="variety-chips-row">
                  <button
                    v-for="v in currentVarieties"
                    :key="v.id_variety"
                    type="button"
                    class="variety-chip"
                    :class="{ 'variety-chip-selected': store.assignmentForm.varietyIdentifier === v.variety_name }"
                    @click.stop="selectVariety(v.variety_name)"
                  >{{ v.variety_name }}</button>
                  <button
                    type="button"
                    class="variety-chip variety-chip-custom"
                    :class="{ 'variety-chip-selected': varietySelectValue === '__custom__' }"
                    @click.stop="selectVariety('__custom__')"
                  >Autre…</button>
                  <span v-if="currentVarieties.length === 0 && varietySelectValue !== '__custom__'" class="varieties-none">
                    Aucune variété — sera plantée sans variété
                  </span>
                </div>
                <input
                  v-if="varietySelectValue === '__custom__'"
                  v-model="store.assignmentForm.varietyIdentifier"
                  type="text"
                  class="variety-custom-inline"
                  placeholder="Saisir une variété…"
                />
              </template>
            </div>
            <div class="form-field">
              <label for="qty">Quantité</label>
              <div class="qty-row">
                <input
                  id="qty"
                  v-model.number="store.assignmentForm.quantityPlanted"
                  type="number"
                  min="0"
                  class="qty-input"
                  :class="{ 'qty-input-over': availableStock !== null && (store.assignmentForm.quantityPlanted ?? 0) > availableStock }"
                />
                <select v-model="store.assignmentForm.unity" class="qty-unit">
                  <option value="kg">kg</option>
                  <option value="pièces">pièces</option>
                  <option value="plants">plants</option>
                  <option value="bottes">bottes</option>
                  <option value="graines">graines</option>
                </select>
              </div>
              <!-- Indicateur de stock -->
              <div v-if="availableStock !== null && availableStock > 0" class="stock-info">
                📦 Stock disponible : <strong>{{ availableStock }}</strong> {{ store.assignmentForm.unity }}
                <span v-if="(store.assignmentForm.quantityPlanted ?? 0) > availableStock" class="stock-over-hint"> — insuffisant ⚠</span>
              </div>
              <div v-else-if="availableStock === 0 && store.assignmentForm.vegetableId" class="stock-info stock-info-empty">
                📦 Aucun stock enregistré pour ce légume
              </div>
            </div>
          </div>
        </section>

        <!-- ── Déclarer la récolte ───────────────────────────────────────── -->
        <section v-if="harvestableEntry" class="panel-section panel-section-harvest">
          <button type="button" class="section-toggle-header harvest-header" @click="harvestOpen = !harvestOpen">
            <span class="harvest-icon">🌾</span>
            <div>
              <h4>Déclarer la récolte</h4>
              <p class="harvest-sub">
                <strong>{{ harvestableEntry.vegetableName }}</strong>
                <span v-if="harvestableEntry.varietyName"> — {{ harvestableEntry.varietyName }}</span>
              </p>
            </div>
            <span v-if="harvestDone && !harvestOpen" class="section-done-badge">✓ Récoltée</span>
            <span class="section-toggle-chevron" :class="{ open: harvestOpen }">›</span>
          </button>

          <template v-if="harvestOpen">
          <div class="form-grid">
            <div class="form-field">
              <label for="harvest-date">Date de récolte *</label>
              <input
                id="harvest-date"
                v-model="harvestForm.date"
                type="date"
                :max="todayIso"
                required
              />
            </div>
            <div class="form-field">
              <label for="harvest-qty">Quantité récoltée *</label>
              <input
                id="harvest-qty"
                v-model.number="harvestForm.quantity"
                type="number"
                min="1"
                placeholder="ex: 12"
                required
              />
            </div>
            <div class="form-field form-field-full">
              <label for="harvest-unit">Unité</label>
              <select id="harvest-unit" v-model="harvestForm.unit" class="variety-select">
                <option value="kg">kg</option>
                <option value="pièces">pièces</option>
                <option value="bottes">bottes</option>
                <option value="sachets">sachets</option>
                <option value="cageots">cageots</option>
              </select>
            </div>
          </div>

          <p v-if="harvestStore.error" class="harvest-error">{{ harvestStore.error }}</p>

          <button
            type="button"
            class="harvest-confirm-btn"
            :disabled="!isHarvestFormValid || harvestStore.loading"
            @click="confirmHarvest"
          >
            {{ harvestStore.loading ? 'Enregistrement…' : 'Confirmer la récolte' }}
          </button>

          <div v-if="!auth.isStagiaire" class="cancel-section-block">
            <p v-if="cancelError" class="cancel-error">{{ cancelError }}</p>
            <template v-if="cancelConfirming">
              <p class="cancel-confirm-text">Confirmer la suppression de cette culture ? Cette action est irréversible.</p>
              <div class="cancel-confirm-actions">
                <button type="button" class="cancel-section-btn" :disabled="cancelLoading" @click="cancelSection">
                  {{ cancelLoading ? 'Annulation…' : 'Oui, supprimer' }}
                </button>
                <button type="button" class="cancel-confirm-abort" @click="cancelConfirming = false">
                  Non, garder
                </button>
              </div>
            </template>
            <button v-else type="button" class="cancel-section-btn" @click="cancelConfirming = true">
              Annuler cette culture
            </button>
          </div>
          </template>
        </section>

        <!-- ── Fertilisation ────────────────────────────────────────────── -->
        <section class="panel-section panel-section-fertil">
          <button type="button" class="section-toggle-header fertil-header" @click="fertilOpen = !fertilOpen">
            <span class="fertil-icon">🌱</span>
            <h4>Fertiliser</h4>
            <span v-if="fertilDone && !fertilOpen" class="section-done-badge">✓ Appliqué</span>
            <span class="section-toggle-chevron" :class="{ open: fertilOpen }">›</span>
          </button>

          <template v-if="fertilOpen">
            <div class="water-scope">
              <label class="scope-option">
                <input type="radio" v-model="fertilScope" value="board" />
                Planche entière
                <span class="scope-name scope-name-fertil">{{ store.openSection!.boardName }}</span>
              </label>
              <label v-if="currentSole" class="scope-option">
                <input type="radio" v-model="fertilScope" value="sole" />
                Sole entière
                <span class="scope-name scope-name-fertil">{{ currentSole.sole_name }}</span>
              </label>
            </div>

            <div class="form-grid" style="margin-top: 0.65rem;">
              <div class="form-field form-field-full">
                <label for="fertil-type">Type d'amendement *</label>
                <select id="fertil-type" v-model="fertilCatalogueId" class="variety-select">
                  <option value="">— Choisir —</option>
                  <option
                    v-for="item in amendementStore.catalogue"
                    :key="item.id_amendement"
                    :value="item.id_amendement"
                  >{{ item.amendment_name }}</option>
                </select>
              </div>
              <div class="form-field">
                <label for="fertil-date">Date *</label>
                <input id="fertil-date" v-model="fertilDate" type="date" :max="todayIso" />
              </div>
              <div class="form-field">
                <label for="fertil-qty">Quantité</label>
                <input id="fertil-qty" v-model.number="fertilQty" type="number" min="0" placeholder="ex: 2" />
              </div>
              <div class="form-field form-field-full">
                <label for="fertil-unit">Unité</label>
                <select id="fertil-unit" v-model="fertilUnit" class="variety-select">
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="g">g</option>
                  <option value="mL">mL</option>
                  <option value="sacs">sacs</option>
                </select>
              </div>
              <div class="form-field form-field-full">
                <label for="fertil-desc">Description</label>
                <input id="fertil-desc" v-model="fertilDesc" type="text" placeholder="ex: Appliqué en surface…" />
              </div>
            </div>

            <p v-if="amendementStore.submitError" class="water-error">{{ amendementStore.submitError }}</p>

            <button
              type="button"
              class="fertil-btn"
              :disabled="amendementStore.submitting || !fertilCatalogueId"
              @click="doFertil"
            >
              {{ amendementStore.submitting ? 'Enregistrement…' : 'Appliquer la fertilisation' }}
            </button>
          </template>
        </section>

        <!-- ── Traitement ─────────────────────────────────────────────────── -->
        <section class="panel-section panel-section-treat">
          <button type="button" class="section-toggle-header treat-header" @click="treatOpen = !treatOpen">
            <span class="treat-icon">🧪</span>
            <h4>Traiter</h4>
            <span v-if="treatDone && !treatOpen" class="section-done-badge">✓ Appliqué</span>
            <span class="section-toggle-chevron" :class="{ open: treatOpen }">›</span>
          </button>

          <template v-if="treatOpen">
          <div class="water-scope">
            <label class="scope-option">
              <input type="radio" v-model="treatScope" value="board" />
              Planche entière
              <span class="scope-name scope-name-treat">{{ store.openSection!.boardName }}</span>
            </label>
            <label v-if="currentSole" class="scope-option">
              <input type="radio" v-model="treatScope" value="sole" />
              Sole entière
              <span class="scope-name scope-name-treat">{{ currentSole.sole_name }}</span>
            </label>
          </div>

          <div class="form-grid" style="margin-top: 0.65rem;">
            <div class="form-field form-field-full">
              <label for="treat-type">Type de traitement *</label>
              <select id="treat-type" v-model="treatCatalogueId" class="variety-select">
                <option value="">— Choisir —</option>
                <option
                  v-for="item in treatmentStore.catalogue"
                  :key="item.id_treatment"
                  :value="item.id_treatment"
                >{{ item.treatment_name }}</option>
              </select>
            </div>
            <div class="form-field">
              <label for="treat-date">Date *</label>
              <input id="treat-date" v-model="treatDate" type="date" :max="todayIso" />
            </div>
            <div class="form-field">
              <label for="treat-qty">Quantité</label>
              <input id="treat-qty" v-model.number="treatQty" type="number" min="0" placeholder="ex: 5" />
            </div>
            <div class="form-field form-field-full">
              <label for="treat-unit">Unité</label>
              <select id="treat-unit" v-model="treatUnit" class="variety-select">
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
              </select>
            </div>
            <div class="form-field form-field-full">
              <label for="treat-desc">Notes</label>
              <input id="treat-desc" v-model="treatDesc" type="text" placeholder="ex: Dilué à 2%…" />
            </div>
          </div>

          <p v-if="treatmentStore.submitError" class="water-error">{{ treatmentStore.submitError }}</p>

          <button
            type="button"
            class="treat-btn"
            :disabled="treatmentStore.submitting || !treatCatalogueId"
            @click="doTreat"
          >
            {{ treatmentStore.submitting ? 'Enregistrement…' : 'Appliquer le traitement' }}
          </button>
          </template>
        </section>

        <!-- ── Arrosage ──────────────────────────────────────────────────── -->
        <section class="panel-section panel-section-water">
          <button type="button" class="section-toggle-header water-header" @click="waterOpen = !waterOpen">
            <span class="water-icon">💧</span>
            <h4>Arroser</h4>
            <span v-if="waterDone && !waterOpen" class="section-done-badge">✓ Arrosé</span>
            <span class="section-toggle-chevron" :class="{ open: waterOpen }">›</span>
          </button>

          <template v-if="waterOpen">
          <div class="water-scope">
            <label class="scope-option" :class="{ 'scope-disabled': !harvestableEntry }">
              <input type="radio" v-model="waterScope" value="section" :disabled="!harvestableEntry" />
              Cette section
              <span v-if="!harvestableEntry" class="scope-hint">(aucune culture active)</span>
            </label>
            <label class="scope-option">
              <input type="radio" v-model="waterScope" value="board" />
              Planche entière
              <span class="scope-name">{{ store.openSection!.boardName }}</span>
            </label>
            <label v-if="currentSole" class="scope-option">
              <input type="radio" v-model="waterScope" value="sole" />
              Sole entière
              <span class="scope-name">{{ currentSole.sole_name }}</span>
            </label>
          </div>

          <div class="form-field water-datetime-field">
            <label for="water-datetime">Date et heure</label>
            <input
              id="water-datetime"
              v-model="waterDatetime"
              type="datetime-local"
              :max="nowLocalDatetime()"
            />
          </div>

          <p v-if="wateringStore.submitError" class="water-error">{{ wateringStore.submitError }}</p>

          <button
            type="button"
            class="water-btn"
            :disabled="wateringStore.submitting || (waterScope === 'section' && !harvestableEntry)"
            @click="doWater"
          >
            {{ wateringStore.submitting ? 'Arrosage en cours…' : 'Arroser maintenant' }}
          </button>

          <template v-if="waterScope === 'section' && harvestableEntry">
            <div v-if="wateringStore.sectionLoading" class="water-recent-loading">Chargement…</div>
            <template v-else-if="wateringStore.sectionWaterings.length > 0">
              <p class="water-recent-title">Derniers arrosages</p>
              <ul class="water-recent-list">
                <li
                  v-for="w in wateringStore.sectionWaterings.slice(0, 5)"
                  :key="w.id_watering"
                  class="water-recent-item"
                >
                  {{ formatDatetime(w.watering_date) }}
                </li>
              </ul>
            </template>
            <p v-else class="water-recent-empty">Aucun arrosage enregistré pour cette section.</p>
          </template>
          </template>
        </section>

        <!-- ── Succès récolte ────────────────────────────────────────────── -->
        <div v-if="harvestSuccess" class="planting-success-banner harvest-success-banner">
          <span class="success-icon">🌾</span>
          <div>
            <strong>Récolte enregistrée !</strong>
            <p>La récolte a bien été sauvegardée. Fermeture…</p>
          </div>
        </div>

        <!-- ── Succès fertilisation ──────────────────────────────────────── -->
        <div v-if="fertilSuccess" class="planting-success-banner fertil-success-banner">
          <span class="success-icon">🌱</span>
          <div>
            <strong>Fertilisation appliquée !</strong>
            <p>L'amendement a bien été enregistré. Fermeture…</p>
          </div>
        </div>

        <!-- ── Succès traitement ─────────────────────────────────────────── -->
        <div v-if="treatSuccess" class="planting-success-banner treat-success-banner">
          <span class="success-icon">🧪</span>
          <div>
            <strong>Traitement appliqué !</strong>
            <p>Le traitement a bien été enregistré. Fermeture…</p>
          </div>
        </div>

        <!-- ── Succès arrosage ───────────────────────────────────────────── -->
        <div v-if="waterSuccess" class="planting-success-banner water-success-banner">
          <span class="success-icon">💧</span>
          <div>
            <strong>Arrosage enregistré !</strong>
            <p>L'arrosage a bien été enregistré. Fermeture…</p>
          </div>
        </div>

        <!-- ── Succès plantation ─────────────────────────────────────────── -->
        <div v-if="plantingSuccess" class="planting-success-banner">
          <span class="success-icon">✅</span>
          <div>
            <strong>Culture enregistrée !</strong>
            <p>La plantation a bien été sauvegardée. Fermeture…</p>
          </div>
        </div>

        <!-- ── Avertissement stock insuffisant ──────────────────────────────── -->
        <div v-if="stockWarningVisible" class="stock-warning-banner">
          <div class="stock-warning-header">
            <span class="stock-warning-emoji">⚠️</span>
            <strong>Stock insuffisant</strong>
          </div>
          <p class="stock-warning-text">
            Stock disponible : <strong>{{ availableStock }} {{ store.assignmentForm.unity }}</strong><br>
            Vous souhaitez planter <strong>{{ store.assignmentForm.quantityPlanted }} {{ store.assignmentForm.unity }}</strong>.
          </p>
          <div class="stock-warning-actions">
            <button
              v-if="availableStock && availableStock > 0"
              type="button"
              class="primary-button"
              :disabled="store.assignmentLoading"
              @click="proceedWithReducedQty"
            >
              Planter {{ availableStock }} {{ store.assignmentForm.unity }}
            </button>
            <button type="button" class="secondary-button" @click="cancelStockWarning">
              Annuler
            </button>
          </div>
        </div>

        <!-- ── Actions ────────────────────────────────────────────────────── -->
        <footer class="panel-footer">
          <!-- Mode plantation uniquement -->
          <template v-if="!harvestableEntry">
            <!-- Confirmation normale (légume compatible) -->
            <button
              v-if="canConfirmNormal"
              type="button"
              class="primary-button"
              :disabled="store.assignmentLoading"
              @click="handleConfirm(false)"
            >
              {{ store.assignmentLoading ? 'Enregistrement…' : 'Confirmer la plantation' }}
            </button>

            <!-- Bypass : légume avec restriction, non-stagiaire -->
            <button
              v-if="canBypass"
              type="button"
              class="warning-button"
              :disabled="store.assignmentLoading"
              @click="handleConfirm(true)"
            >
              {{ store.assignmentLoading ? 'Enregistrement…' : 'Planter quand même' }}
            </button>
          </template>

          <button
            type="button"
            class="secondary-button"
            @click="store.closeSectionPanel()"
          >
            Fermer
          </button>
        </footer>

      </template>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, toRef } from 'vue';
import { usePlanningStore } from '@/stores/planning';
import { useAuthStore } from '@/stores/auth';
import { useBotanicalStore } from '@/stores/botanical';
import { useHarvestStore } from '@/stores/harvest';
import { useWateringStore } from '@/stores/watering';
import { useAmendementStore } from '@/stores/amendement';
import { useTreatmentStore } from '@/stores/treatment';
import { usePlantManagementStore } from '@/stores/plantManagement';
import { rotationsApi } from '@/api/rotations';
import RotationRuleMessage from './RotationRuleMessage.vue';

const store = usePlanningStore();
const auth = useAuthStore();
const botanical = useBotanicalStore();
const harvestStore = useHarvestStore();
const wateringStore = useWateringStore();
const amendementStore = useAmendementStore();
const treatmentStore = useTreatmentStore();
const plantStore = usePlantManagementStore();

const showRestricted = ref(false);
const showCompatible = ref(false);

// ── Recherche ────────────────────────────────────────────────────────────────
const vegSearch = ref('');
const showSuggestions = ref(false);
const searchInputEl = ref<HTMLInputElement | null>(null);

const searchSuggestions = computed(() => {
  const q = vegSearch.value.trim().toLowerCase();
  if (q.length < 1) return [];

  const results: Array<{
    vegetableId: number;
    vegetableName: string;
    familyName: string;
    compatible: boolean;
  }> = [];

  for (const veg of store.plantableVegetables) {
    if (
      veg.vegetableName.toLowerCase().includes(q) ||
      veg.familyName.toLowerCase().includes(q)
    ) {
      results.push({
        vegetableId: veg.vegetableId,
        vegetableName: veg.vegetableName,
        familyName: veg.familyName,
        compatible: true,
      });
    }
  }

  for (const group of incompatibleGroups.value) {
    for (const veg of group.vegetables) {
      if (
        veg.vegetable_name.toLowerCase().includes(q) ||
        group.familyName.toLowerCase().includes(q)
      ) {
        results.push({
          vegetableId: veg.id_vegetable,
          vegetableName: veg.vegetable_name,
          familyName: group.familyName,
          compatible: false,
        });
      }
    }
  }

  return results;
});

async function selectFromSearch(id: number, name: string) {
  vegSearch.value = name;
  showSuggestions.value = false;
  await selectVegetable(id);
}

function clearSearch() {
  vegSearch.value = '';
  showSuggestions.value = false;
  searchInputEl.value?.focus();
}

function selectVariety(name: string) {
  varietySelectValue.value = name;
  store.assignmentForm.varietyIdentifier = name === '__custom__' ? '' : name;
}

function hideSuggestionsDelayed() {
  setTimeout(() => { showSuggestions.value = false; }, 180);
}

// ── Variétés ─────────────────────────────────────────────────────────────────
const varietiesLoading = ref(false);
const currentVarieties = ref<Array<{ id_variety: number; variety_name: string }>>([]);
const varietySelectValue = ref('');

watch(
  () => store.assignmentForm.vegetableId,
  async (id) => {
    currentVarieties.value = [];
    varietySelectValue.value = '';
    store.assignmentForm.varietyIdentifier = '';
    if (!id) return;
    const cached = botanical.varietiesMap[id];
    if (cached) {
      currentVarieties.value = cached;
      return;
    }
    varietiesLoading.value = true;
    await botanical.loadVarieties(id);
    currentVarieties.value = botanical.varietiesMap[id] ?? [];
    varietiesLoading.value = false;
  },
);

function onVarietyChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value;
  varietySelectValue.value = val;
  if (val !== '__custom__') {
    store.assignmentForm.varietyIdentifier = val;
  } else {
    store.assignmentForm.varietyIdentifier = '';
  }
}

// Date minimale pour le champ date de début : aujourd'hui
const todayIso = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

// Culture qui occupe actuellement la section pendant les dates du formulaire
const occupyingEntry = computed(() => {
  if (!store.openSection) return null;
  const { boardId, sectionNumber } = store.openSection;
  const { startDate, endDate } = store.assignmentForm;
  if (!startDate || !endDate) return null;
  return (
    store.culturePlan.find(
      (e) =>
        e.boardId === boardId &&
        e.sectionNumber === sectionNumber &&
        e.startDate <= endDate &&
        e.endDate >= startDate,
    ) ?? null
  );
});

// Décale la date de début au lendemain de la fin de la culture occupante
function plantAfterOccupation() {
  if (!occupyingEntry.value) return;
  const next = new Date(occupyingEntry.value.endDate);
  next.setUTCDate(next.getUTCDate() + 1);
  const iso = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
  store.assignmentForm.startDate = iso;
  // La date de fin = startDate + 90 jours (le watch rechargera la liste)
  const end = new Date(next);
  end.setDate(end.getDate() + 90);
  store.assignmentForm.endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
}

// IDs of compatible vegetables
const compatibleIds = computed(() =>
  new Set(store.plantableVegetables.map((v) => v.vegetableId)),
);

// All botanical vegetables NOT in the compatible list, grouped by family
const incompatibleGroups = computed(() =>
  botanical.families
    .map((f) => ({
      familyId: f.id_family,
      familyName: f.family_name,
      importance: f.family_importance?.importance_name ?? '',
      vegetables: (f.vegetables ?? []).filter(
        (v) => !compatibleIds.value.has(v.id_vegetable),
      ),
    }))
    .filter((g) => g.vegetables.length > 0),
);

const incompatibleTotal = computed(() =>
  incompatibleGroups.value.reduce((sum, g) => sum + g.vegetables.length, 0),
);

const isFormValid = computed(() => {
  const f = store.assignmentForm;
  return (
    f.vegetableId !== null &&
    !!f.startDate &&
    !!f.endDate &&
    f.startDate <= f.endDate
  );
});

// Confirm without bypass: form valid + no blocking rule + section récoltée
const canConfirmNormal = computed(
  () =>
    isFormValid.value &&
    (store.lastRuleMessage?.canProceed ?? true) &&
    !harvestableEntry.value,
);

// Bypass: form valid + blocking warning exists + user is not stagiaire + section récoltée
const canBypass = computed(
  () =>
    isFormValid.value &&
    store.lastRuleMessage?.needsBypass === true &&
    !auth.isStagiaire &&
    !harvestableEntry.value,
);

async function loadPanelData() {
  if (harvestableEntry.value?.sectionId) {
    wateringStore.loadBySection(harvestableEntry.value.sectionId);
  }
  if (harvestableEntry.value) return;
  const botanicalPromise =
    botanical.families.length === 0 ? botanical.loadAll() : Promise.resolve();
  await Promise.all([botanicalPromise, store.loadPlantableVegetables()]);
  if (store.assignmentForm.vegetableId !== null) {
    await store.checkVegetableCompatibility(store.assignmentForm.vegetableId);
  }
}

onMounted(() => {
  loadPanelData();
  amendementStore.loadCatalogue();
  treatmentStore.loadCatalogue();
  // Charger le stock si pas encore fait
  if (plantStore.stock.length === 0) plantStore.loadStock();
});

watch(toRef(store, 'openSection'), (newSection, oldSection) => {
  if (!newSection) return;
  if (newSection.boardId !== oldSection?.boardId || newSection.sectionNumber !== oldSection?.sectionNumber) {
    loadPanelData();
  }
});

watch(
  () =>
    [
      store.assignmentForm.startDate,
      store.assignmentForm.endDate,
      store.assignmentForm.vegetableId,
    ] as const,
  async ([startDate, endDate, vegetableId], previous) => {
    if (!startDate || !endDate || startDate > endDate) return;

    if (
      previous &&
      startDate === previous[0] &&
      endDate === previous[1] &&
      vegetableId === previous[2]
    ) {
      return;
    }

    const datesChanged =
      !previous || startDate !== previous[0] || endDate !== previous[1];

    if (vegetableId === null) {
      // Les dates ont changé sans légume sélectionné : recharger la liste compatible
      if (datesChanged) await store.loadPlantableVegetables();
      return;
    }

    // Un légume est sélectionné : vérifier la compatibilité (rechargement de liste si dates changées)
    if (datesChanged) await store.loadPlantableVegetables();
    await store.checkVegetableCompatibility(vegetableId);
  },
);

async function selectVegetable(id: number) {
  await store.checkVegetableCompatibility(id);
}

// ── Récolte ──────────────────────────────────────────────────────────────────

// En mode plantation (slot disponible cliqué), on n'expose jamais de culture récoltable.
// En mode récolte (barre occupée cliquée), on cherche la culture active.
const harvestableEntry = computed(() => {
  if (!store.openSection) return null;
  if (store.openSection.plantingMode) return null;
  const { harvestSectionId } = store.openSection;
  if (harvestSectionId !== undefined) {
    return store.culturePlan.find((e) => e.sectionId === harvestSectionId) ?? null;
  }
  const { boardId, sectionNumber } = store.openSection;
  return (
    store.culturePlan.find(
      (e) =>
        e.boardId === boardId &&
        e.sectionNumber === sectionNumber &&
        !e.isHarvested,
    ) ?? null
  );
});

const harvestOpen = ref(true);
const harvestDone = ref(false);
const harvestSuccess = ref(false);

const harvestForm = ref({
  date: todayIso,
  quantity: 0,
  unit: 'kg',
});

const isHarvestFormValid = computed(
  () => harvestForm.value.date.length > 0 && harvestForm.value.quantity > 0,
);

async function confirmHarvest() {
  if (!harvestableEntry.value || !auth.user) return;
  await harvestStore.createHarvest({
    sectionId: harvestableEntry.value.sectionId,
    harvestDate: harvestForm.value.date,
    quantity: harvestForm.value.quantity,
    unit: harvestForm.value.unit,
    userId: auth.user.id,
  });
  if (!harvestStore.error) {
    harvestOpen.value = false;
    harvestDone.value = true;
    harvestSuccess.value = true;
    await store.loadCulturePlan();
    setTimeout(() => store.closeSectionPanel(), 2000);
  }
}

// ── Annulation de culture ─────────────────────────────────────────────────────

const cancelError = ref<string | null>(null);
const cancelLoading = ref(false);
const cancelConfirming = ref(false);

async function cancelSection() {
  if (!harvestableEntry.value) return;
  cancelLoading.value = true;
  cancelError.value = null;
  try {
    await rotationsApi.cancelSection(harvestableEntry.value.sectionId);
    await store.loadCulturePlan();
    store.closeSectionPanel();
  } catch {
    cancelError.value = 'Impossible d\'annuler cette culture.';
    cancelConfirming.value = false;
  } finally {
    cancelLoading.value = false;
  }
}

// ── Arrosage ─────────────────────────────────────────────────────────────────

const waterOpen = ref(true);
const waterDone = ref(false);
const waterSuccess = ref(false);

function nowLocalDatetime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const waterScope = ref<'section' | 'board' | 'sole'>('section');
const waterDatetime = ref(nowLocalDatetime());

const currentSole = computed(() => {
  if (!store.openSection) return null;
  return store.soles.find((s) => s.boards.some((b) => b.id_board === store.openSection!.boardId)) ?? null;
});

async function doWater() {
  if (!store.openSection) return;
  const datetime = waterDatetime.value;
  if (waterScope.value === 'section' && harvestableEntry.value) {
    await wateringStore.waterSection(harvestableEntry.value.sectionId, datetime);
  } else if (waterScope.value === 'board') {
    await wateringStore.waterBulk({ datetime, boardId: store.openSection.boardId });
  } else if (waterScope.value === 'sole' && currentSole.value) {
    await wateringStore.waterBulk({ datetime, soleId: currentSole.value.id_sole });
  }
  if (!wateringStore.submitError) {
    waterOpen.value = false;
    waterDone.value = true;
    waterSuccess.value = true;
    if (waterScope.value === 'section' && harvestableEntry.value) {
      await wateringStore.loadBySection(harvestableEntry.value.sectionId);
    }
    setTimeout(() => store.closeSectionPanel(), 2000);
  }
}

// ── Fertilisation ────────────────────────────────────────────────────────────

const fertilOpen = ref(true);
const fertilDone = ref(false);
const fertilSuccess = ref(false);
const fertilScope = ref<'board' | 'sole'>('board');
const fertilCatalogueId = ref<number | ''>('');
const fertilDate = ref(todayIso);
const fertilQty = ref<number | undefined>(undefined);
const fertilUnit = ref('kg');
const fertilDesc = ref('');

async function doFertil() {
  if (!store.openSection || !fertilCatalogueId.value) return;
  const date = fertilDate.value;
  const catalogueId = Number(fertilCatalogueId.value);
  const payload = {
    date,
    catalogueId,
    quantity: fertilQty.value,
    unit: fertilUnit.value,
    description: fertilDesc.value || undefined,
  };
  if (fertilScope.value === 'board') {
    await amendementStore.applyToBoard({ ...payload, boardId: store.openSection.boardId });
  } else if (fertilScope.value === 'sole' && currentSole.value) {
    await amendementStore.applyToSole({ ...payload, soleId: currentSole.value.id_sole });
  }
  if (!amendementStore.submitError) {
    fertilDesc.value = '';
    fertilQty.value = undefined;
    fertilOpen.value = false;
    fertilDone.value = true;
    fertilSuccess.value = true;
    setTimeout(() => store.closeSectionPanel(), 2000);
  }
}

// ── Traitement ───────────────────────────────────────────────────────────────

const treatOpen = ref(true);
const treatDone = ref(false);
const treatSuccess = ref(false);
const treatScope = ref<'board' | 'sole'>('board');
const treatCatalogueId = ref<number | ''>('');
const treatDate = ref(todayIso);
const treatQty = ref<number | undefined>(undefined);
const treatUnit = ref('L');
const treatDesc = ref('');

async function doTreat() {
  if (!store.openSection || !treatCatalogueId.value) return;
  const date = treatDate.value;
  const catalogueId = Number(treatCatalogueId.value);
  const payload = {
    date,
    catalogueId,
    quantity: treatQty.value,
    unit: treatUnit.value,
    description: treatDesc.value || undefined,
  };
  if (treatScope.value === 'board') {
    await treatmentStore.applyToBoard({ ...payload, boardId: store.openSection.boardId });
  } else if (treatScope.value === 'sole' && currentSole.value) {
    await treatmentStore.applyToSole({ ...payload, soleId: currentSole.value.id_sole });
  }
  if (!treatmentStore.submitError) {
    treatDesc.value = '';
    treatQty.value = undefined;
    treatOpen.value = false;
    treatDone.value = true;
    treatSuccess.value = true;
    setTimeout(() => store.closeSectionPanel(), 2000);
  }
}

function formatDatetime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const plantingSuccess = ref(false);

// ── Stock warning ─────────────────────────────────────────────────────────────

// Stock disponible pour le légume sélectionné (toutes variétés confondues)
const availableStock = computed(() => {
  const vegId = store.assignmentForm.vegetableId;
  if (!vegId) return null;
  return plantStore.stockByVegetable.get(vegId) ?? 0;
});

const stockWarningVisible = ref(false);
let pendingBypass = false;

function handleConfirm(bypass: boolean) {
  const qty = store.assignmentForm.quantityPlanted ?? 0;
  const avail = availableStock.value;
  if (qty > 0 && avail !== null && qty > avail) {
    pendingBypass = bypass;
    stockWarningVisible.value = true;
    return;
  }
  confirm(bypass);
}

async function proceedWithReducedQty() {
  store.assignmentForm.quantityPlanted = availableStock.value ?? 0;
  stockWarningVisible.value = false;
  await confirm(pendingBypass);
}

function cancelStockWarning() {
  stockWarningVisible.value = false;
}

async function confirm(bypass: boolean) {
  const ok = await store.submitAssignment(bypass);
  if (ok) {
    plantingSuccess.value = true;
    setTimeout(() => store.closeSectionPanel(), 2000);
  }
}
</script>

<style scoped>
.side-panel-overlay {
  position: fixed;
  inset: 0;
  padding: 1rem;
  background: rgba(17, 27, 22, 0.42);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.side-panel {
  width: min(520px, 100vw);
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.98), rgba(248, 242, 231, 0.94));
  display: flex;
  flex-direction: column;
  box-shadow: -18px 0 54px rgba(26, 34, 28, 0.18);
  overflow-y: auto;
  border-left: 1px solid rgba(39, 65, 53, 0.08);
  border-radius: 28px 0 0 28px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.08);
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.98), rgba(248, 242, 231, 0.94));
  z-index: 1;
  backdrop-filter: blur(14px);
}

.panel-eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: var(--brand-clay);
  margin: 0 0 0.25rem;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  color: var(--brand-deep);
  line-height: 1.1;
}

.close-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(39, 65, 53, 0.08);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 999px;
  font-size: 1.05rem;
  cursor: pointer;
  color: var(--brand-deep);
  padding: 0;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
  transition: transform 160ms ease, background 160ms ease;
}

.close-btn:hover {
  transform: translateY(-1px);
  background: rgba(39, 65, 53, 0.12);
}

.panel-section {
  padding: 1rem 1.25rem 1.15rem;
  margin: 0 1rem 1rem;
  border-radius: 22px;
  border: 1px solid rgba(39, 65, 53, 0.08);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-soft);
}

.panel-section-restricted {
  border-color: rgba(200, 130, 30, 0.25);
  background: rgba(255, 248, 235, 0.72);
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.panel-section h4,
.section-toggle h4 {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--brand-clay);
  margin: 0;
}

.count-chip {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
}

.count-ok {
  background: rgba(74, 103, 65, 0.12);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.2);
}

.count-warn {
  background: rgba(200, 130, 30, 0.12);
  color: #a05a10;
  border: 1px solid rgba(200, 130, 30, 0.25);
}

.section-toggle-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* Toggle button for restricted section */
.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.toggle-arrow {
  font-size: 0.7rem;
  color: rgba(39, 65, 53, 0.45);
  flex-shrink: 0;
}

.restricted-hint {
  font-size: 0.8rem;
  color: rgba(39, 65, 53, 0.65);
  line-height: 1.5;
  margin: 0.5rem 0 0.75rem;
  padding: 0.6rem 0.85rem;
  background: rgba(200, 130, 30, 0.07);
  border-radius: 12px;
  border: 1px solid rgba(200, 130, 30, 0.18);
}

.panel-loading,
.panel-empty {
  padding: 2rem 1.5rem;
  margin: 1rem;
  color: var(--text-muted);
  text-align: center;
  border-radius: 22px;
  border: 1px dashed rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-soft);
}

.inline-empty {
  padding: 0.85rem;
  font-size: 0.84rem;
  color: rgba(39, 65, 53, 0.55);
  text-align: center;
  border-radius: 12px;
  border: 1px dashed rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.5);
}

.occupied-banner {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(200, 130, 30, 0.28);
  background: rgba(255, 248, 230, 0.85);
  font-size: 0.86rem;
  color: rgba(39, 65, 53, 0.82);
}

.occupied-banner p { margin: 0; line-height: 1.5; }

.btn-plant-after {
  align-self: flex-start;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1.5px solid rgba(74, 103, 65, 0.3);
  background: rgba(255, 255, 255, 0.85);
  color: var(--brand-deep);
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 160ms, border-color 160ms;
}

.btn-plant-after:hover {
  background: rgba(74, 103, 65, 0.1);
  border-color: rgba(74, 103, 65, 0.45);
}

.panel-rule-msg {
  margin: 0 1rem 0.75rem;
}

/* Vegetable groups */
.vegetable-groups {
  display: grid;
  gap: 1rem;
  margin-top: 0.75rem;
}

.restricted-groups {
  gap: 0.75rem;
  margin-top: 0;
}

.veg-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.family-name {
  font-weight: 800;
  font-size: 0.86rem;
  color: var(--brand-deep);
}

.badge-never {
  font-size: 0.68rem;
  background: rgba(74, 103, 65, 0.12);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.2);
  border-radius: 99px;
  padding: 0.1rem 0.5rem;
}

.badge-date {
  font-size: 0.7rem;
  color: rgba(39, 65, 53, 0.7);
}

.importance-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.imp-primary {
  background: rgba(200, 130, 30, 0.12);
  color: #a05a10;
  border: 1px solid rgba(200, 130, 30, 0.25);
}

.imp-secondary {
  background: rgba(39, 65, 53, 0.07);
  color: rgba(39, 65, 53, 0.6);
  border: 1px solid rgba(39, 65, 53, 0.12);
}

.veg-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.veg-item {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.veg-item .veg-btn {
  width: 100%;
  border-radius: 10px;
}

.veg-item .veg-btn.selected {
  border-radius: 10px 10px 0 0;
  border-bottom-color: transparent;
}

.veg-varieties {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.5rem 0.6rem 0.6rem;
  background: rgba(74, 103, 65, 0.06);
  border: 1px solid rgba(74, 103, 65, 0.18);
  border-top: none;
  border-radius: 0 0 10px 10px;
  align-items: center;
}

.variety-chip {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  border: 1.5px solid rgba(74, 103, 65, 0.22);
  background: rgba(255, 255, 255, 0.85);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--brand-deep);
  cursor: pointer;
  transition: background 120ms, border-color 120ms;
}

.variety-chip:hover {
  background: rgba(74, 103, 65, 0.1);
  border-color: rgba(74, 103, 65, 0.4);
}

.variety-chip-selected {
  background: rgba(74, 103, 65, 0.18);
  border-color: rgba(74, 103, 65, 0.5);
  color: #2d5a27;
}

.variety-chip-custom {
  border-style: dashed;
  color: rgba(39, 65, 53, 0.6);
}

.varieties-loading,
.varieties-none {
  font-size: 0.76rem;
  color: rgba(39, 65, 53, 0.5);
  font-style: italic;
}

.variety-custom-inline {
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid rgba(74, 103, 65, 0.25);
  border-radius: 8px;
  font-size: 0.82rem;
  background: rgba(255, 255, 255, 0.9);
  color: var(--brand-deep);
  outline: none;
}

.variety-custom-inline:focus {
  border-color: rgba(74, 103, 65, 0.5);
}

.veg-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  min-height: 60px;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(249, 244, 233, 0.9));
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
  cursor: pointer;
  font-size: 0.85rem;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  text-align: left;
}

.veg-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(74, 103, 65, 0.22);
}

.veg-btn.selected {
  background: linear-gradient(135deg, rgba(74, 103, 65, 0.16), rgba(39, 65, 53, 0.08));
  border-color: rgba(74, 103, 65, 0.28);
  box-shadow: 0 12px 24px rgba(58, 47, 24, 0.1);
}

/* Restricted vegetables */
.veg-btn-restricted {
  border-color: rgba(200, 130, 30, 0.2);
  background: linear-gradient(180deg, rgba(255, 248, 235, 0.95), rgba(253, 243, 222, 0.9));
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
}

.veg-btn-restricted:hover {
  border-color: rgba(200, 130, 30, 0.4);
  background: rgba(255, 243, 215, 0.95);
}

.veg-btn-restricted.selected {
  background: rgba(200, 130, 30, 0.14);
  border-color: rgba(200, 130, 30, 0.4);
  box-shadow: 0 10px 20px rgba(200, 130, 30, 0.1);
}

.warn-icon {
  font-size: 0.82rem;
  color: #b06010;
  flex-shrink: 0;
}

.veg-btn-name {
  font-weight: 800;
  color: var(--brand-deep);
}

.veg-badge-never {
  font-size: 0.65rem;
  color: var(--brand-olive);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.veg-badge-date {
  font-size: 0.65rem;
  color: rgba(39, 65, 53, 0.68);
}

.veg-btn-assoc-warn {
  border-color: rgba(180, 120, 0, 0.35);
  background: rgba(255, 200, 50, 0.06);
}
.veg-btn-assoc-warn:hover {
  background: rgba(255, 200, 50, 0.14);
}

.veg-badge-assoc {
  font-size: 0.75rem;
  color: #b47800;
}

/* ── Search ──────────────────────────────────────────────────────────────── */
.veg-search-wrapper {
  position: relative;
  margin: 0 1rem 0.75rem;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px solid rgba(39, 65, 53, 0.14);
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(58, 47, 24, 0.07);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.veg-search-wrapper:focus-within,
.veg-search-wrapper.search-open {
  border-color: rgba(74, 103, 65, 0.35);
  box-shadow: 0 0 0 3px rgba(74, 103, 65, 0.1), 0 8px 20px rgba(58, 47, 24, 0.07);
}

.search-icon {
  padding: 0 0.65rem 0 1rem;
  font-size: 0.9rem;
  opacity: 0.6;
  flex-shrink: 0;
  pointer-events: none;
}

.veg-search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.85rem 0.5rem;
  font-size: 0.95rem;
  color: var(--brand-deep);
  outline: none;
}

.veg-search-input::placeholder {
  color: rgba(39, 65, 53, 0.38);
}

.search-clear {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 0.9rem;
  font-size: 0.8rem;
  color: rgba(39, 65, 53, 0.4);
  transition: color 160ms;
}

.search-clear:hover { color: rgba(39, 65, 53, 0.75); }

.veg-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  list-style: none;
  margin: 0;
  padding: 0.4rem;
  background: rgba(255, 252, 246, 0.98);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(26, 34, 28, 0.16);
  max-height: 260px;
  overflow-y: auto;
  backdrop-filter: blur(18px);
}

.veg-suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 140ms ease;
}

.veg-suggestion-item:hover,
.veg-suggestion-item.suggestion-selected {
  background: rgba(74, 103, 65, 0.1);
}

.veg-suggestion-item.suggestion-restricted:hover {
  background: rgba(200, 130, 30, 0.1);
}

.suggestion-name {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--brand-deep);
  flex: 1;
}

.suggestion-family {
  font-size: 0.75rem;
  color: rgba(39, 65, 53, 0.5);
}

.suggestion-ok {
  font-size: 0.75rem;
  color: var(--brand-olive);
  font-weight: 800;
  flex-shrink: 0;
}

.suggestion-warn {
  font-size: 0.78rem;
  color: #b06010;
  flex-shrink: 0;
}

.veg-no-result {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  padding: 0.85rem 1rem;
  background: rgba(255, 252, 246, 0.98);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(26, 34, 28, 0.16);
  font-size: 0.84rem;
  color: rgba(39, 65, 53, 0.5);
  text-align: center;
}

/* Form */
.form-field-full {
  grid-column: 1 / -1;
}

.variety-select,
.variety-custom-input {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 16px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  color: var(--text-primary);
  appearance: none;
  box-sizing: border-box;
}

.variety-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23274135' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
  cursor: pointer;
}

.variety-select:focus-visible,
.variety-custom-input:focus-visible {
  outline: 2px solid rgba(74, 103, 65, 0.24);
  outline-offset: 2px;
}

.variety-custom-input {
  margin-top: 0.5rem;
}

.variety-selected-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(74, 103, 65, 0.12);
  border: 1.5px solid rgba(74, 103, 65, 0.3);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #2d5a27;
}

.variety-loading {
  font-size: 0.84rem;
  color: rgba(39, 65, 53, 0.45);
  padding: 0.6rem 0;
}

.variety-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 0.75rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-field label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.72);
}

.form-field input {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 16px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  color: var(--text-primary);
}

.form-field input:focus-visible {
  outline: 2px solid rgba(74, 103, 65, 0.24);
  outline-offset: 2px;
}

.qty-row {
  display: flex;
  gap: 0.5rem;
}

.qty-input {
  flex: 1;
  min-width: 0;
}

.qty-unit {
  padding: 0.95rem 0.75rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 16px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.qty-unit:focus-visible {
  outline: 2px solid rgba(74, 103, 65, 0.24);
  outline-offset: 2px;
}

/* Récolte */
.panel-section-harvest {
  border-color: rgba(180, 130, 20, 0.28);
  background: rgba(255, 251, 235, 0.85);
}

.harvest-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.harvest-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.harvest-header h4 {
  margin: 0 0 0.15rem;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7a5a10;
}

.harvest-sub {
  margin: 0;
  font-size: 0.9rem;
  color: var(--brand-deep);
}

.harvest-confirm-btn {
  width: 100%;
  margin-top: 0.85rem;
  padding: 0.7rem 1.2rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #7a5a10, #a07420);
  color: #fff8e8;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 160ms, transform 160ms;
}

.harvest-confirm-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.harvest-confirm-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.harvest-error {
  margin: 0.5rem 0 0;
  font-size: 0.84rem;
  color: #c62828;
}

.cancel-section-block {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(181, 106, 67, 0.3);
}

.cancel-section-btn {
  width: 100%;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(181, 106, 67, 0.5);
  border-radius: var(--radius-lg);
  background: transparent;
  color: #8b4d2d;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.cancel-section-btn:hover:not(:disabled) {
  background: rgba(181, 106, 67, 0.1);
  border-color: rgba(181, 106, 67, 0.8);
}

.cancel-section-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-confirm-text {
  margin: 0 0 0.6rem;
  font-size: 0.84rem;
  color: #8b4d2d;
  line-height: 1.4;
}

.cancel-confirm-actions {
  display: flex;
  gap: 0.5rem;
}

.cancel-confirm-actions .cancel-section-btn {
  flex: 1;
}

.cancel-confirm-abort {
  flex: 1;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(39, 65, 53, 0.18);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--brand-deep);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms ease;
}

.cancel-confirm-abort:hover {
  background: rgba(39, 65, 53, 0.07);
}

.cancel-error {
  margin: 0 0 0.5rem;
  font-size: 0.84rem;
  color: #c62828;
}

.panel-harvest-block {
  margin: 0;
  padding: 0.65rem 0.9rem;
  border-radius: 12px;
  background: rgba(180, 83, 9, 0.08);
  border: 1px solid rgba(180, 83, 9, 0.22);
  color: #92400e;
  font-size: 0.84rem;
  line-height: 1.45;
}

/* ── Succès plantation ───────────────────────────────────────────────────── */
.planting-success-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin: 0 1rem 1rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(74, 140, 65, 0.14), rgba(39, 100, 53, 0.08));
  border: 1.5px solid rgba(74, 140, 65, 0.3);
  animation: slide-in-success 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slide-in-success {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.success-icon {
  font-size: 1.4rem;
  line-height: 1;
  flex-shrink: 0;
}

.planting-success-banner strong {
  display: block;
  font-size: 0.9rem;
  font-weight: 800;
  color: #1e5c2a;
  margin-bottom: 0.2rem;
}

.planting-success-banner p {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(30, 92, 42, 0.75);
}

.harvest-success-banner {
  background: linear-gradient(135deg, rgba(180, 130, 10, 0.14), rgba(140, 90, 0, 0.08));
  border-color: rgba(180, 130, 10, 0.35);
}
.harvest-success-banner strong { color: #7a5a10; }
.harvest-success-banner p { color: rgba(122, 90, 16, 0.75); }

.fertil-success-banner {
  background: linear-gradient(135deg, rgba(74, 130, 60, 0.14), rgba(39, 100, 53, 0.08));
  border-color: rgba(74, 130, 60, 0.35);
}
.fertil-success-banner strong { color: #2d6e22; }
.fertil-success-banner p { color: rgba(45, 110, 34, 0.75); }

.treat-success-banner {
  background: linear-gradient(135deg, rgba(130, 60, 160, 0.14), rgba(90, 20, 120, 0.08));
  border-color: rgba(130, 60, 160, 0.35);
}
.treat-success-banner strong { color: #6a2090; }
.treat-success-banner p { color: rgba(106, 32, 144, 0.75); }

.water-success-banner {
  background: linear-gradient(135deg, rgba(26, 90, 171, 0.14), rgba(10, 60, 130, 0.08));
  border-color: rgba(26, 90, 171, 0.35);
}
.water-success-banner strong { color: #1a4a8a; }
.water-success-banner p { color: rgba(26, 74, 138, 0.75); }

/* Footer */
.panel-footer {
  padding: 1rem 1.5rem 1.35rem;
  display: grid;
  gap: 0.65rem;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.84), rgba(248, 242, 231, 0.98));
  border-top: 1px solid rgba(39, 65, 53, 0.08);
  backdrop-filter: blur(14px);
  margin-top: auto;
}

.primary-button {
  padding: 0.85rem 1.25rem;
  background: linear-gradient(135deg, var(--brand-olive), var(--brand-deep));
  color: #fffdf8;
  border: none;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(39, 65, 53, 0.22);
  transition: transform 160ms ease, opacity 160ms ease;
}

.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.primary-button:hover:not(:disabled) { transform: translateY(-1px); }

.warning-button {
  padding: 0.85rem 1.25rem;
  background: linear-gradient(135deg, #d9822b, #b85e19);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(181, 106, 67, 0.22);
  transition: transform 160ms ease, opacity 160ms ease;
}

.warning-button:disabled { opacity: 0.5; cursor: not-allowed; }
.warning-button:hover:not(:disabled) { transform: translateY(-1px); }

.secondary-button {
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-deep);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(58, 47, 24, 0.06);
  transition: transform 160ms ease;
}

.secondary-button:hover { transform: translateY(-1px); }

/* ── Fertilisation ───────────────────────────────────────────────────────── */
.panel-section-fertil {
  border-color: rgba(74, 130, 60, 0.25);
  background: rgba(235, 248, 233, 0.78);
}

.section-toggle-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  margin-bottom: 0.85rem;
}

.section-toggle-chevron {
  margin-left: auto;
  font-size: 1.2rem;
  color: rgba(39, 65, 53, 0.4);
  transform: rotate(90deg);
  transition: transform 200ms;
  line-height: 1;
}
.section-toggle-chevron.open {
  transform: rotate(-90deg);
}

.section-done-badge {
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(50, 120, 50, 0.85);
  background: rgba(74, 140, 60, 0.12);
  border: 1px solid rgba(74, 140, 60, 0.25);
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
}

.fertil-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
}

.fertil-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.fertil-header h4 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #2d6a1e;
}

.scope-name-fertil {
  color: #2d6a1e;
}

.fertil-btn {
  width: 100%;
  margin-top: 0.85rem;
  padding: 0.7rem 1.2rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #3a8030, #256020);
  color: #e8f8e2;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 160ms, transform 160ms;
}

.fertil-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.fertil-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Traitement ──────────────────────────────────────────────────────────── */
.panel-section-treat {
  border-color: rgba(130, 60, 160, 0.22);
  background: rgba(248, 238, 255, 0.78);
}

.treat-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
}

.treat-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.treat-header h4 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6a2090;
}

.scope-name-treat {
  color: #6a2090;
}

.treat-btn {
  width: 100%;
  margin-top: 0.85rem;
  padding: 0.7rem 1.2rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #7a28a8, #5c1a88);
  color: #f5e8ff;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 160ms, transform 160ms;
}

.treat-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.treat-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Arrosage ────────────────────────────────────────────────────────────── */
.panel-section-water {
  border-color: rgba(30, 90, 180, 0.2);
  background: rgba(235, 244, 255, 0.75);
}

.water-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
}

.water-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.water-header h4 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #1a4a8a;
}

.water-scope {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 0.1rem;
}

.scope-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: var(--brand-deep);
  cursor: pointer;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  transition: background 140ms;
}

.scope-option:hover:not(.scope-disabled) {
  background: rgba(30, 90, 180, 0.07);
}

.scope-option.scope-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.scope-name {
  font-weight: 800;
  color: #1a4a8a;
  font-size: 0.82rem;
}

.scope-hint {
  font-size: 0.74rem;
  color: rgba(39, 65, 53, 0.45);
  font-style: italic;
}

.water-datetime-field {
  margin-top: 0.75rem;
}

.water-btn {
  width: 100%;
  margin-top: 0.85rem;
  padding: 0.7rem 1.2rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #1a5aab, #0e3d7a);
  color: #e8f2ff;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 160ms, transform 160ms;
}

.water-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.water-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.water-error {
  margin: 0.45rem 0 0;
  font-size: 0.84rem;
  color: #c62828;
}

.water-recent-title {
  margin: 0.85rem 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(26, 74, 138, 0.7);
}

.water-recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.water-recent-item {
  font-size: 0.82rem;
  color: rgba(39, 65, 53, 0.72);
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  background: rgba(30, 90, 180, 0.06);
}

.water-recent-loading,
.water-recent-empty {
  margin-top: 0.65rem;
  font-size: 0.8rem;
  color: rgba(39, 65, 53, 0.45);
  text-align: center;
}

@media (max-width: 720px) {
  .side-panel-overlay { padding: 0; }
  .side-panel { width: 100vw; border-radius: 0; }
  .form-grid { grid-template-columns: 1fr; }
}

/* ── Stock info & warning ──────────────────────────────────────────────── */
.stock-info {
  font-size: 0.78rem;
  color: #4a6741;
  margin-top: 0.35rem;
  padding: 0.2rem 0.4rem;
  background: rgba(74, 103, 65, 0.08);
  border-radius: 4px;
}

.stock-info-empty {
  color: #9a7b3a;
  background: rgba(154, 123, 58, 0.08);
}

.stock-over-hint {
  color: #b45309;
  font-weight: 600;
}

.qty-input-over {
  border-color: #d97706 !important;
  background: rgba(251, 191, 36, 0.08) !important;
}

.stock-warning-banner {
  margin: 0 1rem 0.75rem;
  padding: 1rem 1.1rem;
  background: #fffbeb;
  border: 1.5px solid #f59e0b;
  border-radius: 10px;
}

.stock-warning-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: #92400e;
}

.stock-warning-emoji {
  font-size: 1.25rem;
}

.stock-warning-text {
  font-size: 0.85rem;
  color: #78350f;
  margin: 0 0 0.75rem;
  line-height: 1.5;
}

.stock-warning-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
</style>
