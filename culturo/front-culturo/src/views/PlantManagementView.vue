<template>
  <div class="plant-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Gestion des plants</h2>
        <p class="page-sub">Stock disponible, fournisseurs et commandes</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span v-html="tab.icon" class="tab-icon" />
        {{ tab.label }}
        <span v-if="tab.count !== undefined && tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Error banner -->
    <div v-if="store.error" class="error-banner">
      {{ store.error }}
      <button @click="store.error = null">×</button>
    </div>

    <!-- ═══════════════════════════════════════ TAB: STOCK ═══════════════════ -->
    <section v-if="activeTab === 'stock'" class="tab-content">
      <div class="section-toolbar">
        <input v-model="stockSearch" class="search-input" placeholder="Rechercher un légume…" />
        <div class="toolbar-actions">
          <button class="export-btn" title="Exporter en CSV" @click="exportStockCSV">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </button>
          <button class="export-btn" title="Exporter en PDF" @click="exportStockPDF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            PDF
          </button>
          <button class="primary-button" @click="store.openCreateStock()">+ Ajouter du stock</button>
        </div>
      </div>

      <div v-if="store.loadingStock" class="loading-state">Chargement…</div>

      <div v-else-if="filteredStock.length === 0" class="empty-state">
        <p>Aucun plant en stock.</p>
        <button class="primary-button" @click="store.openCreateStock()">Ajouter des plants</button>
      </div>

      <!-- Résumé stock -->
      <div v-if="filteredStock.length" class="stock-summary">
        <span class="stock-summary-item">
          <strong>{{ filteredStock.length }}</strong> entrée{{ filteredStock.length !== 1 ? 's' : '' }}
        </span>
        <span class="stock-summary-sep">·</span>
        <span class="stock-summary-item">
          <strong>{{ new Set(filteredStock.map(s => s.vegetable.id_vegetable)).size }}</strong> légume{{ new Set(filteredStock.map(s => s.vegetable.id_vegetable)).size !== 1 ? 's' : '' }} distincts
        </span>
        <span class="stock-summary-sep">·</span>
        <span class="stock-summary-item stock-summary-warn" v-if="filteredStock.filter(s => s.quantity === 0).length">
          ⚠ {{ filteredStock.filter(s => s.quantity === 0).length }} à stock zéro
        </span>
      </div>

      <div v-if="filteredStock.length" class="stock-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Légume</th>
              <th>Variété</th>
              <th>Quantité</th>
              <th>Unité</th>
              <th>Date réception</th>
              <th>Exploitation</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredStock" :key="s.id_stock" :class="{ 'row-low': s.quantity === 0 }">
              <td class="cell-veg">{{ s.vegetable.vegetable_name }}</td>
              <td>{{ s.variety?.variety_name ?? '—' }}</td>
              <td class="cell-qty" :class="{ 'qty-zero': s.quantity === 0 }">{{ s.quantity }}</td>
              <td>{{ s.unit }}</td>
              <td>{{ s.received_date ? formatDate(s.received_date) : '—' }}</td>
              <td>{{ s.exploitation?.exploitation_name ?? 'Global' }}</td>
              <td class="cell-notes">{{ s.notes ?? '' }}</td>
              <td class="cell-actions">
                <template v-if="deleteStockPending === s.id_stock">
                  <span class="inline-confirm-text">Supprimer ?</span>
                  <button class="btn-icon btn-danger" @click="doDeleteStock(s.id_stock)">✓</button>
                  <button class="btn-icon" @click="deleteStockPending = null">✕</button>
                </template>
                <template v-else>
                  <button class="btn-icon" title="Modifier" @click="store.openEditStock(s)">✏️</button>
                  <button class="btn-icon btn-danger" title="Supprimer" @click="confirmDeleteStock(s.id_stock)">🗑</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ TAB: FOURNISSEURS ═════════════ -->
    <section v-else-if="activeTab === 'suppliers'" class="tab-content">
      <div class="section-toolbar">
        <input v-model="supplierSearch" class="search-input" placeholder="Rechercher un fournisseur…" />
        <div class="toolbar-actions">
          <button class="export-btn" title="Exporter en CSV" @click="exportSuppliersCSV">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </button>
          <button class="export-btn" title="Exporter en PDF" @click="exportSuppliersPDF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            PDF
          </button>
          <button class="primary-button" @click="store.openCreateSupplier()">+ Nouveau fournisseur</button>
        </div>
      </div>

      <div v-if="store.loadingSuppliers" class="loading-state">Chargement…</div>

      <div v-else-if="store.suppliers.length === 0" class="empty-state">
        <p>Aucun fournisseur enregistré.</p>
        <button class="primary-button" @click="store.openCreateSupplier()">Ajouter un fournisseur</button>
      </div>

      <div v-else class="suppliers-grid">
        <div
          v-for="s in filteredSuppliers"
          :key="s.id_supplier"
          class="supplier-card"
          :class="{ inactive: !s.supplier_active }"
        >
          <div class="supplier-card-head">
            <span class="supplier-name">{{ s.supplier_name }}</span>
            <span class="supplier-badge" :class="s.supplier_active ? 'badge-active' : 'badge-inactive'">
              {{ s.supplier_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <div class="supplier-card-body">
            <p v-if="s.contact_email">✉ {{ s.contact_email }}</p>
            <p v-if="s.contact_phone">📞 {{ s.contact_phone }}</p>
            <a v-if="s.website" :href="s.website" target="_blank" rel="noopener" class="supplier-link">🌐 {{ s.website }}</a>
            <p class="supplier-orders-count" @click="goToSupplierOrders(s.id_supplier)">
              📦 {{ supplierOrderCount(s.id_supplier) }} commande{{ supplierOrderCount(s.id_supplier) !== 1 ? 's' : '' }}
            </p>
          </div>
          <div class="supplier-card-actions">
            <button class="btn-sm btn-sm-link" @click="goToSupplierOrders(s.id_supplier)">Voir commandes</button>
            <button class="btn-sm" @click="store.openEditSupplier(s)">Modifier</button>
            <template v-if="deleteSupplierPending === s.id_supplier">
              <span class="inline-confirm-text">Confirmer ?</span>
              <button class="btn-sm btn-sm-danger" @click="doDeleteSupplier(s.id_supplier)">Oui</button>
              <button class="btn-sm" @click="deleteSupplierPending = null">Non</button>
            </template>
            <button v-else class="btn-sm btn-sm-danger" @click="confirmDeleteSupplier(s.id_supplier)">Supprimer</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ TAB: COMMANDES ═══════════════ -->
    <section v-else-if="activeTab === 'orders'" class="tab-content">
      <div class="orders-header">

        <!-- Ligne 1 : statuts (gauche) + actions (droite) -->
        <div class="orders-row-top">
          <div class="status-filters">
            <button
              v-for="f in statusFilters"
              :key="f.value"
              class="filter-pill"
              :class="{ active: orderStatusFilter === f.value }"
              @click="orderStatusFilter = f.value"
            >{{ f.label }}</button>
          </div>
          <div class="orders-actions">
            <button class="export-btn" title="Exporter en CSV" @click="exportOrdersCSV">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV
            </button>
            <button class="export-btn" title="Exporter en PDF" @click="exportOrdersPDF">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              PDF
            </button>
            <button class="primary-button" @click="store.openCreateOrder()">+ Nouvelle commande</button>
          </div>
        </div>

        <!-- Ligne 2 : filtres date + fournisseur + reset + compteur -->
        <div class="orders-row-filters">
          <div class="filter-inline-group">
            <span class="filter-inline-label">Du</span>
            <input v-model="orderDateFrom" type="date" class="filter-date-inline" />
            <span class="filter-inline-label">au</span>
            <input v-model="orderDateTo" type="date" class="filter-date-inline" />
          </div>
          <select v-model="orderSupplierFilter" class="filter-select-inline">
            <option :value="null">Tous les fournisseurs</option>
            <option v-for="s in store.suppliers" :key="s.id_supplier" :value="s.id_supplier">
              {{ s.supplier_name }}
            </option>
          </select>
          <button v-if="hasActiveOrderFilters" class="reset-filters-btn" @click="resetOrderFilters" title="Réinitialiser">✕</button>
          <span class="orders-count">{{ filteredOrders.length }} résultat{{ filteredOrders.length !== 1 ? 's' : '' }}</span>
        </div>

      </div>

      <div v-if="store.loadingOrders" class="loading-state">Chargement…</div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <p>Aucune commande.</p>
      </div>

      <!-- Confirmation inline de réception -->
      <div v-if="receiveOrderPending !== null" class="inline-receive-confirm">
        <div class="inline-receive-inner">
          <p class="inline-receive-title">✅ Confirmer la réception ?</p>
          <p class="inline-receive-sub">Le stock sera automatiquement mis à jour avec les quantités commandées.</p>
          <ul class="inline-receive-items">
            <li v-for="item in store.orders.find(o => o.id_supplier_order === receiveOrderPending)?.items ?? []" :key="item.id_item">
              {{ item.vegetable.vegetable_name }}<span v-if="item.variety"> – {{ item.variety.variety_name }}</span> : <strong>{{ item.quantity_ordered }} {{ item.unit }}</strong>
            </li>
          </ul>
          <div class="inline-receive-actions">
            <button class="btn-receive" @click="doReceiveOrder(receiveOrderPending!)">Confirmer → stock mis à jour</button>
            <button class="secondary-button" @click="receiveOrderPending = null">Annuler</button>
          </div>
        </div>
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in filteredOrders"
          :key="order.id_supplier_order"
          class="order-card"
        >
          <!-- En-tête cliquable pour collapse -->
          <div class="order-card-head" @click="toggleOrderCollapse(order.id_supplier_order)" style="cursor:pointer">
            <div class="order-meta">
              <span class="order-collapse-icon">{{ isCollapsed(order.id_supplier_order) ? '▶' : '▼' }}</span>
              <span class="order-supplier">{{ order.supplier.supplier_name }}</span>
              <span class="order-date">{{ formatDate(order.order_date) }}</span>
              <span v-if="order.expected_date" class="order-expected">
                Livraison prévue : {{ formatDate(order.expected_date) }}
              </span>
              <span class="order-items-count">{{ order.items.length }} article{{ order.items.length !== 1 ? 's' : '' }}</span>
            </div>
            <span class="order-status-badge" :class="`status-${order.status}`">
              {{ statusLabel(order.status) }}
            </span>
          </div>

          <!-- Contenu collapsible -->
          <template v-if="!isCollapsed(order.id_supplier_order)">
            <!-- Items list -->
            <table v-if="order.items.length" class="items-table">
              <thead>
                <tr>
                  <th>Légume</th>
                  <th>Variété</th>
                  <th>Commandé</th>
                  <th>Reçu</th>
                  <th>Unité</th>
                  <th>Prix unit. HT</th>
                  <th class="col-total">Total HT</th>
                  <th v-if="order.status === 'draft'"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id_item">
                  <td>{{ item.vegetable.vegetable_name }}</td>
                  <td>{{ item.variety?.variety_name ?? '—' }}</td>
                  <td>{{ item.quantity_ordered }}</td>
                  <td>{{ item.quantity_received }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.unit_price ?? '—' }}</td>
                  <td class="col-total">
                    {{ item.unit_price ? formatPrice(parseFloat(String(item.unit_price).replace(',','.')) * item.quantity_ordered) : '—' }}
                  </td>
                  <td v-if="order.status === 'draft'">
                    <button class="btn-icon btn-danger" @click="store.removeOrderItem(order.id_supplier_order, item.id_item)">🗑</button>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="orderTotals(order.items)">
                <tr class="tfoot-ht">
                  <td colspan="6" class="tfoot-label">Total HT</td>
                  <td class="tfoot-value">{{ formatPrice(orderTotals(order.items)!.ht) }}</td>
                  <td v-if="order.status === 'draft'"></td>
                </tr>
                <tr v-if="orderTotals(order.items)!.tva !== null" class="tfoot-tva">
                  <td colspan="6" class="tfoot-label">TVA ({{ orderTotals(order.items)!.tvaRate }}%)</td>
                  <td class="tfoot-value">{{ formatPrice(orderTotals(order.items)!.tva!) }}</td>
                  <td v-if="order.status === 'draft'"></td>
                </tr>
                <tr v-if="orderTotals(order.items)!.ttc !== null" class="tfoot-ttc">
                  <td colspan="6" class="tfoot-label">Total TTC</td>
                  <td class="tfoot-value">{{ formatPrice(orderTotals(order.items)!.ttc!) }}</td>
                  <td v-if="order.status === 'draft'"></td>
                </tr>
              </tfoot>
            </table>
            <p v-else class="order-empty-items">Aucune ligne — ajoutez des légumes à commander.</p>

            <div v-if="order.notes" class="order-notes">📝 {{ order.notes }}</div>

            <div class="order-card-actions">
              <!-- Brouillon -->
              <template v-if="order.status === 'draft'">
                <button class="btn-sm" @click="store.openAddItem(order.id_supplier_order)">+ Ligne</button>
                <button class="btn-sm" @click="store.openEditOrder(order)">✏️ Modifier</button>
                <button class="btn-sm btn-sm-action" @click="store.updateOrderStatus(order.id_supplier_order, 'sent')">📤 Envoyer</button>
                <button class="btn-sm btn-sm-danger" @click="store.updateOrderStatus(order.id_supplier_order, 'cancelled')">Annuler</button>
              </template>

              <!-- Envoyée -->
              <template v-if="order.status === 'sent'">
                <button class="btn-receive" @click="confirmReceiveOrder(order.id_supplier_order)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Confirmer la réception
                </button>
                <button class="btn-sm btn-sm-danger" @click="store.updateOrderStatus(order.id_supplier_order, 'cancelled')">Annuler la commande</button>
              </template>

              <!-- Suppression inline -->
              <template v-if="order.status !== 'received' && order.status !== 'cancelled'">
                <template v-if="deleteOrderPending === order.id_supplier_order">
                  <span class="inline-confirm-text">Supprimer ?</span>
                  <button class="btn-sm btn-sm-danger" @click="doDeleteOrder(order.id_supplier_order)">Oui</button>
                  <button class="btn-sm" @click="deleteOrderPending = null">Non</button>
                </template>
                <button v-else class="btn-sm btn-sm-danger" @click="confirmDeleteOrder(order.id_supplier_order)">🗑</button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ TAB: RÉGLAGES ════════════════ -->
    <section v-else-if="activeTab === 'settings'" class="tab-content">
      <div class="settings-page">
        <div class="settings-header">
          <h3 class="settings-title">Réglages généraux</h3>
          <div class="settings-save-bar">
            <div v-if="store.settingsSaved" class="settings-success">✓ Sauvegardé</div>
            <div v-if="store.settingsError" class="settings-error">{{ store.settingsError }}</div>
            <button class="primary-button" :disabled="store.settingsSaving" @click="saveAllSettings">
              {{ store.settingsSaving ? 'Sauvegarde…' : '💾 Sauvegarder tout' }}
            </button>
          </div>
        </div>

        <!-- Société -->
        <div class="settings-group">
          <h4 class="settings-group-title">Société</h4>
          <p class="settings-group-hint">Ces informations apparaissent dans les bons de commande envoyés aux fournisseurs.</p>
          <div class="settings-fields-grid">
            <div class="settings-field">
              <label class="settings-label">Nom de la société</label>
              <input v-model="companyNameInput" type="text" class="settings-input" placeholder="Culturo" />
            </div>
            <div class="settings-field">
              <label class="settings-label">Adresse</label>
              <input v-model="companyAddressInput" type="text" class="settings-input" placeholder="12 rue des jardins" />
            </div>
            <div class="settings-field">
              <label class="settings-label">Code postal / Ville</label>
              <input v-model="companyZipCityInput" type="text" class="settings-input" placeholder="75001 Paris" />
            </div>
            <div class="settings-field">
              <label class="settings-label">Pays</label>
              <input v-model="companyCountryInput" type="text" class="settings-input" placeholder="France" />
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="settings-group">
          <h4 class="settings-group-title">Contact</h4>
          <div class="settings-field">
            <label class="settings-label">Email de contact</label>
            <p class="settings-hint">Affiché dans les bons de commande fournisseur et utilisé comme adresse de réponse (reply-to).</p>
            <input v-model="contactEmailInput" type="email" class="settings-input" style="max-width:300px" placeholder="culturotech@gmail.com" />
          </div>
        </div>

        <!-- Fiscalité -->
        <div class="settings-group">
          <h4 class="settings-group-title">Fiscalité</h4>
          <div class="settings-row">
            <div class="settings-field">
              <label class="settings-label">Taux de TVA (%)</label>
              <p class="settings-hint">Appliqué au total HT dans les emails de commande et dans les totaux de l'interface.</p>
              <div class="settings-input-row">
                <input v-model="tvaRateInput" type="number" min="0" max="100" step="0.1" class="settings-input" placeholder="20" style="width:100px" />
                <span class="settings-unit">%</span>
              </div>
            </div>
            <div class="settings-preview">
              <p class="settings-preview-title">Aperçu sur 100 €</p>
              <div class="settings-preview-box">
                <div class="preview-row"><span>Total HT</span><span>100,00 €</span></div>
                <div class="preview-row preview-tva"><span>TVA ({{ tvaRateInput || 0 }}%)</span><span>{{ tvaPreview }} €</span></div>
                <div class="preview-row preview-ttc"><span>Total TTC</span><span>{{ ttcPreview }} €</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═════════════════════════════ MODALS ═════════════════════════════════ -->

    <!-- Supplier modal -->
    <Teleport to="body">
      <div v-if="store.supplierModalOpen" class="modal-backdrop" @click.self="store.closeSupplierModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ store.supplierModalMode === 'create' ? 'Nouveau fournisseur' : 'Modifier le fournisseur' }}</h3>
            <button class="modal-close" @click="store.closeSupplierModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom *</label>
              <input v-model="store.supplierForm.supplier_name" class="form-input" placeholder="Nom du fournisseur" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="store.supplierForm.contact_email" class="form-input" type="email" placeholder="contact@exemple.fr" />
            </div>
            <div class="form-group">
              <label>Téléphone</label>
              <input v-model="store.supplierForm.contact_phone" class="form-input" placeholder="0612345678" />
            </div>
            <div class="form-group">
              <label>Site web</label>
              <input v-model="store.supplierForm.website" class="form-input" placeholder="https://…" />
            </div>
            <div class="form-group form-check">
              <input id="sup-active" v-model="store.supplierForm.supplier_active" type="checkbox" />
              <label for="sup-active">Fournisseur actif</label>
            </div>
            <p v-if="store.supplierModalError" class="form-error">{{ store.supplierModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="secondary-button" @click="store.closeSupplierModal()">Annuler</button>
            <button class="primary-button" :disabled="store.supplierModalLoading" @click="store.submitSupplierModal()">
              {{ store.supplierModalLoading ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Stock modal -->
    <Teleport to="body">
      <div v-if="store.stockModalOpen" class="modal-backdrop" @click.self="store.closeStockModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ store.stockModalMode === 'create' ? 'Ajouter du stock' : 'Modifier le stock' }}</h3>
            <button class="modal-close" @click="store.closeStockModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Légume *</label>
                <select v-model="store.stockForm.id_vegetable" class="form-select">
                  <option :value="null" disabled>Choisir…</option>
                  <option v-for="v in botanicalStore.vegetables" :key="v.id_vegetable" :value="v.id_vegetable">
                    {{ v.vegetable_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Variété</label>
                <select v-model="store.stockForm.id_variety" class="form-select">
                  <option :value="null">Aucune</option>
                  <option
                    v-for="vr in varietiesForSelected"
                    :key="vr.id_variety"
                    :value="vr.id_variety"
                  >{{ vr.variety_name }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Quantité *</label>
                <input v-model.number="store.stockForm.quantity" class="form-input" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>Unité</label>
                <select v-model="store.stockForm.unit" class="form-select">
                  <option value="plants">Plants</option>
                  <option value="graines">Graines</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Exploitation</label>
              <select v-model="store.stockForm.id_exploitation" class="form-select">
                <option :value="null">Global</option>
                <option v-for="e in exploitations" :key="e.id_exploitation" :value="e.id_exploitation">
                  {{ e.exploitation_name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Date de réception</label>
              <input v-model="store.stockForm.received_date" class="form-input" type="date" />
            </div>
            <div class="form-group">
              <label>Notes</label>
              <input v-model="store.stockForm.notes" class="form-input" placeholder="Lot printemps…" />
            </div>
            <p v-if="store.stockModalError" class="form-error">{{ store.stockModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="secondary-button" @click="store.closeStockModal()">Annuler</button>
            <button class="primary-button" :disabled="store.stockModalLoading" @click="store.submitStockModal()">
              {{ store.stockModalLoading ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Order modal -->
    <Teleport to="body">
      <div v-if="store.orderModalOpen" class="modal-backdrop" @click.self="store.closeOrderModal()">
        <div class="modal-box modal-box-wide">
          <div class="modal-header">
            <h3>{{ store.orderModalMode === 'create' ? 'Nouvelle commande' : 'Modifier la commande' }}</h3>
            <button class="modal-close" @click="store.closeOrderModal()">×</button>
          </div>
          <div class="modal-body">

            <!-- Infos commande -->
            <div class="form-group">
              <label>Fournisseur *</label>
              <select v-model="store.orderForm.id_supplier" class="form-select" :disabled="store.orderModalMode === 'edit'">
                <option :value="null" disabled>Choisir…</option>
                <option v-for="s in store.activeSuppliers" :key="s.id_supplier" :value="s.id_supplier">
                  {{ s.supplier_name }}
                </option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date de commande *</label>
                <input v-model="store.orderForm.order_date" class="form-input" type="date" />
              </div>
              <div class="form-group">
                <label>Livraison prévue</label>
                <input v-model="store.orderForm.expected_date" class="form-input" type="date" />
              </div>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="store.orderForm.notes" class="form-input form-textarea" rows="2" placeholder="Informations complémentaires…" />
            </div>

            <!-- Articles commandés -->
            <div class="draft-items-section">
              <div class="draft-items-header">
                <span class="draft-items-title">Articles commandés</span>
                <button type="button" class="btn-add-row" @click="store.addDraftRow()">+ Ajouter une ligne</button>
              </div>

              <div class="draft-items-table-wrap">
                <table class="draft-items-table">
                  <thead>
                    <tr>
                      <th>Légume</th>
                      <th>Variété</th>
                      <th>Quantité</th>
                      <th>Unité</th>
                      <th>Prix unit. HT</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in store.orderDraftItems" :key="i">
                      <td>
                        <select
                          v-model="item.id_vegetable"
                          class="cell-select"
                          @change="onDraftVegetableChange(item)"
                        >
                          <option :value="null" disabled>Légume…</option>
                          <option v-for="v in botanicalStore.vegetables" :key="v.id_vegetable" :value="v.id_vegetable">
                            {{ v.vegetable_name }}
                          </option>
                        </select>
                      </td>
                      <td>
                        <select v-model="item.id_variety" class="cell-select">
                          <option :value="null">—</option>
                          <option
                            v-for="vr in varietiesForDraftItem(item.id_vegetable)"
                            :key="vr.id_variety"
                            :value="vr.id_variety"
                          >{{ vr.variety_name }}</option>
                        </select>
                      </td>
                      <td>
                        <input v-model.number="item.quantity_ordered" type="number" min="1" class="cell-input cell-qty" />
                      </td>
                      <td>
                        <select v-model="item.unit" class="cell-select cell-unit">
                          <option value="plants">plants</option>
                          <option value="graines">graines</option>
                          <option value="kg">kg</option>
                        </select>
                      </td>
                      <td>
                        <input v-model="item.unit_price" type="text" class="cell-input cell-price" placeholder="0.35 €" />
                      </td>
                      <td>
                        <button type="button" class="btn-remove-row" @click="store.removeDraftRow(i)">×</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Totaux du modal -->
              <div v-if="draftTotals()" class="draft-totals">
                <div class="draft-totals-row">
                  <span>Total HT</span>
                  <span>{{ formatPrice(draftTotals()!.ht) }}</span>
                </div>
                <div v-if="draftTotals()!.tva !== null" class="draft-totals-row draft-totals-tva">
                  <span>TVA ({{ draftTotals()!.tvaRate }}%)</span>
                  <span>{{ formatPrice(draftTotals()!.tva!) }}</span>
                </div>
                <div v-if="draftTotals()!.ttc !== null" class="draft-totals-row draft-totals-ttc">
                  <span>Total TTC</span>
                  <span>{{ formatPrice(draftTotals()!.ttc!) }}</span>
                </div>
              </div>
            </div>

            <p v-if="store.orderModalError" class="form-error">{{ store.orderModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="secondary-button" @click="store.closeOrderModal()">Annuler</button>
            <button class="primary-button" :disabled="store.orderModalLoading" @click="store.submitOrderModal(authStore.user?.id ?? 0)">
              {{ store.orderModalLoading ? 'Enregistrement…' : (store.orderModalMode === 'create' ? 'Créer la commande' : 'Enregistrer') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add item modal -->
    <Teleport to="body">
      <div v-if="store.addItemOpen" class="modal-backdrop" @click.self="store.closeAddItem()">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Ajouter une ligne</h3>
            <button class="modal-close" @click="store.closeAddItem()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Légume *</label>
                <select v-model="store.itemForm.id_vegetable" class="form-select">
                  <option :value="null" disabled>Choisir…</option>
                  <option v-for="v in botanicalStore.vegetables" :key="v.id_vegetable" :value="v.id_vegetable">
                    {{ v.vegetable_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Variété</label>
                <select v-model="store.itemForm.id_variety" class="form-select">
                  <option :value="null">Aucune</option>
                  <option
                    v-for="vr in varietiesForItem"
                    :key="vr.id_variety"
                    :value="vr.id_variety"
                  >{{ vr.variety_name }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Quantité *</label>
                <input v-model.number="store.itemForm.quantity_ordered" class="form-input" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>Unité</label>
                <select v-model="store.itemForm.unit" class="form-select">
                  <option value="plants">Plants</option>
                  <option value="graines">Graines</option>
                  <option value="kg">kg</option>
                </select>
              </div>
              <div class="form-group">
                <label>Prix unit.</label>
                <input v-model="store.itemForm.unit_price" class="form-input" placeholder="0.35" />
              </div>
            </div>
            <p v-if="store.itemFormError" class="form-error">{{ store.itemFormError }}</p>
          </div>
          <div class="modal-footer">
            <button class="secondary-button" @click="store.closeAddItem()">Annuler</button>
            <button class="primary-button" :disabled="store.itemFormLoading" @click="store.submitAddItem()">
              {{ store.itemFormLoading ? '…' : 'Ajouter' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePlantManagementStore } from '@/stores/plantManagement';
import { useBotanicalStore } from '@/stores/botanical';
import { useSoilBoardsStore } from '@/stores/soilBoards';
import { useAuthStore } from '@/stores/auth';

const store = usePlantManagementStore();
const botanicalStore = useBotanicalStore();
const soilBoardsStore = useSoilBoardsStore();
const authStore = useAuthStore();

const activeTab = ref<'stock' | 'suppliers' | 'orders' | 'settings'>('stock');
const stockSearch = ref('');
const supplierSearch = ref('');

// Fournisseurs filtrés + stats
const filteredSuppliers = computed(() => {
  const q = supplierSearch.value.toLowerCase().trim();
  return q ? store.suppliers.filter(s => s.supplier_name.toLowerCase().includes(q) || s.contact_email?.toLowerCase().includes(q)) : store.suppliers;
});

function supplierOrderCount(supplierId: number) {
  return store.orders.filter(o => o.supplier.id_supplier === supplierId).length;
}

function goToSupplierOrders(supplierId: number) {
  activeTab.value = 'orders';
  orderSupplierFilter.value = supplierId;
}

// Collapse des cartes commande
const collapsedOrders = ref<Record<number, boolean>>({});
function toggleOrderCollapse(id: number) {
  collapsedOrders.value = { ...collapsedOrders.value, [id]: !collapsedOrders.value[id] };
}
function isCollapsed(id: number) { return !!collapsedOrders.value[id]; }

// ── Filtres commandes ─────────────────────────────────────────────────────────
const orderStatusFilter = ref<string>('all');
const orderDateFrom = ref<string>('');
const orderDateTo = ref<string>('');
const orderSupplierFilter = ref<number | null>(null);

const statusFilters = [
  { value: 'all', label: 'Toutes' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'Envoyées' },
  { value: 'received', label: 'Reçues' },
  { value: 'cancelled', label: 'Annulées' },
];

const hasActiveOrderFilters = computed(() =>
  orderStatusFilter.value !== 'all' ||
  orderDateFrom.value !== '' ||
  orderDateTo.value !== '' ||
  orderSupplierFilter.value !== null,
);

function resetOrderFilters() {
  orderStatusFilter.value = 'all';
  orderDateFrom.value = '';
  orderDateTo.value = '';
  orderSupplierFilter.value = null;
}


// ── Réglages ──────────────────────────────────────────────────────────────────
const contactEmailInput = ref('');
const tvaRateInput = ref<number | string>('');
const companyNameInput = ref('');
const companyAddressInput = ref('');
const companyZipCityInput = ref('');
const companyCountryInput = ref('');

const tvaPreview = computed(() => {
  const rate = parseFloat(String(tvaRateInput.value));
  return isNaN(rate) ? '0,00' : (rate).toFixed(2).replace('.', ',');
});
const ttcPreview = computed(() => {
  const rate = parseFloat(String(tvaRateInput.value));
  return isNaN(rate) ? '100,00' : (100 + rate).toFixed(2).replace('.', ',');
});

async function saveAllSettings() {
  const fields: Record<string, string> = {
    contact_email: contactEmailInput.value.trim(),
    tva_rate: String(tvaRateInput.value),
    company_name: companyNameInput.value.trim(),
    company_address: companyAddressInput.value.trim(),
    company_zip_city: companyZipCityInput.value.trim(),
    company_country: companyCountryInput.value.trim(),
  };
  for (const [key, value] of Object.entries(fields)) {
    await store.saveSetting(key, value);
  }
}

const tabs = computed(() => [
  {
    key: 'stock',
    label: 'Stock',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 7 7 4 3 6c0 4 3 8 9 6"/><path d="M12 12c0-5 5-8 9-6 0 4-3 8-9 6"/></svg>',
    count: store.stock.length,
  },
  {
    key: 'suppliers',
    label: 'Fournisseurs',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    count: store.suppliers.length,
  },
  {
    key: 'orders',
    label: 'Commandes',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    count: store.pendingOrders.length,
  },
  {
    key: 'settings',
    label: 'Réglages',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  },
]);


// Exploitations pour le select
const exploitations = computed(() => soilBoardsStore.exploitations);

// Filtrage du stock
const filteredStock = computed(() => {
  const q = stockSearch.value.toLowerCase().trim();
  return q
    ? store.stock.filter((s) => s.vegetable.vegetable_name.toLowerCase().includes(q))
    : store.stock;
});

// Filtrage des commandes (ordre : plus récentes en premier)
const filteredOrders = computed(() => {
  const dateFrom = orderDateFrom.value;
  const dateTo = orderDateTo.value;
  return store.orders.filter((o) => {
    if (orderStatusFilter.value !== 'all' && o.status !== orderStatusFilter.value) return false;
    if (orderSupplierFilter.value !== null && o.supplier.id_supplier !== orderSupplierFilter.value) return false;
    if (dateFrom && o.order_date < dateFrom) return false;
    if (dateTo && o.order_date > dateTo) return false;
    return true;
  });
});

// Variétés selon légume sélectionné (pour le stock modal)
const varietiesForSelected = computed(() => {
  const vegId = store.stockForm.id_vegetable;
  if (!vegId) return [];
  const veg = botanicalStore.vegetables.find((v) => v.id_vegetable === vegId);
  return veg?.varieties ?? botanicalStore.varietiesMap[vegId] ?? [];
});

// Variétés pour l'ajout de ligne de commande
const varietiesForItem = computed(() => {
  const vegId = store.itemForm.id_vegetable;
  if (!vegId) return [];
  const veg = botanicalStore.vegetables.find((v) => v.id_vegetable === vegId);
  return veg?.varieties ?? botanicalStore.varietiesMap[vegId] ?? [];
});

// ── Calcul des totaux HT / TVA / TTC ─────────────────────────────────────────
function orderTotals(items: { quantity_ordered: number; unit_price?: string | null }[]) {
  const tvaRate = parseFloat(String(store.settings['tva_rate'] ?? '0')) || 0;
  let ht: number | null = null;
  for (const item of items) {
    const price = item.unit_price ? parseFloat(String(item.unit_price).replace(',', '.')) : NaN;
    if (!isNaN(price)) ht = (ht ?? 0) + price * item.quantity_ordered;
  }
  if (ht === null) return null;
  const tva = tvaRate > 0 ? ht * tvaRate / 100 : null;
  const ttc = tva !== null ? ht + tva : null;
  return { ht, tva, tvaRate, ttc };
}

function draftTotals() {
  return orderTotals(store.orderDraftItems.map(i => ({
    quantity_ordered: i.quantity_ordered,
    unit_price: i.unit_price,
  })));
}

function formatPrice(v: number) {
  return v.toFixed(2).replace('.', ',') + ' €';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    received: 'Reçue',
    cancelled: 'Annulée',
  };
  return map[status] ?? status;
}

// ── Variétés pour les articles du modal commande ──────────────────────────────
function varietiesForDraftItem(vegetableId: number | null) {
  if (!vegetableId) return [];
  const veg = botanicalStore.vegetables.find((v) => v.id_vegetable === vegetableId);
  return veg?.varieties ?? botanicalStore.varietiesMap[vegetableId] ?? [];
}

function onDraftVegetableChange(item: { id_vegetable: number | null; id_variety: number | null }) {
  item.id_variety = null;
  if (item.id_vegetable) botanicalStore.loadVarieties(item.id_vegetable);
}

// ── Confirmation de réception ─────────────────────────────────────────────────
function confirmReceiveOrder(id: number) {
  const order = store.orders.find((o) => o.id_supplier_order === id);
  if (!order?.items.length) return;
  receiveOrderPending.value = id;
}

// ── Inline confirmations ──────────────────────────────────────────────────────
const deleteStockPending = ref<number | null>(null);
const deleteSupplierPending = ref<number | null>(null);
const deleteOrderPending = ref<number | null>(null);
const receiveOrderPending = ref<number | null>(null);

function confirmDeleteStock(id: number) { deleteStockPending.value = id; }
function doDeleteStock(id: number) { store.deleteStock(id); deleteStockPending.value = null; }

// ── Exports ────────────────────────────────────────────────────────────────────
function exportStockCSV() {
  const headers = ['Légume', 'Variété', 'Quantité', 'Unité', 'Date réception', 'Exploitation', 'Notes'];
  const rows = filteredStock.value.map(s => [
    s.vegetable.vegetable_name,
    s.variety?.variety_name ?? '',
    s.quantity,
    s.unit,
    s.received_date ? formatDate(s.received_date) : '',
    s.exploitation?.exploitation_name ?? 'Global',
    s.notes ?? '',
  ]);

  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escape).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stock-plants-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportStockPDF() {
  const rows = filteredStock.value.map(s => `
    <tr>
      <td>${s.vegetable.vegetable_name}</td>
      <td>${s.variety?.variety_name ?? '—'}</td>
      <td class="num ${s.quantity === 0 ? 'zero' : ''}">${s.quantity}</td>
      <td>${s.unit}</td>
      <td>${s.received_date ? formatDate(s.received_date) : '—'}</td>
      <td>${s.exploitation?.exploitation_name ?? 'Global'}</td>
      <td>${s.notes ?? ''}</td>
    </tr>`).join('');

  const total = filteredStock.value.reduce((sum, s) => sum + s.quantity, 0);
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Stock de plants — ${date}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a2a1a; padding: 2cm; }
  .header { margin-bottom: 1.5rem; border-bottom: 2px solid #274135; padding-bottom: 0.75rem; }
  .header h1 { font-size: 20px; color: #274135; margin-bottom: 4px; }
  .header p { color: #666; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th { background: #274135; color: #fffdf8; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
  td { padding: 7px 10px; border-bottom: 1px solid #e8e0d0; vertical-align: middle; }
  tr:nth-child(even) td { background: #f9f5ed; }
  td.num { text-align: right; font-weight: 700; }
  td.zero { color: #c0392b; }
  .footer { margin-top: 1.5rem; padding-top: 0.75rem; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 10px; color: #888; }
  .summary { margin-top: 0.75rem; font-size: 11px; color: #555; }
  @media print { body { padding: 1cm; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Stock de plants</h1>
    <p>Culturo SaaS — Exporté le ${date}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Légume</th><th>Variété</th><th>Quantité</th><th>Unité</th>
        <th>Date réception</th><th>Exploitation</th><th>Notes</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">${filteredStock.value.length} entrée(s) · Total : ${total} plants</div>
  <div class="footer">
    <span>Culturo SaaS</span>
    <span>${date}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ── Exports Fournisseurs ───────────────────────────────────────────────────────
function exportSuppliersCSV() {
  const headers = ['Nom', 'Email', 'Téléphone', 'Site web', 'Statut'];
  const rows = store.suppliers.map(s => [
    s.supplier_name,
    s.contact_email ?? '',
    s.contact_phone ?? '',
    s.website ?? '',
    s.supplier_active ? 'Actif' : 'Inactif',
  ]);
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escape).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fournisseurs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportSuppliersPDF() {
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const rows = store.suppliers.map(s => `
    <tr>
      <td>${s.supplier_name}</td>
      <td>${s.contact_email ?? '—'}</td>
      <td>${s.contact_phone ?? '—'}</td>
      <td>${s.website ? `<a href="${s.website}">${s.website}</a>` : '—'}</td>
      <td class="${s.supplier_active ? 'active' : 'inactive'}">${s.supplier_active ? 'Actif' : 'Inactif'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Fournisseurs — ${date}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:12px; color:#1a2a1a; padding:2cm; }
  .header { margin-bottom:1.5rem; border-bottom:2px solid #274135; padding-bottom:.75rem; }
  .header h1 { font-size:20px; color:#274135; margin-bottom:4px; }
  .header p { color:#666; font-size:11px; }
  table { width:100%; border-collapse:collapse; margin-top:1rem; }
  th { background:#274135; color:#fffdf8; text-align:left; padding:8px 10px; font-size:10px; text-transform:uppercase; letter-spacing:.06em; }
  td { padding:7px 10px; border-bottom:1px solid #e8e0d0; }
  tr:nth-child(even) td { background:#f9f5ed; }
  td.active { color:#2d6e22; font-weight:700; }
  td.inactive { color:#888; }
  .footer { margin-top:1.5rem; padding-top:.75rem; border-top:1px solid #ccc; display:flex; justify-content:space-between; font-size:10px; color:#888; }
  @media print { body { padding:1cm; } }
</style></head><body>
  <div class="header"><h1>Fournisseurs</h1><p>Culturo SaaS — Exporté le ${date}</p></div>
  <table>
    <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Site web</th><th>Statut</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer"><span>Culturo SaaS</span><span>${date}</span></div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ── Exports Commandes ──────────────────────────────────────────────────────────
function exportOrdersCSV() {
  const headers = ['Fournisseur', 'Date commande', 'Livraison prévue', 'Statut', 'Légume', 'Variété', 'Commandé', 'Reçu', 'Unité', 'Prix unit.', 'Notes commande'];
  const rows: (string | number)[][] = [];

  for (const order of filteredOrders.value) {
    if (order.items.length === 0) {
      rows.push([
        order.supplier.supplier_name,
        formatDate(order.order_date),
        order.expected_date ? formatDate(order.expected_date) : '',
        statusLabel(order.status),
        '', '', '', '', '', '',
        order.notes ?? '',
      ]);
    } else {
      for (const item of order.items) {
        rows.push([
          order.supplier.supplier_name,
          formatDate(order.order_date),
          order.expected_date ? formatDate(order.expected_date) : '',
          statusLabel(order.status),
          item.vegetable.vegetable_name,
          item.variety?.variety_name ?? '',
          item.quantity_ordered,
          item.quantity_received,
          item.unit,
          item.unit_price ?? '',
          order.notes ?? '',
        ]);
      }
    }
  }

  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escape).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportOrdersPDF() {
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const orderBlocks = filteredOrders.value.map(order => {
    const itemRows = order.items.map(item => `
      <tr>
        <td>${item.vegetable.vegetable_name}</td>
        <td>${item.variety?.variety_name ?? '—'}</td>
        <td class="num">${item.quantity_ordered}</td>
        <td class="num">${item.quantity_received}</td>
        <td>${item.unit}</td>
        <td>${item.unit_price ?? '—'}</td>
      </tr>`).join('');

    const itemsTable = order.items.length
      ? `<table class="items-table">
          <thead><tr><th>Légume</th><th>Variété</th><th>Commandé</th><th>Reçu</th><th>Unité</th><th>Prix unit.</th></tr></thead>
          <tbody>${itemRows}</tbody>
         </table>`
      : `<p class="no-items">Aucune ligne</p>`;

    return `<div class="order-block">
      <div class="order-head">
        <div>
          <span class="order-supplier">${order.supplier.supplier_name}</span>
          <span class="order-dates">Commandé le ${formatDate(order.order_date)}${order.expected_date ? ' · Livraison prévue ' + formatDate(order.expected_date) : ''}</span>
        </div>
        <span class="status-badge status-${order.status}">${statusLabel(order.status)}</span>
      </div>
      ${order.notes ? `<p class="order-notes">📝 ${order.notes}</p>` : ''}
      ${itemsTable}
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Commandes fournisseurs — ${date}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:12px; color:#1a2a1a; padding:2cm; }
  .header { margin-bottom:1.5rem; border-bottom:2px solid #274135; padding-bottom:.75rem; }
  .header h1 { font-size:20px; color:#274135; margin-bottom:4px; }
  .header p { color:#666; font-size:11px; }
  .order-block { margin-bottom:1.5rem; padding:1rem; border:1px solid #d8d0c0; border-radius:8px; break-inside:avoid; }
  .order-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.75rem; }
  .order-supplier { font-weight:700; font-size:13px; display:block; color:#274135; }
  .order-dates { font-size:10px; color:#888; margin-top:2px; display:block; }
  .order-notes { font-size:11px; color:#555; margin-bottom:.6rem; }
  .status-badge { font-size:9px; font-weight:700; padding:3px 8px; border-radius:999px; text-transform:uppercase; letter-spacing:.06em; flex-shrink:0; }
  .status-draft { background:#f0e8d0; color:#7a5a10; border:1px solid #d4b86a; }
  .status-sent { background:#d8eaf8; color:#1a5a9a; border:1px solid #7ab0d8; }
  .status-received { background:#d8f0d8; color:#1a6a1a; border:1px solid #6ab86a; }
  .status-cancelled { background:#f0d8d8; color:#8a1a1a; border:1px solid #c88080; }
  table.items-table { width:100%; border-collapse:collapse; }
  .items-table th { background:#274135; color:#fffdf8; text-align:left; padding:6px 8px; font-size:10px; text-transform:uppercase; }
  .items-table td { padding:5px 8px; border-bottom:1px solid #e8e0d0; }
  .items-table tr:nth-child(even) td { background:#f9f5ed; }
  td.num { text-align:right; }
  .no-items { font-size:11px; color:#aaa; font-style:italic; }
  .footer { margin-top:1.5rem; padding-top:.75rem; border-top:1px solid #ccc; display:flex; justify-content:space-between; font-size:10px; color:#888; }
  @media print { body { padding:1cm; } .order-block { break-inside:avoid; } }
</style></head><body>
  <div class="header"><h1>Commandes fournisseurs</h1><p>Culturo SaaS — Exporté le ${date}</p></div>
  ${orderBlocks}
  <div class="footer"><span>Culturo SaaS</span><span>${date}</span></div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

function confirmDeleteSupplier(id: number) { deleteSupplierPending.value = id; }
async function doDeleteSupplier(id: number) { await store.deleteSupplier(id); deleteSupplierPending.value = null; }

function confirmDeleteOrder(id: number) { deleteOrderPending.value = id; }
async function doDeleteOrder(id: number) { await store.deleteOrder(id); deleteOrderPending.value = null; }

async function doReceiveOrder(id: number) {
  await store.updateOrderStatus(id, 'received');
  receiveOrderPending.value = null;
  if (!store.error) activeTab.value = 'stock';
}

// Rechargement automatique au changement d'onglet
watch(activeTab, async (tab) => {
  if (tab === 'stock') await store.loadStock();
  else if (tab === 'suppliers') await store.loadSuppliers();
  else if (tab === 'orders') await store.loadOrders();
  else if (tab === 'settings') {
    await store.loadSettings();
    tvaRateInput.value = store.settings['tva_rate'] ?? '20';
    contactEmailInput.value = store.settings['contact_email'] ?? '';
    companyNameInput.value = store.settings['company_name'] ?? '';
    companyAddressInput.value = store.settings['company_address'] ?? '';
    companyZipCityInput.value = store.settings['company_zip_city'] ?? '';
    companyCountryInput.value = store.settings['company_country'] ?? '';
  }
});

onMounted(async () => {
  await Promise.all([
    store.loadAll(),
    botanicalStore.loadAll(),
    soilBoardsStore.loadAll(),
  ]);
  tvaRateInput.value = store.settings['tva_rate'] ?? '20';
  contactEmailInput.value = store.settings['contact_email'] ?? '';
  companyNameInput.value = store.settings['company_name'] ?? '';
  companyAddressInput.value = store.settings['company_address'] ?? '';
  companyZipCityInput.value = store.settings['company_zip_city'] ?? '';
  companyCountryInput.value = store.settings['company_country'] ?? '';
});
</script>

<style scoped>
.plant-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #1a2e1a);
  margin-bottom: 0.25rem;
}

.page-sub {
  color: var(--text-muted, #6b7280);
  font-size: 0.9rem;
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid rgba(39, 65, 53, 0.1);
  margin-bottom: 1.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.25rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted, #6b7280);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 160ms, border-color 160ms;
}

.tab-btn:hover { color: var(--brand-olive, #3a5c2e); }
.tab-btn.active {
  color: var(--brand-olive, #3a5c2e);
  border-bottom-color: var(--brand-olive, #3a5c2e);
  font-weight: 700;
}

.tab-icon { display: inline-flex; align-items: center; }

.tab-count {
  background: var(--brand-olive, #3a5c2e);
  color: #fff;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.88rem;
}
.error-banner button {
  background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #b91c1c;
}

/* Toolbar */
.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border: 1.5px solid rgba(39, 65, 53, 0.22);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  color: var(--brand-deep, #274135);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 140ms, border-color 140ms;
}
.export-btn:hover {
  background: rgba(39, 65, 53, 0.07);
  border-color: rgba(39, 65, 53, 0.4);
}

.search-input, .form-input, .form-select {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid rgba(39, 65, 53, 0.18);
  border-radius: 10px;
  font-size: 0.88rem;
  background: #fff;
  outline: none;
  transition: border-color 160ms;
}
.search-input { min-width: 220px; }
.search-input:focus, .form-input:focus, .form-select:focus {
  border-color: var(--brand-olive, #3a5c2e);
}

.toolbar-info { font-size: 0.88rem; color: var(--text-muted, #6b7280); }

/* States */
.loading-state { text-align: center; padding: 2rem; color: var(--text-muted, #6b7280); }
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted, #6b7280);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* Table */
.stock-table-wrap { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.data-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--text-muted, #6b7280);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1.5px solid rgba(39, 65, 53, 0.1);
}
.data-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.07);
}
.data-table tr:hover td { background: rgba(39, 65, 53, 0.03); }

.row-low td { opacity: 0.6; }
.cell-veg { font-weight: 600; }
.cell-qty { font-weight: 700; }
.qty-zero { color: #dc2626; }
.cell-notes { color: var(--text-muted, #6b7280); font-size: 0.82rem; max-width: 160px; }

.cell-actions { white-space: nowrap; }
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 100ms;
}
.btn-icon:hover { background: rgba(39, 65, 53, 0.08); }
.btn-icon.btn-danger:hover { background: rgba(220, 38, 38, 0.08); }

/* Suppliers grid */
.suppliers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.supplier-card {
  background: #fff;
  border: 1.5px solid rgba(39, 65, 53, 0.12);
  border-radius: 16px;
  padding: 1.1rem 1.25rem;
  transition: box-shadow 160ms;
}
.supplier-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
.supplier-card.inactive { opacity: 0.6; }

.supplier-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.supplier-name { font-weight: 700; font-size: 0.95rem; }
.supplier-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}
.badge-active { background: #d1fae5; color: #065f46; }
.badge-inactive { background: #f3f4f6; color: #6b7280; }

.supplier-card-body { font-size: 0.85rem; color: var(--text-muted, #6b7280); margin-bottom: 0.75rem; }
.supplier-card-body p { margin-bottom: 0.2rem; }
.supplier-link { color: var(--brand-olive, #3a5c2e); text-decoration: none; display: block; }
.supplier-link:hover { text-decoration: underline; }

.supplier-card-actions { display: flex; gap: 0.5rem; }

.btn-sm {
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid rgba(39, 65, 53, 0.18);
  background: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary, #1a2e1a);
  transition: background 120ms, border-color 120ms;
}
.btn-sm:hover { background: rgba(39, 65, 53, 0.05); }
.btn-sm-danger { border-color: rgba(220, 38, 38, 0.25); color: #dc2626; }
.btn-sm-danger:hover { background: rgba(220, 38, 38, 0.05); }
.btn-sm-action { border-color: rgba(180, 120, 0, 0.3); color: #92600a; }
.btn-sm-action:hover { background: rgba(180, 120, 0, 0.05); }
.btn-sm-success { border-color: rgba(22, 163, 74, 0.3); color: #166534; }
.btn-sm-success:hover { background: rgba(22, 163, 74, 0.05); }

/* Bouton réception prominent */
.btn-receive {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  background: linear-gradient(135deg, #166534, #14532d);
  color: #f0fdf4;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.3);
  transition: opacity 140ms, transform 140ms;
}
.btn-receive:hover { opacity: 0.88; transform: translateY(-1px); }

/* Modal wide */
.modal-box-wide { max-width: 800px !important; }

/* Draft items table in order modal */
.draft-items-section {
  margin-top: 1rem;
  border-top: 1px solid rgba(39, 65, 53, 0.1);
  padding-top: 1rem;
}
.draft-items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.draft-items-title {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.65);
}
.btn-add-row {
  padding: 0.3rem 0.75rem;
  border: 1.5px dashed rgba(39, 65, 53, 0.3);
  border-radius: 8px;
  background: transparent;
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(39, 65, 53, 0.7);
  cursor: pointer;
  transition: background 140ms, border-color 140ms;
}
.btn-add-row:hover { background: rgba(39, 65, 53, 0.05); border-color: rgba(39, 65, 53, 0.5); }
.draft-items-table-wrap { overflow-x: auto; }
.draft-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.draft-items-table th {
  padding: 5px 8px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(39, 65, 53, 0.55);
  border-bottom: 1px solid rgba(39, 65, 53, 0.1);
}
.draft-items-table td {
  padding: 4px 4px;
  vertical-align: middle;
  border-bottom: 1px solid rgba(39, 65, 53, 0.06);
}

/* Totaux dans le modal */
.draft-totals {
  margin-top: .75rem;
  border: 1px solid rgba(39,65,53,.12);
  border-radius: 8px;
  overflow: hidden;
  font-size: .9rem;
  align-self: flex-end;
  min-width: 240px;
  float: right;
}
.draft-totals-row {
  display: flex;
  justify-content: space-between;
  padding: .5rem .9rem;
  border-bottom: 1px solid rgba(39,65,53,.07);
}
.draft-totals-row:last-child { border-bottom: none; }
.draft-totals-tva { color: #777; font-size: .85rem; }
.draft-totals-ttc { background: rgba(39,65,53,.06); font-weight: 700; font-size: .95rem; }

/* Totaux dans les cartes commande */
.col-total { text-align: right; }
tfoot .tfoot-label {
  text-align: right;
  padding: .5rem .75rem;
  font-size: .85rem;
  color: #555;
}
tfoot .tfoot-value {
  text-align: right;
  padding: .5rem .75rem;
  font-size: .85rem;
}
tfoot .tfoot-ht { background: rgba(39,65,53,.04); }
tfoot .tfoot-tva { color: #777; font-size: .8rem; }
tfoot .tfoot-ttc {
  background: rgba(39,65,53,.08);
  font-weight: 700;
}
tfoot .tfoot-ttc .tfoot-label,
tfoot .tfoot-ttc .tfoot-value { font-size: .95rem; color: #1b4332; }
.cell-select {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(39, 65, 53, 0.18);
  border-radius: 7px;
  font-size: 0.84rem;
  background: #fff;
  outline: none;
  min-width: 110px;
}
.cell-input {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(39, 65, 53, 0.18);
  border-radius: 7px;
  font-size: 0.84rem;
  background: #fff;
  outline: none;
}
.cell-qty { max-width: 70px; text-align: right; }
.cell-unit { max-width: 90px; }
.cell-price { max-width: 80px; }
.btn-remove-row {
  padding: 0.2rem 0.5rem;
  border: none;
  background: none;
  color: rgba(220, 38, 38, 0.7);
  font-size: 1rem;
  cursor: pointer;
  border-radius: 5px;
  transition: background 120ms;
}
.btn-remove-row:hover { background: rgba(220, 38, 38, 0.08); }

/* Orders — layout */
.orders-header {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.orders-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.orders-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.orders-row-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.55rem 0.75rem;
  background: rgba(39, 65, 53, 0.04);
  border: 1px solid rgba(39, 65, 53, 0.1);
  border-radius: 8px;
}

.status-filters { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.filter-pill {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid rgba(39, 65, 53, 0.15);
  background: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-muted, #6b7280);
  transition: all 120ms;
}
.filter-pill:hover, .filter-pill.active {
  background: var(--brand-olive, #3a5c2e);
  border-color: var(--brand-olive, #3a5c2e);
  color: #fff;
}

.toolbar-sep {
  width: 1px;
  height: 1.5rem;
  background: rgba(39, 65, 53, 0.15);
  flex-shrink: 0;
}

.filter-inline-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.filter-inline-label {
  font-size: 0.78rem;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
}
.filter-date-inline {
  height: 2rem;
  padding: 0 0.45rem;
  border: 1.5px solid rgba(39, 65, 53, 0.18);
  border-radius: 6px;
  background: #fff;
  font-size: 0.8rem;
  color: #1f2937;
  cursor: pointer;
  transition: border-color 120ms;
  width: 130px;
}
.filter-date-inline:focus {
  outline: none;
  border-color: var(--brand-olive, #3a5c2e);
}

.filter-select-inline {
  height: 2rem;
  padding: 0 0.5rem;
  border: 1.5px solid rgba(39, 65, 53, 0.18);
  border-radius: 6px;
  background: #fff;
  font-size: 0.8rem;
  color: #1f2937;
  cursor: pointer;
  transition: border-color 120ms;
  max-width: 170px;
}
.filter-select-inline:focus {
  outline: none;
  border-color: var(--brand-olive, #3a5c2e);
}

.reset-filters-btn {
  height: 2rem;
  width: 2rem;
  padding: 0;
  border-radius: 6px;
  border: 1.5px solid rgba(220, 38, 38, 0.3);
  background: rgba(220, 38, 38, 0.06);
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 120ms;
  flex-shrink: 0;
}
.reset-filters-btn:hover {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}

.toolbar-spacer {
  flex: 1;
}

.orders-count {
  font-size: 0.78rem;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
}


.orders-list { display: flex; flex-direction: column; gap: 1rem; }

.order-card {
  background: #fff;
  border: 1.5px solid rgba(39, 65, 53, 0.12);
  border-radius: 16px;
  padding: 1.1rem 1.25rem;
}

.order-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.85rem;
  gap: 1rem;
}
.order-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: center; }
.order-supplier { font-weight: 700; font-size: 0.95rem; }
.order-date, .order-expected { font-size: 0.82rem; color: var(--text-muted, #6b7280); }

.order-status-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-draft { background: #f3f4f6; color: #374151; }
.status-sent { background: #fef9c3; color: #92600a; }
.status-received { background: #d1fae5; color: #065f46; }
.status-cancelled { background: #fee2e2; color: #991b1b; }

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
  margin-bottom: 0.75rem;
}
.items-table th {
  text-align: left;
  padding: 0.35rem 0.6rem;
  font-weight: 600;
  font-size: 0.74rem;
  text-transform: uppercase;
  color: var(--text-muted, #6b7280);
  border-bottom: 1px solid rgba(39, 65, 53, 0.08);
}
.items-table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.05);
}

.order-empty-items {
  font-size: 0.83rem;
  color: var(--text-muted, #6b7280);
  font-style: italic;
  margin-bottom: 0.75rem;
}

.order-notes {
  font-size: 0.83rem;
  color: var(--text-muted, #6b7280);
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(39, 65, 53, 0.04);
  border-radius: 8px;
}

.order-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(39, 65, 53, 0.07);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.1);
}
.modal-header h3 { font-size: 1rem; font-weight: 700; }
.modal-close {
  background: none; border: none; font-size: 1.4rem; cursor: pointer;
  color: var(--text-muted, #6b7280); line-height: 1; padding: 0;
}

.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-muted, #6b7280); }
.form-input, .form-select { width: 100%; box-sizing: border-box; }
.form-textarea { resize: vertical; }
.form-check { flex-direction: row; align-items: center; gap: 0.5rem; }
.form-check label { font-size: 0.88rem; color: var(--text-primary, #1a2e1a); }
.form-error { font-size: 0.83rem; color: #dc2626; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(39, 65, 53, 0.1);
}

/* ── Réglages ────────────────────────────────────────────────────────── */
.settings-page { max-width: 760px; }
.settings-title { font-size: 1.1rem; font-weight: 700; color: var(--color-primary, #274135); margin: 0 0 1.5rem; }
.settings-group { background: white; border: 1px solid rgba(39,65,53,.12); border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; }
.settings-group-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #888; padding: .75rem 1.25rem; background: rgba(39,65,53,.04); border-bottom: 1px solid rgba(39,65,53,.08); margin: 0; }
.settings-row { display: flex; gap: 2rem; padding: 1.5rem 1.25rem; align-items: flex-start; flex-wrap: wrap; }
.settings-field { flex: 1; min-width: 260px; }
.settings-label { display: block; font-weight: 600; font-size: .92rem; margin-bottom: .35rem; color: #333; }
.settings-hint { font-size: .82rem; color: #888; margin: 0 0 .85rem; line-height: 1.4; }
.settings-input-row { display: flex; align-items: center; gap: .5rem; }
.settings-input { width: 100px; padding: .5rem .75rem; border: 1.5px solid rgba(39,65,53,.2); border-radius: 8px; font-size: 1rem; text-align: right; }
.settings-input:focus { outline: none; border-color: var(--color-primary, #274135); }
.settings-unit { font-weight: 600; color: #555; }
.btn-save-setting { padding: .5rem 1.1rem; background: var(--color-primary, #274135); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity .15s; }
.btn-save-setting:disabled { opacity: .6; cursor: not-allowed; }
.settings-success { margin-top: .5rem; color: #2d8a3e; font-size: .85rem; font-weight: 600; }
.settings-error { margin-top: .5rem; color: #c0392b; font-size: .85rem; }

.settings-preview { min-width: 200px; }
.settings-preview-title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #aaa; margin: 0 0 .5rem; }
.settings-preview-box { border: 1px solid rgba(39,65,53,.12); border-radius: 8px; overflow: hidden; font-size: .9rem; }
.preview-row { display: flex; justify-content: space-between; padding: .5rem .85rem; border-bottom: 1px solid rgba(39,65,53,.07); }
.preview-row:last-child { border-bottom: none; }
.preview-tva { color: #777; font-size: .85rem; }
.preview-ttc { background: rgba(39,65,53,.06); font-weight: 700; }

/* ── Stock summary ──────────────────────────────────────────────────── */
.stock-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(39, 65, 53, 0.05);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  font-size: 0.82rem;
  color: #374151;
}
.stock-summary-sep { color: #9ca3af; }
.stock-summary-warn { color: #b45309; font-weight: 600; }

/* ── Inline confirmations ───────────────────────────────────────────── */
.inline-confirm-text {
  font-size: 0.78rem;
  color: #dc2626;
  font-weight: 600;
  margin-right: 0.25rem;
}

/* ── Suppliers ──────────────────────────────────────────────────────── */
.supplier-orders-count {
  font-size: 0.78rem;
  color: var(--brand-olive, #3a5c2e);
  cursor: pointer;
  margin-top: 0.35rem;
}
.supplier-orders-count:hover { text-decoration: underline; }
.btn-sm-link {
  background: transparent;
  border: 1.5px solid rgba(39, 65, 53, 0.2);
  color: var(--brand-olive, #3a5c2e);
  font-weight: 600;
}
.btn-sm-link:hover { background: rgba(39, 65, 53, 0.07); }

/* ── Order collapse ─────────────────────────────────────────────────── */
.order-collapse-icon {
  font-size: 0.65rem;
  color: #9ca3af;
  margin-right: 0.35rem;
}
.order-items-count {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: 0.5rem;
}

/* ── Inline receive confirmation ────────────────────────────────────── */
.inline-receive-confirm {
  margin-bottom: 1.25rem;
  padding: 1.25rem;
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 10px;
}
.inline-receive-title {
  font-size: 1rem;
  font-weight: 700;
  color: #166534;
  margin-bottom: 0.35rem;
}
.inline-receive-sub {
  font-size: 0.83rem;
  color: #15803d;
  margin-bottom: 0.75rem;
}
.inline-receive-items {
  list-style: disc;
  padding-left: 1.25rem;
  font-size: 0.83rem;
  color: #1f2937;
  margin-bottom: 0.85rem;
  line-height: 1.7;
}
.inline-receive-actions { display: flex; gap: 0.6rem; align-items: center; }

/* ── Settings redesign ──────────────────────────────────────────────── */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.settings-save-bar { display: flex; align-items: center; gap: 0.75rem; }
.settings-group-hint {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.85rem;
  margin-top: -0.25rem;
}
.settings-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.85rem 1.25rem;
}
</style>
