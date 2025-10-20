<template>
  <div class="min-h-screen bg-black relative overflow-hidden">
    <!-- Background Layer -->
    <div v-if="displayStore.hasBackground" class="absolute inset-0 z-0">
      <img
        v-if="displayStore.displayState.background?.type === 'image'"
        :src="`media://${displayStore.displayState.background.path}`"
        alt="Background"
        class="w-full h-full object-cover"
      />
      <video
        v-else-if="displayStore.displayState.background?.type === 'video'"
        :src="`media://${displayStore.displayState.background.path}`"
        class="w-full h-full object-cover"
        autoplay
        muted
        loop
      />
    </div>

    <!-- Event Video Layer -->
    <div
      v-if="displayStore.hasEvent"
      class="absolute inset-0 z-10 bg-black flex items-center justify-center"
    >
      <video
        :src="`media://${displayStore.displayState.event?.path}`"
        class="max-w-full max-h-full"
        autoplay
        @ended="displayStore.clearEvent()"
      />
    </div>

    <!-- Portraits Layer -->
    <div v-if="displayStore.hasPortraits && !displayStore.hasEvent" class="absolute bottom-0 left-0 right-0 z-20 p-4">
      <div class="flex justify-center gap-4">
        <div
          v-for="(portrait, index) in displayStore.displayState.portraits"
          :key="index"
          class="bg-gray-900/80 rounded-lg p-2 backdrop-blur-sm"
        >
          <img
            :src="`media://${portrait.path}`"
            :alt="portrait.displayName"
            class="h-48 w-auto object-contain rounded"
          />
          <p class="text-white text-center text-sm mt-2">{{ portrait.displayName }}</p>
        </div>
      </div>
    </div>

    <!-- Audio Elements -->
    <audio
      v-if="displayStore.hasBackgroundMusic"
      :src="`media://${displayStore.displayState.backgroundMusic?.path}`"
      autoplay
      loop
    />

    <audio
      v-for="sound in displayStore.displayState.backgroundSounds"
      :key="sound.id"
      :src="`media://${sound.path}`"
      autoplay
      loop
    />

    <audio
      v-for="effect in displayStore.displayState.soundEffects"
      :key="effect.id"
      :src="`media://${effect.path}`"
      autoplay
      @ended="displayStore.clearSoundEffect(String(effect.id))"
    />

    <!-- Placeholder when nothing is displayed -->
    <div
      v-if="!displayStore.hasBackground && !displayStore.hasEvent && !displayStore.hasPortraits"
      class="absolute inset-0 flex items-center justify-center z-0"
    >
      <div class="text-center text-gray-600">
        <p class="text-6xl mb-4">🎲</p>
        <p class="text-2xl font-semibold">D&D Helper Display</p>
        <p class="text-lg mt-2">Waiting for content...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '../stores'

const displayStore = useDisplayStore()
</script>
