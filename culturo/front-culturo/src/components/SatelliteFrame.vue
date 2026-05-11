<template>
  <div class="sat-frame">
    <div class="sat-frame-header">
      <span class="sat-label">📍 Vue satellite</span>
      <span v-if="address" class="sat-address">{{ address }}</span>
      <span v-else-if="locality" class="sat-address">{{ locality }}</span>
    </div>
    <div ref="mapEl" class="sat-map" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{
  lat: number;
  lng: number;
  address?: string;
  locality?: string;
}>();

const mapEl = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Tiles © Esri';
const LABELS_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

onMounted(() => {
  if (!mapEl.value) return;
  map = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: false,
    dragging: true,
    doubleClickZoom: false,
  }).setView([props.lat, props.lng], 16);

  L.tileLayer(SATELLITE_TILES, { attribution: SATELLITE_ATTR, maxZoom: 19 }).addTo(map);
  L.tileLayer(LABELS_TILES, { maxZoom: 19, opacity: 0.85 }).addTo(map);

  marker = L.marker([props.lat, props.lng]).addTo(map);
});

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null; }
});

watch(
  () => [props.lat, props.lng] as const,
  ([lat, lng]) => {
    if (!map) return;
    map.setView([lat, lng], 16);
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);
  },
);
</script>

<style scoped>
.sat-frame {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(39, 65, 53, 0.12);
  box-shadow: 0 8px 24px rgba(26, 34, 28, 0.1);
  background: rgba(255, 255, 255, 0.7);
}

.sat-frame-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  background: rgba(39, 65, 53, 0.04);
  border-bottom: 1px solid rgba(39, 65, 53, 0.08);
}

.sat-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.55);
  white-space: nowrap;
}

.sat-address {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--brand-deep, #1a221c);
}

.sat-map {
  width: 100%;
  height: 280px;
  z-index: 0;
}
</style>
