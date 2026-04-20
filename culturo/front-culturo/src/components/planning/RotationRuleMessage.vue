<template>
  <div class="rule-message" :class="`type-${message.type}`" role="alert">
    <span class="rule-icon">{{ message.type === 'ok' ? '✅' : '⚠️' }}</span>
    <span class="rule-text">{{ message.text }}</span>
  </div>
</template>

<script setup lang="ts">
import type { RuleMessage } from '@/types/planning';

defineProps<{
  message: RuleMessage;
}>();
</script>

<style scoped>
.rule-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.45;
  border: 1px solid transparent;
  box-shadow: 0 12px 24px rgba(58, 47, 24, 0.08);
  backdrop-filter: blur(10px);
}

.type-ok {
  background: linear-gradient(135deg, rgba(74, 103, 65, 0.14), rgba(239, 248, 232, 0.9));
  border-color: rgba(74, 103, 65, 0.2);
  color: var(--brand-deep);
}

.type-warning {
  background: linear-gradient(135deg, rgba(217, 130, 43, 0.14), rgba(255, 244, 225, 0.92));
  border-color: rgba(217, 130, 43, 0.22);
  color: #7a3d12;
}

.rule-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.55);
}

.rule-text {
  flex: 1;
  font-weight: 600;
}
</style>
