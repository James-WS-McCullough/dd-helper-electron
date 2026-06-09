<template>
  <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b-2" :class="[headerBg, headerBorder]">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">{{ character.name }}</h2>
        </div>
        <div v-if="character.portraitPath" class="w-16 h-16 rounded-lg overflow-hidden border-2" :class="headerBorder">
          <img
            :src="`media://${character.portraitPath}`"
            :alt="character.name"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>

    <!-- Basic Stats -->
    <div class="p-4 border-b" :class="sectionBorder">
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span class="font-semibold" :class="accentText">Armor Class</span>
          <span class="text-white ml-2">{{ character.armorClass }}</span>
        </div>
        <div>
          <span class="font-semibold" :class="accentText">Hit Points</span>
          <span class="text-white ml-2">
            <span v-if="showHpTracker">{{ character.currentHitPoints ?? character.maxHitPoints }}/{{ character.maxHitPoints }}</span>
            <span v-else>{{ character.maxHitPoints }}</span>
          </span>
        </div>
        <div>
          <span class="font-semibold" :class="accentText">Speed</span>
          <span class="text-white ml-2">{{ formattedSpeed }}</span>
        </div>
      </div>
    </div>

    <!-- Ability Scores -->
    <div class="p-4 border-b" :class="sectionBorder">
      <div class="grid grid-cols-6 gap-2 text-center">
        <div
          v-for="(score, ability) in character.abilityScores"
          :key="ability"
          class="bg-gray-900 rounded p-2"
        >
          <div class="text-xs font-semibold uppercase" :class="accentText">{{ getAbilityAbbr(ability) }}</div>
          <div class="text-lg text-white font-bold">{{ score }}</div>
          <div class="text-sm text-gray-400">{{ formatMod(calculateMod(score)) }}</div>
        </div>
      </div>
    </div>

    <!-- Secondary Stats -->
    <div v-if="hasSecondaryStats" class="p-4 border-b text-sm space-y-1" :class="sectionBorder">
      <div v-if="formattedSavingThrows">
        <span class="font-semibold" :class="accentText">Saving Throws</span>
        <span class="text-white ml-2">{{ formattedSavingThrows }}</span>
      </div>
      <div v-if="formattedSkills">
        <span class="font-semibold" :class="accentText">Skills</span>
        <span class="text-white ml-2">{{ formattedSkills }}</span>
      </div>
      <div v-if="character.damageVulnerabilities?.length">
        <span class="font-semibold" :class="accentText">Damage Vulnerabilities</span>
        <span class="text-white ml-2">{{ character.damageVulnerabilities.join(', ') }}</span>
      </div>
      <div v-if="character.damageResistances?.length">
        <span class="font-semibold" :class="accentText">Damage Resistances</span>
        <span class="text-white ml-2">{{ character.damageResistances.join(', ') }}</span>
      </div>
      <div v-if="character.damageImmunities?.length">
        <span class="font-semibold" :class="accentText">Damage Immunities</span>
        <span class="text-white ml-2">{{ character.damageImmunities.join(', ') }}</span>
      </div>
      <div v-if="character.conditionImmunities?.length">
        <span class="font-semibold" :class="accentText">Condition Immunities</span>
        <span class="text-white ml-2">{{ character.conditionImmunities.join(', ') }}</span>
      </div>
      <div v-if="formattedSenses">
        <span class="font-semibold" :class="accentText">Senses</span>
        <span class="text-white ml-2">{{ formattedSenses }}</span>
      </div>
      <div v-if="character.proficiencyBonus">
        <span class="font-semibold" :class="accentText">Proficiency Bonus</span>
        <span class="text-white ml-2">{{ formatMod(character.proficiencyBonus) }}</span>
      </div>
    </div>

    <!-- Abilities by Type -->
    <div v-if="traits.length > 0" class="p-4 border-b" :class="sectionBorder">
      <div v-for="ability in traits" :key="ability.id" class="mb-3 last:mb-0">
        <AbilityEntry :ability="ability" @roll="onDiceRoll" />
      </div>
    </div>

    <div v-if="actions.length > 0" class="p-4 border-b" :class="sectionBorder">
      <h3 class="text-lg font-bold border-b mb-3 pb-1" :class="[accentText, sectionBorder]">Actions</h3>
      <div v-for="ability in actions" :key="ability.id" class="mb-3 last:mb-0">
        <AbilityEntry :ability="ability" @roll="onDiceRoll" />
      </div>
    </div>

    <div v-if="bonusActions.length > 0" class="p-4 border-b" :class="sectionBorder">
      <h3 class="text-lg font-bold border-b mb-3 pb-1" :class="[accentText, sectionBorder]">Bonus Actions</h3>
      <div v-for="ability in bonusActions" :key="ability.id" class="mb-3 last:mb-0">
        <AbilityEntry :ability="ability" @roll="onDiceRoll" />
      </div>
    </div>

    <div v-if="reactions.length > 0" class="p-4 border-b" :class="sectionBorder">
      <h3 class="text-lg font-bold border-b mb-3 pb-1" :class="[accentText, sectionBorder]">Reactions</h3>
      <div v-for="ability in reactions" :key="ability.id" class="mb-3 last:mb-0">
        <AbilityEntry :ability="ability" @roll="onDiceRoll" />
      </div>
    </div>

    <div v-if="legendaryActions.length > 0" class="p-4">
      <h3 class="text-lg font-bold border-b mb-3 pb-1" :class="[accentText, sectionBorder]">Legendary Actions</h3>
      <div v-for="ability in legendaryActions" :key="ability.id" class="mb-3 last:mb-0">
        <AbilityEntry :ability="ability" @roll="onDiceRoll" />
      </div>
    </div>

    <!-- Tags -->
    <div v-if="character.tags?.length" class="p-4 bg-gray-900 border-t border-gray-700">
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in character.tags"
          :key="tag"
          class="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </div>

  <!-- Dice Roll Toast Container -->
  <div class="fixed bottom-20 right-4 z-50 space-y-2">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 min-w-[200px]"
      >
        <div class="flex items-center justify-between">
          <span class="text-yellow-400 font-bold">{{ toast.result.notation }}</span>
          <button
            @click="removeToast(toast.id)"
            class="text-gray-400 hover:text-white ml-4"
          >
            &times;
          </button>
        </div>
        <div class="text-gray-400 text-sm mt-1">
          Rolls: {{ toast.result.rolls.join(', ') }}
          <span v-if="toast.result.modifier !== 0">
            {{ toast.result.modifier >= 0 ? '+' : '' }}{{ toast.result.modifier }}
          </span>
        </div>
        <div class="text-white text-2xl font-bold mt-1">
          Total: {{ toast.result.total }}
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CharacterStats, Disposition } from '../types'
import type { DiceRoll } from '../utils/diceRoller'
import {
  calculateModifier,
  formatModifier,
  formatSpeed,
  formatSenses,
  getAbilityAbbreviation,
  getSkillAbility
} from '../utils/abilityFormatter'
import AbilityEntry from './AbilityEntry.vue'

interface Props {
  character: CharacterStats
  showHpTracker?: boolean
  disposition?: Disposition
}

const props = withDefaults(defineProps<Props>(), {
  showHpTracker: false,
  disposition: undefined
})

const headerBg = computed(() => {
  if (props.disposition === 'friendly') return 'bg-green-900'
  if (props.disposition === 'neutral') return 'bg-yellow-900'
  return 'bg-gray-700'
})

const headerBorder = computed(() => {
  if (props.disposition === 'friendly') return 'border-green-600'
  if (props.disposition === 'neutral') return 'border-yellow-600'
  return 'border-gray-500'
})

const accentText = computed(() => {
  if (props.disposition === 'friendly') return 'text-green-400'
  if (props.disposition === 'neutral') return 'text-yellow-400'
  return 'text-gray-400'
})

const sectionBorder = computed(() => {
  if (props.disposition === 'friendly') return 'border-green-900/50'
  if (props.disposition === 'neutral') return 'border-yellow-900/50'
  return 'border-gray-700'
})

const emit = defineEmits<{
  (e: 'update:character', character: CharacterStats): void
  (e: 'roll', result: DiceRoll): void
}>()

// Toast state
interface Toast {
  id: number
  result: DiceRoll
  timeoutId: number
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

// Computed values
const formattedSpeed = computed(() => formatSpeed(props.character.speed))

const formattedSenses = computed(() => {
  if (!props.character.senses) return ''
  return formatSenses(props.character.senses)
})

const hasSecondaryStats = computed(() => {
  return !!(
    props.character.savingThrows ||
    props.character.skills ||
    props.character.damageVulnerabilities?.length ||
    props.character.damageResistances?.length ||
    props.character.damageImmunities?.length ||
    props.character.conditionImmunities?.length ||
    props.character.senses ||
    props.character.proficiencyBonus
  )
})

const formattedSavingThrows = computed(() => {
  if (!props.character.savingThrows) return ''
  const profBonus = props.character.proficiencyBonus || 2

  return Object.entries(props.character.savingThrows)
    .filter(([, isProficient]) => isProficient)
    .map(([ability]) => {
      const score = props.character.abilityScores[ability as keyof typeof props.character.abilityScores]
      const mod = calculateModifier(score) + profBonus
      return `${getAbilityAbbreviation(ability)} ${formatModifier(mod)}`
    })
    .join(', ')
})

const formattedSkills = computed(() => {
  if (!props.character.skills) return ''
  const profBonus = props.character.proficiencyBonus || 2

  return Object.entries(props.character.skills)
    .map(([skill, level]) => {
      const ability = getSkillAbility(skill)
      const score = props.character.abilityScores[ability as keyof typeof props.character.abilityScores]
      const bonus = level === 'expertise' ? profBonus * 2 : profBonus
      const mod = calculateModifier(score) + bonus
      return `${skill.charAt(0).toUpperCase() + skill.slice(1)} ${formatModifier(mod)}`
    })
    .join(', ')
})

// Abilities by type
const traits = computed(() =>
  props.character.abilities.filter((a) => a.type === 'trait')
)

const actions = computed(() =>
  props.character.abilities.filter((a) => a.type === 'action')
)

const bonusActions = computed(() =>
  props.character.abilities.filter((a) => a.type === 'bonus_action')
)

const reactions = computed(() =>
  props.character.abilities.filter((a) => a.type === 'reaction')
)

const legendaryActions = computed(() =>
  props.character.abilities.filter((a) => a.type === 'legendary')
)

// Methods
function getAbilityAbbr(ability: string): string {
  return getAbilityAbbreviation(ability)
}

function calculateMod(score: number): number {
  return calculateModifier(score)
}

function formatMod(mod: number): string {
  return formatModifier(mod)
}

function adjustHP(delta: number): void {
  const current = props.character.currentHitPoints ?? props.character.maxHitPoints
  const newHP = Math.max(0, Math.min(current + delta, props.character.maxHitPoints))
  emit('update:character', {
    ...props.character,
    currentHitPoints: newHP
  })
}

function onDiceRoll(result: DiceRoll): void {
  // Create toast
  const toastId = ++toastIdCounter
  const timeoutId = window.setTimeout(() => {
    removeToast(toastId)
  }, 10000)

  toasts.value.push({
    id: toastId,
    result,
    timeoutId
  })

  emit('roll', result)
}

function removeToast(id: number): void {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    clearTimeout(toasts.value[index].timeoutId)
    toasts.value.splice(index, 1)
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
