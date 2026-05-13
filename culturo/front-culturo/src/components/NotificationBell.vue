<template>
  <div class="notif-wrapper" v-click-outside="store.closePanel">
    <button
      class="notif-bell"
      :class="{ 'has-critical': store.hasCritical, 'has-notifs': store.unreadCount > 0 }"
      type="button"
      :aria-label="`Notifications (${store.unreadCount})`"
      @click="store.togglePanel()"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="store.unreadCount > 0" class="notif-badge">
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <Transition name="notif-panel">
      <div v-if="store.open" class="notif-panel" role="dialog" aria-label="Notifications">
        <div class="notif-panel-header">
          <span class="notif-panel-title">Notifications</span>
          <span class="notif-count-chip">{{ store.unreadCount }}</span>
        </div>

        <div v-if="store.loading" class="notif-empty">Chargement…</div>

        <div v-else-if="store.visible.length === 0" class="notif-empty">
          Aucune notification active.
        </div>

        <ul v-else class="notif-list">
          <li
            v-for="n in store.visible"
            :key="n.id"
            class="notif-item"
            :class="`sev-${n.severity}`"
          >
            <div class="notif-item-content">
              <span class="notif-sev-dot" />
              <div class="notif-body">
                <RouterLink class="notif-title" :to="n.link" @click="store.closePanel()">
                  {{ n.title }}
                </RouterLink>
                <p class="notif-text">{{ n.body }}</p>
              </div>
            </div>
            <button class="notif-dismiss" type="button" aria-label="Ignorer" @click="store.dismiss(n.id)">×</button>
          </li>
        </ul>

        <div class="notif-panel-footer">
          <button type="button" class="notif-refresh" @click="store.fetch()">
            Actualiser
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useNotificationsStore } from '@/stores/notifications';

const store = useNotificationsStore();

// Custom directive for click-outside
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    el._clickOutside = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) {
        binding.value();
      }
    };
    document.addEventListener('mousedown', el._clickOutside);
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('mousedown', el._clickOutside);
    delete el._clickOutside;
  },
};

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    vClickOutside: typeof vClickOutside;
  }
}

onMounted(() => store.fetch());
</script>

<style scoped>
.notif-wrapper {
  position: relative;
}

.notif-bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1.5px solid rgba(39, 65, 53, 0.16);
  background: rgba(255, 255, 255, 0.85);
  color: var(--text-primary, #1a2e1a);
  cursor: pointer;
  transition: background 160ms, border-color 160ms;
}

.notif-bell:hover,
.notif-bell.has-notifs {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(39, 65, 53, 0.28);
}

.notif-bell.has-critical {
  border-color: rgba(200, 50, 30, 0.4);
  background: rgba(255, 240, 235, 0.9);
  color: #b83220;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: #c83220;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 1.5px solid #fff;
}

/* Panel */
.notif-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 340px;
  max-height: 480px;
  background: rgba(255, 255, 255, 0.97);
  border: 1.5px solid rgba(39, 65, 53, 0.12);
  border-radius: 18px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 200;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.1rem 0.75rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.08);
}

.notif-panel-title {
  font-weight: 700;
  font-size: 0.92rem;
  flex: 1;
}

.notif-count-chip {
  background: rgba(39, 65, 53, 0.1);
  color: #2d5016;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
}

.notif-empty {
  padding: 1.5rem 1rem;
  text-align: center;
  color: #888;
  font-size: 0.88rem;
}

.notif-list {
  list-style: none;
  overflow-y: auto;
  flex: 1;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1.1rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.06);
}

.notif-item:last-child { border-bottom: none; }

.notif-item-content {
  display: flex;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
}

.notif-sev-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
}

.sev-info .notif-sev-dot { background: #2d8a4e; }
.sev-warning .notif-sev-dot { background: #c07800; }
.sev-critical .notif-sev-dot { background: #c83220; }
.sev-critical { background: rgba(200, 50, 32, 0.04); }
.sev-warning { background: rgba(192, 120, 0, 0.04); }

.notif-body { flex: 1; min-width: 0; }

.notif-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: inherit;
  text-decoration: none;
  display: block;
  margin-bottom: 2px;
}
.notif-title:hover { text-decoration: underline; }

.notif-text {
  font-size: 0.78rem;
  color: #555;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 1rem;
  color: #aaa;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
}
.notif-dismiss:hover { color: #555; }

.notif-panel-footer {
  padding: 0.6rem 1.1rem;
  border-top: 1px solid rgba(39, 65, 53, 0.08);
}

.notif-refresh {
  background: none;
  border: none;
  font-size: 0.78rem;
  color: #2d5016;
  cursor: pointer;
  font-weight: 600;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Transition */
.notif-panel-enter-active,
.notif-panel-leave-active {
  transition: opacity 160ms, transform 160ms;
}
.notif-panel-enter-from,
.notif-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
