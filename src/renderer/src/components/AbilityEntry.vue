<template>
  <div class="text-sm text-gray-300">
    <span class="font-semibold italic text-white">{{ ability.name }}</span>
    <span v-if="ability.recharge" class="text-gray-400 ml-1">({{ ability.recharge }})</span>
    <span class="text-white">. </span>
    <span v-for="(segment, index) in parsedDescription" :key="index">
      <span v-if="segment.type === 'text'">{{ segment.content }}</span>
      <button
        v-else
        @click="rollDiceNotation(segment.notation!)"
        class="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded text-xs transition-colors"
        :title="`Roll ${segment.notation}`"
      >
        <span class="mr-1">🎲</span>
        {{ segment.content }}
      </button>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CharacterAbility } from '../types'
import { parseAbilityText } from '../utils/abilityFormatter'
import { rollDice, type DiceRoll } from '../utils/diceRoller'

interface Props {
  ability: CharacterAbility
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'roll', result: DiceRoll): void
}>()

const parsedDescription = computed(() => parseAbilityText(props.ability.description))

function rollDiceNotation(notation: string): void {
  const result = rollDice(notation)
  if (result) {
    emit('roll', result)
  }
}
</script>
