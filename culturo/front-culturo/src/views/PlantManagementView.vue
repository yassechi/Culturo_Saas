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

      <div v-else class="stock-table-wrap">
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
                <button class="btn-icon" title="Modifier" @click="store.openEditStock(s)">✏️</button>
                <button class="btn-icon btn-danger" title="Supprimer" @click="confirmDeleteStock(s.id_stock)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ TAB: FOURNISSEURS ═════════════ -->
    <section v-else-if="activeTab === 'suppliers'" class="tab-content">
      <div class="section-toolbar">
        <span class="toolbar-info">{{ store.suppliers.length }} fournisseur(s)</span>
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
          v-for="s in store.suppliers"
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
            <a v-if="s.website" :href="s.website" target="_blank" rel="noopener" class="supplier-link">
              🌐 {{ s.website }}
            </a>
          </div>
          <div class="supplier-card-actions">
            <button class="btn-sm" @click="store.openEditSupplier(s)">Modifier</button>
            <button class="btn-sm btn-sm-danger" @click="confirmDeleteSupplier(s.id_supplier)">Supprimer</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ TAB: COMMANDES ═══════════════ -->
    <section v-else-if="activeTab === 'orders'" class="tab-content">
      <div class="section-toolbar">
        <div class="status-filters">
          <button
            v-for="f in statusFilters"
            :key="f.value"
            class="filter-pill"
            :class="{ active: orderStatusFilter === f.value }"
            @click="orderStatusFilter = f.value"
          >{{ f.label }}</button>
        </div>
        <div class="toolbar-actions">
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

      <div v-if="store.loadingOrders" class="loading-state">Chargement…</div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <p>Aucune commande.</p>
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in filteredOrders"
          :key="order.id_supplier_order"
          class="order-card"
        >
          <div class="order-card-head">
            <div class="order-meta">
              <span class="order-supplier">{{ order.supplier.supplier_name }}</span>
              <span class="order-date">{{ formatDate(order.order_date) }}</span>
              <span v-if="order.expected_date" class="order-expected">
                Livraison prévue : {{ formatDate(order.expected_date) }}
              </span>
            </div>
            <span class="order-status-badge" :class="`status-${order.status}`">
              {{ statusLabel(order.status) }}
            </span>
          </div>

          <!-- Items list -->
          <table v-if="order.items.length" class="items-table">
            <thead>
              <tr>
                <th>Légume</th>
                <th>Variété</th>
                <th>Commandé</th>
                <th>Reçu</th>
                <th>Unité</th>
                <th>Prix unit.</th>
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
                <td v-if="order.status === 'draft'">
                  <button class="btn-icon btn-danger" @click="store.removeOrderItem(order.id_supplier_order, item.id_item)">🗑</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="order-empty-items">Aucune ligne — ajoutez des légumes à commander.</p>

          <div v-if="order.notes" class="order-notes">📝 {{ order.notes }}</div>

          <div class="order-card-actions">
            <button
              v-if="order.status === 'draft'"
              class="btn-sm"
              @click="store.openAddItem(order.id_supplier_order)"
            >+ Ajouter une ligne</button>

            <button
              v-if="order.status === 'draft'"
              class="btn-sm btn-sm-action"
              @click="store.updateOrderStatus(order.id_supplier_order, 'sent')"
            >📤 Marquer envoyée</button>

            <button
              v-if="order.status === 'sent'"
              class="btn-sm btn-sm-success"
              @click="store.updateOrderStatus(order.id_supplier_order, 'received')"
            >✅ Marquer reçue → stock</button>

            <button
              v-if="order.status === 'draft' || order.status === 'sent'"
              class="btn-sm btn-sm-danger"
              @click="store.updateOrderStatus(order.id_supplier_order, 'cancelled')"
            >Annuler</button>

            <button
              v-if="order.status === 'draft'"
              class="btn-sm"
              @click="store.openEditOrder(order)"
            >✏️ Modifier</button>

            <button
              v-if="order.status !== 'received'"
              class="btn-sm btn-sm-danger"
              @click="confirmDeleteOrder(order.id_supplier_order)"
            >🗑 Supprimer</button>
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
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ store.orderModalMode === 'create' ? 'Nouvelle commande' : 'Modifier la commande' }}</h3>
            <button class="modal-close" @click="store.closeOrderModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Fournisseur *</label>
              <select v-model="store.orderForm.id_supplier" class="form-select">
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
            <p v-if="store.orderModalError" class="form-error">{{ store.orderModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="secondary-button" @click="store.closeOrderModal()">Annuler</button>
            <button class="primary-button" :disabled="store.orderModalLoading" @click="store.submitOrderModal(authStore.user?.id ?? 0)">
              {{ store.orderModalLoading ? 'Enregistrement…' : 'Créer la commande' }}
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
import { ref, computed, onMounted } from 'vue';
import { usePlantManagementStore } from '@/stores/plantManagement';
import { useBotanicalStore } from '@/stores/botanical';
import { useSoilBoardsStore } from '@/stores/soilBoards';
import { useAuthStore } from '@/stores/auth';

const store = usePlantManagementStore();
const botanicalStore = useBotanicalStore();
const soilBoardsStore = useSoilBoardsStore();
const authStore = useAuthStore();

const activeTab = ref<'stock' | 'suppliers' | 'orders'>('stock');
const stockSearch = ref('');
const orderStatusFilter = ref<string>('all');

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
]);

const statusFilters = [
  { value: 'all', label: 'Toutes' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'Envoyées' },
  { value: 'received', label: 'Reçues' },
  { value: 'cancelled', label: 'Annulées' },
];

// Exploitations pour le select
const exploitations = computed(() => soilBoardsStore.exploitations);

// Filtrage du stock
const filteredStock = computed(() => {
  const q = stockSearch.value.toLowerCase().trim();
  return q
    ? store.stock.filter((s) => s.vegetable.vegetable_name.toLowerCase().includes(q))
    : store.stock;
});

// Filtrage des commandes
const filteredOrders = computed(() =>
  orderStatusFilter.value === 'all'
    ? store.orders
    : store.orders.filter((o) => o.status === orderStatusFilter.value),
);

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

function confirmDeleteStock(id: number) {
  if (confirm('Supprimer cette entrée de stock ?')) store.deleteStock(id);
}

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

function confirmDeleteSupplier(id: number) {
  if (confirm('Supprimer ce fournisseur ?')) store.deleteSupplier(id);
}

function confirmDeleteOrder(id: number) {
  if (confirm('Supprimer cette commande ?')) store.deleteOrder(id);
}

onMounted(async () => {
  await Promise.all([
    store.loadAll(),
    botanicalStore.loadAll(),
    soilBoardsStore.loadAll(),
  ]);
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

/* Orders */
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
</style>
