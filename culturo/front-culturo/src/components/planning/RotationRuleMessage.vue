<template>
  <div class="rule-message" :class="`type-${message.type}`" role="alert">
    <div class="rule-header">
      <span class="rule-icon">{{ message.type === 'ok' ? '✅' : '⚠️' }}</span>
      <span class="rule-text">{{ shortText }}</span>
    </div>

    <button
      v-if="explanation"
      type="button"
      class="explain-toggle"
      @click="showExplanation = !showExplanation"
    >
      {{ showExplanation ? 'Masquer l\'explication' : 'Comprendre cette règle →' }}
    </button>

    <div v-if="showExplanation && explanation" class="explain-card">
      <div class="explain-rule-tag">{{ explanation.ruleLabel }}</div>
      <p class="explain-why"><strong>Pourquoi ?</strong> {{ explanation.why }}</p>
      <p class="explain-action"><strong>Que faire ?</strong> {{ explanation.action }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RuleMessage } from '@/types/planning';

const props = defineProps<{
  message: RuleMessage;
}>();

const showExplanation = ref(false);

interface RuleExplanation {
  ruleLabel: string;
  why: string;
  action: string;
}

const RULE_EXPLANATIONS: Record<string, RuleExplanation> = {
  'RÈGLE 1': {
    ruleLabel: 'Règle 1 — Rotation sur 5 ans',
    why: 'Planter la même famille botanique primaire trop souvent dans la même planche épuise les mêmes éléments nutritifs du sol et favorise l\'accumulation de pathogènes spécifiques à cette famille (champignons, nématodes). La règle des 5 ans laisse le temps au sol de se régénérer.',
    action: 'Choisissez une famille botanique différente pour cette planche, ou activez le contournement si vous avez amendé le sol et souhaitez passer outre intentionnellement.',
  },
  'RÈGLE 2': {
    ruleLabel: 'Règle 2 — Cohabitation des familles primaires',
    why: 'Les familles primaires (Solanacées, Cucurbitacées, Brassicacées…) sont de grandes consommatrices de ressources et sensibles aux mêmes maladies. Deux familles primaires sur la même planche la même année se concurrencent et multiplient les risques phytosanitaires.',
    action: 'Attendez que la culture en cours soit terminée (récoltée) avant de planter une autre famille primaire, ou choisissez un légume d\'une famille secondaire qui peut cohabiter.',
  },
  'RÈGLE 3': {
    ruleLabel: 'Règle 3 — Association déconseillée',
    why: 'Certaines familles botaniques se gênent mutuellement par allélopathie : elles libèrent des substances chimiques qui inhibent la croissance du voisin, ou attirent les mêmes ravageurs, amplifiant les dégâts.',
    action: 'Vous pouvez quand même planter, mais surveillez attentivement les deux cultures et prévoyez une séparation physique si possible. Notez l\'observation dans le journal terrain.',
  },
  'RÈGLE 4': {
    ruleLabel: 'Règle 4 — Saisonnalité',
    why: 'Chaque légume a une fenêtre de plantation optimale liée à la température, l\'ensoleillement et les risques de gel. Planter hors saison expose la culture à des échecs de germination, des coups de froid ou une floraison prématurée.',
    action: 'Vous pouvez confirmer si vous disposez d\'une protection (tunnel, voile) ou si vous acceptez le risque climatique. Sinon, décalez la date de plantation à la saison appropriée.',
  },
  'RÈGLE 5': {
    ruleLabel: 'Règle 5 — Engrais vert recommandé',
    why: 'La culture précédente avait un fort besoin en azote, ce qui signifie qu\'elle a épuisé les réserves azotées du sol. Replanter directement sans compensation peut affaiblir la nouvelle culture.',
    action: 'Incorporez un engrais vert (moutarde, phacélie, trèfle) ou un amendement organique azoté avant de planter. Vous pouvez passer outre si vous avez déjà amendé le sol.',
  },
  'RÈGLE 6': {
    ruleLabel: 'Règle 6 — Jachère recommandée',
    why: 'Une planche cultivée intensivement plusieurs années de suite voit sa structure dégradée : compaction, baisse de l\'activité microbienne et perte de matière organique. Le sol a besoin d\'un repos.',
    action: 'Envisagez une année de jachère ou d\'engrais vert pour cette planche. Si vous devez cultiver, privilégiez un légume peu exigeant et amendez copieusement.',
  },
};

function extractRuleKey(text: string): string | null {
  const match = text.match(/RÈGLE\s+\d+/);
  return match ? match[0] : null;
}

const shortText = computed(() => props.message.text);

const explanation = computed((): RuleExplanation | null => {
  if (props.message.type !== 'warning') return null;
  const key = extractRuleKey(props.message.text);
  return key ? (RULE_EXPLANATIONS[key] ?? null) : null;
});
</script>

<style scoped>
.rule-message {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.45;
  border: 1px solid transparent;
  box-shadow: 0 12px 24px rgba(58, 47, 24, 0.08);
  backdrop-filter: blur(10px);
}

.rule-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
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

.explain-toggle {
  align-self: flex-start;
  margin-left: 2.75rem;
  background: none;
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  color: #b06a10;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.explain-toggle:hover { color: #7a3d12; }

.explain-card {
  margin-left: 2.75rem;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(217, 130, 43, 0.2);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.explain-rule-tag {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #b06a10;
}

.explain-why,
.explain-action {
  font-size: 0.82rem;
  line-height: 1.5;
  color: #5a3010;
}

.explain-why strong,
.explain-action strong {
  color: #7a3d12;
}
</style>
