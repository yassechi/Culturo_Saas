<template>
  <component :is="currentLayout">
    <router-view v-slot="{ Component }">
      <keep-alive :max="6">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import MainLayout from '@/layouts/MainLayout.vue';

const route = useRoute();

const currentLayout = computed(() =>
  route.meta.layout === 'auth' ? AuthLayout : MainLayout,
);
</script>
