import apiClient from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiSupplier {
  id_supplier: number;
  supplier_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  supplier_active: boolean;
}

export interface ApiPlantStock {
  id_stock: number;
  quantity: number;
  unit: string;
  received_date: string | null;
  notes: string | null;
  vegetable: { id_vegetable: number; vegetable_name: string };
  variety: { id_variety: number; variety_name: string } | null;
  exploitation: { id_exploitation: number; exploitation_name: string } | null;
}

export interface ApiSupplierOrderItem {
  id_item: number;
  quantity_ordered: number;
  quantity_received: number;
  unit: string;
  unit_price: string | null;
  vegetable: { id_vegetable: number; vegetable_name: string };
  variety: { id_variety: number; variety_name: string } | null;
}

export interface ApiSupplierOrder {
  id_supplier_order: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  order_date: string;
  expected_date: string | null;
  notes: string | null;
  supplier: ApiSupplier;
  user_: { id_user: number; email: string };
  items: ApiSupplierOrderItem[];
}

// ── Suppliers API ──────────────────────────────────────────────────────────

export const suppliersApi = {
  getAll: () => apiClient.get<ApiSupplier[]>('/suppliers'),
  getOne: (id: number) => apiClient.get<ApiSupplier>(`/suppliers/${id}`),
  create: (dto: Partial<ApiSupplier>) => apiClient.post<ApiSupplier>('/suppliers', dto),
  update: (id: number, dto: Partial<ApiSupplier>) =>
    apiClient.patch<ApiSupplier>(`/suppliers/${id}`, dto),
  remove: (id: number) => apiClient.delete(`/suppliers/${id}`),
};

// ── Plant Stock API ────────────────────────────────────────────────────────

export interface CreateStockPayload {
  id_vegetable: number;
  id_variety?: number;
  id_exploitation?: number;
  quantity: number;
  unit?: string;
  received_date?: string;
  notes?: string;
}

export const plantStockApi = {
  getAll: (exploitationId?: number) =>
    apiClient.get<ApiPlantStock[]>('/plant-stock', {
      params: exploitationId ? { exploitationId } : undefined,
    }),
  create: (dto: CreateStockPayload) => apiClient.post<ApiPlantStock>('/plant-stock', dto),
  update: (id: number, dto: Partial<CreateStockPayload>) =>
    apiClient.patch<ApiPlantStock>(`/plant-stock/${id}`, dto),
  remove: (id: number) => apiClient.delete(`/plant-stock/${id}`),
};

// ── Supplier Orders API ────────────────────────────────────────────────────

export interface CreateOrderPayload {
  id_supplier: number;
  id_user: number;
  order_date: string;
  expected_date?: string;
  notes?: string;
  items?: {
    id_vegetable: number;
    id_variety?: number;
    quantity_ordered: number;
    unit?: string;
    unit_price?: string;
  }[];
}

export interface AddItemPayload {
  id_vegetable: number;
  id_variety?: number;
  quantity_ordered: number;
  unit?: string;
  unit_price?: string;
}

export const supplierOrdersApi = {
  getAll: () => apiClient.get<ApiSupplierOrder[]>('/supplier-orders'),
  getOne: (id: number) => apiClient.get<ApiSupplierOrder>(`/supplier-orders/${id}`),
  create: (dto: CreateOrderPayload) => apiClient.post<ApiSupplierOrder>('/supplier-orders', dto),
  update: (id: number, dto: { status?: string; order_date?: string; expected_date?: string; notes?: string }) =>
    apiClient.patch<ApiSupplierOrder>(`/supplier-orders/${id}`, dto),
  addItem: (orderId: number, dto: AddItemPayload) =>
    apiClient.post<ApiSupplierOrderItem>(`/supplier-orders/${orderId}/items`, dto),
  removeItem: (itemId: number) => apiClient.delete(`/supplier-orders/items/${itemId}`),
  remove: (id: number) => apiClient.delete(`/supplier-orders/${id}`),
};
