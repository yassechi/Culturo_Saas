<template>
  <section class="placeholder-card">
    <span class="placeholder-meta">{{ phase }}</span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  phase: string;
}>();
</script>
