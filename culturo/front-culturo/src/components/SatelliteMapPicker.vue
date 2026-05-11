<template>
  <div class="map-picker-wrap">
    <div class="map-hint">
      <span class="hint-icon">📍</span>
      Cliquez sur la carte pour positionner l'exploitation
    </div>
    <div ref="mapEl" class="map-container" />
    <div v-if="address" class="map-address">
      <span class="address-label">Adresse détectée :</span>
      <span class="address-value">{{ address }}</span>
      <button class="btn-use" type="button" @click="$emit('use-address', address)">
        Utiliser comme localité
      </button>
    </div>
    <div v-if="coords" class="coords-display">
      <span class="coord-item">Lat {{ coords.lat.toFixed(5) }}</span>
      <span class="coord-sep">·</span>
      <span class="coord-item">Lng {{ coords.lng.toFixed(5) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon path broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Coords { lat: number; lng: number }

const props = defineProps<{
  initialCoords?: Coords | null;
}>();

const emit = defineEmits<{
  (e: 'update:coords', coords: Coords): void;
  (e: 'use-address', address: string): void;
}>();

const mapEl = ref<HTMLElement | null>(null);
const coords = ref<Coords | null>(props.initialCoords ?? null);
const address = ref('');
let map: L.Map | null = null;
let marker: L.Marker | null = null;
let geocodeTimer: ReturnType<typeof setTimeout> | null = null;

const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP and the GIS User Community';

const LABELS_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

onMounted(() => {
  if (!mapEl.value) return;

  const center: L.LatLngExpression = props.initialCoords
    ? [props.initialCoords.lat, props.initialCoords.lng]
    : [50.4501, 4.4522]; // Belgium center

  map = L.map(mapEl.value, { zoomControl: true }).setView(center, props.initialCoords ? 15 : 8);

  L.tileLayer(SATELLITE_TILES, { attribution: SATELLITE_ATTR, maxZoom: 19 }).addTo(map);
  L.tileLayer(LABELS_TILES, { maxZoom: 19, opacity: 0.8 }).addTo(map);

  if (props.initialCoords) {
    marker = L.marker([props.initialCoords.lat, props.initialCoords.lng]).addTo(map);
    reverseGeocode(props.initialCoords.lat, props.initialCoords.lng);
  }

  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    placeMarker(lat, lng);
  });
});

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null; }
  if (geocodeTimer) clearTimeout(geocodeTimer);
});

watch(() => props.initialCoords, (c) => {
  if (!c || !map) return;
  placeMarker(c.lat, c.lng, false);
  map.setView([c.lat, c.lng], 15);
});

function placeMarker(lat: number, lng: number, emit_ = true) {
  if (!map) return;
  if (marker) marker.setLatLng([lat, lng]);
  else marker = L.marker([lat, lng]).addTo(map);

  coords.value = { lat, lng };
  if (emit_) emit('update:coords', { lat, lng });

  if (geocodeTimer) clearTimeout(geocodeTimer);
  geocodeTimer = setTimeout(() => reverseGeocode(lat, lng), 600);
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const resp = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    if (!resp.ok) return;
    const data = await resp.json();
    const a = data.address ?? {};
    const parts = [a.village ?? a.town ?? a.city ?? a.municipality, a.county ?? a.state].filter(Boolean);
    address.value = parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || '';
  } catch {
    address.value = '';
  }
}
</script>

<style scoped>
.map-picker-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.map-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: rgba(39,65,53,0.55);
  font-weight: 600;
}

.hint-icon { font-size: 0.9rem; }

.map-container {
  width: 100%;
  height: 300px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(39,65,53,0.14);
  z-index: 0;
}

.map-address {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  background: rgba(74,103,65,0.06);
  border: 1px solid rgba(74,103,65,0.15);
}

.address-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(39,65,53,0.5);
  white-space: nowrap;
}

.address-value {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  min-width: 120px;
}

.btn-use {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(74,103,65,0.3);
  background: rgba(255,255,255,0.9);
  color: rgba(39,65,53,0.85);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 140ms;
}
.btn-use:hover { background: rgba(74,103,65,0.12); }

.coords-display {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  color: rgba(39,65,53,0.4);
  font-family: 'Courier New', monospace;
}

.coord-sep { color: rgba(39,65,53,0.2); }
</style>
