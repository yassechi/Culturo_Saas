import { defineStore } from 'pinia';
import { reactive } from 'vue';

const CONFIG_KEY = 'culturo_config';

export interface AppConfig {
  planningWindowStep: number;
  historyDefaultYears: number;
  defaultSectionsPerBoard: number;
}

const DEFAULTS: AppConfig = {
  planningWindowStep: 3,
  historyDefaultYears: 3,
  defaultSectionsPerBoard: 3,
};

function load(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

export function getConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

export const useConfigStore = defineStore('config', () => {
  const config = reactive<AppConfig>(load());

  function save() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...config }));
  }

  function reset() {
    Object.assign(config, DEFAULTS);
    localStorage.removeItem(CONFIG_KEY);
  }

  return { config, save, reset };
});
