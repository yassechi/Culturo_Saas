import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import apiClient from '@/api/client';

export interface AppNotification {
  id: string;
  type: 'pending_observation' | 'upcoming_harvest' | 'rotation_alert';
  title: string;
  body: string;
  link: string;
  severity: 'info' | 'warning' | 'critical';
}

const STORAGE_KEY = 'culturo:notifications-dismissed';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw) as { date: string; ids: string[] };
    if (date !== new Date().toDateString()) return new Set();
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: new Date().toDateString(), ids: [...set] }),
  );
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([]);
  const loading = ref(false);
  const open = ref(false);
  const dismissed = ref<Set<string>>(loadDismissed());

  const visible = computed(() => items.value.filter((n) => !dismissed.value.has(n.id)));
  const unreadCount = computed(() => visible.value.length);
  const hasCritical = computed(() => visible.value.some((n) => n.severity === 'critical'));

  async function fetch() {
    loading.value = true;
    try {
      const resp = await apiClient.get<AppNotification[]>('/notifications');
      items.value = resp.data ?? [];
    } catch {
      // silently ignore — notification fetch should never block the app
    } finally {
      loading.value = false;
    }
  }

  function dismiss(id: string) {
    const next = new Set([...dismissed.value, id]);
    dismissed.value = next;
    saveDismissed(next);
  }

  function togglePanel() {
    open.value = !open.value;
  }

  function closePanel() {
    open.value = false;
  }

  return { items, loading, open, visible, unreadCount, hasCritical, fetch, dismiss, togglePanel, closePanel };
});
