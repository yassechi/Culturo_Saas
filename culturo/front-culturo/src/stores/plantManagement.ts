import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { apiMessage } from '@/utils/apiError';
import {
  suppliersApi,
  plantStockApi,
  supplierOrdersApi,
  type ApiSupplier,
  type ApiPlantStock,
  type ApiSupplierOrder,
  type CreateStockPayload,
  type CreateOrderPayload,
  type AddItemPayload,
} from '@/api/plantManagement';

// ── Supplier form ──────────────────────────────────────────────────────────

export interface SupplierForm {
  supplier_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  supplier_active: boolean;
}

function emptySupplierForm(): SupplierForm {
  return { supplier_name: '', contact_email: '', contact_phone: '', website: '', supplier_active: true };
}

// ── Stock form ─────────────────────────────────────────────────────────────

export interface StockForm {
  id_vegetable: number | null;
  id_variety: number | null;
  id_exploitation: number | null;
  quantity: number;
  unit: string;
  received_date: string;
  notes: string;
}

function emptyStockForm(): StockForm {
  return {
    id_vegetable: null, id_variety: null, id_exploitation: null,
    quantity: 1, unit: 'plants', received_date: new Date().toISOString().split('T')[0], notes: '',
  };
}

// ── Order form ─────────────────────────────────────────────────────────────

export interface OrderForm {
  id_supplier: number | null;
  order_date: string;
  expected_date: string;
  notes: string;
}

function emptyOrderForm(): OrderForm {
  return {
    id_supplier: null,
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    notes: '',
  };
}

export interface OrderItemForm {
  id_vegetable: number | null;
  id_variety: number | null;
  quantity_ordered: number;
  unit: string;
  unit_price: string;
}

function emptyItemForm(): OrderItemForm {
  return { id_vegetable: null, id_variety: null, quantity_ordered: 1, unit: 'plants', unit_price: '' };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const usePlantManagementStore = defineStore('plantManagement', () => {
  // State
  const suppliers = ref<ApiSupplier[]>([]);
  const stock = ref<ApiPlantStock[]>([]);
  const orders = ref<ApiSupplierOrder[]>([]);

  const loadingSuppliers = ref(false);
  const loadingStock = ref(false);
  const loadingOrders = ref(false);

  const error = ref<string | null>(null);

  // ── Supplier modal ───────────────────────────────────────────────────────
  const supplierModalOpen = ref(false);
  const supplierModalMode = ref<'create' | 'edit'>('create');
  const supplierModalId = ref<number | null>(null);
  const supplierForm = ref<SupplierForm>(emptySupplierForm());
  const supplierModalError = ref<string | null>(null);
  const supplierModalLoading = ref(false);

  // ── Stock modal ──────────────────────────────────────────────────────────
  const stockModalOpen = ref(false);
  const stockModalMode = ref<'create' | 'edit'>('create');
  const stockModalId = ref<number | null>(null);
  const stockForm = ref<StockForm>(emptyStockForm());
  const stockModalError = ref<string | null>(null);
  const stockModalLoading = ref(false);

  // ── Order modal ──────────────────────────────────────────────────────────
  const orderModalOpen = ref(false);
  const orderModalMode = ref<'create' | 'edit'>('create');
  const orderModalId = ref<number | null>(null);
  const orderForm = ref<OrderForm>(emptyOrderForm());
  const orderModalError = ref<string | null>(null);
  const orderModalLoading = ref(false);

  // Add item panel
  const addItemOpen = ref(false);
  const addItemOrderId = ref<number | null>(null);
  const itemForm = ref<OrderItemForm>(emptyItemForm());
  const itemFormError = ref<string | null>(null);
  const itemFormLoading = ref(false);

  // ── Getters ──────────────────────────────────────────────────────────────

  const activeSuppliers = computed(() => suppliers.value.filter((s) => s.supplier_active));

  const stockByVegetable = computed(() => {
    const map = new Map<number, number>();
    for (const s of stock.value) {
      map.set(s.vegetable.id_vegetable, (map.get(s.vegetable.id_vegetable) ?? 0) + s.quantity);
    }
    return map;
  });

  const pendingOrders = computed(() =>
    orders.value.filter((o) => o.status === 'draft' || o.status === 'sent'),
  );

  // ── Load ─────────────────────────────────────────────────────────────────

  async function loadSuppliers() {
    loadingSuppliers.value = true;
    try {
      const res = await suppliersApi.getAll();
      suppliers.value = res.data;
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de charger les fournisseurs.');
    } finally {
      loadingSuppliers.value = false;
    }
  }

  async function loadStock(exploitationId?: number) {
    loadingStock.value = true;
    try {
      const res = await plantStockApi.getAll(exploitationId);
      stock.value = res.data;
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de charger le stock.');
    } finally {
      loadingStock.value = false;
    }
  }

  async function loadOrders() {
    loadingOrders.value = true;
    try {
      const res = await supplierOrdersApi.getAll();
      orders.value = res.data;
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de charger les commandes.');
    } finally {
      loadingOrders.value = false;
    }
  }

  async function loadAll() {
    await Promise.all([loadSuppliers(), loadStock(), loadOrders()]);
  }

  // ── Supplier CRUD ────────────────────────────────────────────────────────

  function openCreateSupplier() {
    supplierModalMode.value = 'create';
    supplierModalId.value = null;
    supplierForm.value = emptySupplierForm();
    supplierModalError.value = null;
    supplierModalOpen.value = true;
  }

  function openEditSupplier(s: ApiSupplier) {
    supplierModalMode.value = 'edit';
    supplierModalId.value = s.id_supplier;
    supplierForm.value = {
      supplier_name: s.supplier_name,
      contact_email: s.contact_email ?? '',
      contact_phone: s.contact_phone ?? '',
      website: s.website ?? '',
      supplier_active: s.supplier_active,
    };
    supplierModalError.value = null;
    supplierModalOpen.value = true;
  }

  function closeSupplierModal() {
    supplierModalOpen.value = false;
    supplierModalError.value = null;
  }

  async function submitSupplierModal() {
    if (!supplierForm.value.supplier_name.trim()) {
      supplierModalError.value = 'Le nom du fournisseur est requis.';
      return;
    }
    supplierModalLoading.value = true;
    supplierModalError.value = null;
    try {
      const payload = {
        supplier_name: supplierForm.value.supplier_name.trim(),
        contact_email: supplierForm.value.contact_email.trim() || null,
        contact_phone: supplierForm.value.contact_phone.trim() || null,
        website: supplierForm.value.website.trim() || null,
        supplier_active: supplierForm.value.supplier_active,
      };
      if (supplierModalMode.value === 'create') {
        const res = await suppliersApi.create(payload);
        suppliers.value.push(res.data);
      } else if (supplierModalId.value !== null) {
        const res = await suppliersApi.update(supplierModalId.value, payload);
        const idx = suppliers.value.findIndex((s) => s.id_supplier === supplierModalId.value);
        if (idx !== -1) suppliers.value[idx] = res.data;
      }
      closeSupplierModal();
    } catch (e: unknown) {
      supplierModalError.value = apiMessage(e, 'Une erreur est survenue.');
    } finally {
      supplierModalLoading.value = false;
    }
  }

  async function deleteSupplier(id: number) {
    try {
      await suppliersApi.remove(id);
      suppliers.value = suppliers.value.filter((s) => s.id_supplier !== id);
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de supprimer ce fournisseur.');
    }
  }

  // ── Stock CRUD ───────────────────────────────────────────────────────────

  function openCreateStock() {
    stockModalMode.value = 'create';
    stockModalId.value = null;
    stockForm.value = emptyStockForm();
    stockModalError.value = null;
    stockModalOpen.value = true;
  }

  function openEditStock(s: ApiPlantStock) {
    stockModalMode.value = 'edit';
    stockModalId.value = s.id_stock;
    stockForm.value = {
      id_vegetable: s.vegetable.id_vegetable,
      id_variety: s.variety?.id_variety ?? null,
      id_exploitation: s.exploitation?.id_exploitation ?? null,
      quantity: s.quantity,
      unit: s.unit,
      received_date: s.received_date ?? '',
      notes: s.notes ?? '',
    };
    stockModalError.value = null;
    stockModalOpen.value = true;
  }

  function closeStockModal() {
    stockModalOpen.value = false;
    stockModalError.value = null;
  }

  async function submitStockModal() {
    if (!stockForm.value.id_vegetable) {
      stockModalError.value = 'Veuillez choisir un légume.';
      return;
    }
    if (stockForm.value.quantity < 0) {
      stockModalError.value = 'La quantité doit être positive.';
      return;
    }
    stockModalLoading.value = true;
    stockModalError.value = null;
    try {
      const payload: CreateStockPayload = {
        id_vegetable: stockForm.value.id_vegetable,
        id_variety: stockForm.value.id_variety ?? undefined,
        id_exploitation: stockForm.value.id_exploitation ?? undefined,
        quantity: Number(stockForm.value.quantity),
        unit: stockForm.value.unit,
        received_date: stockForm.value.received_date || undefined,
        notes: stockForm.value.notes.trim() || undefined,
      };
      if (stockModalMode.value === 'create') {
        const res = await plantStockApi.create(payload);
        stock.value.push(res.data);
      } else if (stockModalId.value !== null) {
        const res = await plantStockApi.update(stockModalId.value, payload);
        const idx = stock.value.findIndex((s) => s.id_stock === stockModalId.value);
        if (idx !== -1) stock.value[idx] = res.data;
      }
      closeStockModal();
    } catch (e: unknown) {
      stockModalError.value = apiMessage(e, 'Une erreur est survenue.');
    } finally {
      stockModalLoading.value = false;
    }
  }

  async function deleteStock(id: number) {
    try {
      await plantStockApi.remove(id);
      stock.value = stock.value.filter((s) => s.id_stock !== id);
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de supprimer cette entrée.');
    }
  }

  // ── Order CRUD ───────────────────────────────────────────────────────────

  function openCreateOrder() {
    orderModalMode.value = 'create';
    orderModalId.value = null;
    orderForm.value = emptyOrderForm();
    orderModalError.value = null;
    orderModalOpen.value = true;
  }

  function openEditOrder(o: ApiSupplierOrder) {
    orderModalMode.value = 'edit';
    orderModalId.value = o.id_supplier_order;
    orderForm.value = {
      id_supplier: o.supplier.id_supplier,
      order_date: o.order_date,
      expected_date: o.expected_date ?? '',
      notes: o.notes ?? '',
    };
    orderModalError.value = null;
    orderModalOpen.value = true;
  }

  function closeOrderModal() {
    orderModalOpen.value = false;
    orderModalError.value = null;
  }

  async function submitOrderModal(userId: number) {
    if (!orderForm.value.id_supplier) {
      orderModalError.value = 'Veuillez choisir un fournisseur.';
      return;
    }
    orderModalLoading.value = true;
    orderModalError.value = null;
    try {
      if (orderModalMode.value === 'create') {
        const payload: CreateOrderPayload = {
          id_supplier: orderForm.value.id_supplier,
          id_user: userId,
          order_date: orderForm.value.order_date,
          expected_date: orderForm.value.expected_date || undefined,
          notes: orderForm.value.notes.trim() || undefined,
        };
        const res = await supplierOrdersApi.create(payload);
        orders.value.unshift(res.data);
      } else if (orderModalId.value !== null) {
        const res = await supplierOrdersApi.update(orderModalId.value, {
          order_date: orderForm.value.order_date,
          expected_date: orderForm.value.expected_date || undefined,
          notes: orderForm.value.notes.trim() || undefined,
        });
        const idx = orders.value.findIndex((o) => o.id_supplier_order === orderModalId.value);
        if (idx !== -1) orders.value[idx] = res.data;
      }
      closeOrderModal();
    } catch (e: unknown) {
      orderModalError.value = apiMessage(e, 'Une erreur est survenue.');
    } finally {
      orderModalLoading.value = false;
    }
  }

  async function updateOrderStatus(id: number, status: string) {
    try {
      const res = await supplierOrdersApi.update(id, { status });
      const idx = orders.value.findIndex((o) => o.id_supplier_order === id);
      if (idx !== -1) orders.value[idx] = res.data;
      // Si received → recharger le stock
      if (status === 'received') await loadStock();
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de modifier le statut.');
    }
  }

  async function deleteOrder(id: number) {
    try {
      await supplierOrdersApi.remove(id);
      orders.value = orders.value.filter((o) => o.id_supplier_order !== id);
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de supprimer cette commande.');
    }
  }

  // ── Order items ──────────────────────────────────────────────────────────

  function openAddItem(orderId: number) {
    addItemOrderId.value = orderId;
    itemForm.value = emptyItemForm();
    itemFormError.value = null;
    addItemOpen.value = true;
  }

  function closeAddItem() {
    addItemOpen.value = false;
    itemFormError.value = null;
  }

  async function submitAddItem() {
    if (!itemForm.value.id_vegetable || !addItemOrderId.value) {
      itemFormError.value = 'Veuillez choisir un légume.';
      return;
    }
    itemFormLoading.value = true;
    itemFormError.value = null;
    try {
      const payload: AddItemPayload = {
        id_vegetable: itemForm.value.id_vegetable,
        id_variety: itemForm.value.id_variety ?? undefined,
        quantity_ordered: Number(itemForm.value.quantity_ordered),
        unit: itemForm.value.unit,
        unit_price: itemForm.value.unit_price.trim() || undefined,
      };
      const res = await supplierOrdersApi.addItem(addItemOrderId.value, payload);
      const order = orders.value.find((o) => o.id_supplier_order === addItemOrderId.value);
      if (order) order.items.push(res.data);
      closeAddItem();
    } catch (e: unknown) {
      itemFormError.value = apiMessage(e, 'Une erreur est survenue.');
    } finally {
      itemFormLoading.value = false;
    }
  }

  async function removeOrderItem(orderId: number, itemId: number) {
    try {
      await supplierOrdersApi.removeItem(itemId);
      const order = orders.value.find((o) => o.id_supplier_order === orderId);
      if (order) order.items = order.items.filter((i) => i.id_item !== itemId);
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Impossible de supprimer cette ligne.');
    }
  }

  return {
    // State
    suppliers, stock, orders,
    loadingSuppliers, loadingStock, loadingOrders, error,
    // Getters
    activeSuppliers, stockByVegetable, pendingOrders,
    // Supplier modal
    supplierModalOpen, supplierModalMode, supplierForm, supplierModalError, supplierModalLoading,
    // Stock modal
    stockModalOpen, stockModalMode, stockForm, stockModalError, stockModalLoading,
    // Order modal
    orderModalOpen, orderModalMode, orderForm, orderModalError, orderModalLoading,
    // Add item
    addItemOpen, addItemOrderId, itemForm, itemFormError, itemFormLoading,
    // Actions
    loadAll, loadSuppliers, loadStock, loadOrders,
    openCreateSupplier, openEditSupplier, closeSupplierModal, submitSupplierModal, deleteSupplier,
    openCreateStock, openEditStock, closeStockModal, submitStockModal, deleteStock,
    openCreateOrder, openEditOrder, closeOrderModal, submitOrderModal,
    updateOrderStatus, deleteOrder,
    openAddItem, closeAddItem, submitAddItem, removeOrderItem,
  };
});
