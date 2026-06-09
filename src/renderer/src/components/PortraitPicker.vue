<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="block text-sm text-gray-400">Portrait</label>
      <button
        v-if="modelValue"
        @click="$emit('update:modelValue', undefined)"
        class="text-xs text-red-400 hover:text-red-300"
      >
        Remove
      </button>
    </div>

    <!-- Current Portrait Preview -->
    <div v-if="modelValue" class="flex items-center gap-3">
      <div class="w-16 h-16 rounded-lg overflow-hidden border border-gray-600 flex-shrink-0">
        <img
          :src="`media://${modelValue}`"
          alt="Portrait"
          class="w-full h-full object-cover"
        />
      </div>
      <button
        @click="showPicker = !showPicker"
        class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
      >
        Change
      </button>
    </div>
    <button
      v-else
      @click="showPicker = !showPicker"
      class="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg border border-dashed border-gray-600 transition-colors"
    >
      Select Portrait Image
    </button>

    <!-- Image Picker Grid -->
    <div v-if="showPicker" class="space-y-2">
      <input
        v-model="search"
        type="text"
        placeholder="Search images..."
        class="w-full px-3 py-1.5 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
      />
      <div class="max-h-48 overflow-y-auto grid grid-cols-4 gap-2 p-1">
        <div
          v-for="image in filteredImages"
          :key="image.path"
          @click="selectImage(image.path)"
          class="cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:border-blue-400 aspect-square"
          :class="modelValue === image.path ? 'border-blue-500' : 'border-gray-600'"
          :title="image.displayName"
        >
          <img
            :src="`media://${image.path}`"
            :alt="image.displayName"
            class="w-full h-full object-cover"
          />
        </div>
        <div v-if="filteredImages.length === 0" class="col-span-4 text-center py-4 text-gray-500 text-sm">
          No images found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDirectoryStore } from '../stores'
import { getAllVisualMedia } from '../utils/mediaFilters'
import type { MediaFile } from '../types'

interface Props {
  modelValue?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const directoryStore = useDirectoryStore()
const showPicker = ref(false)
const search = ref('')

const allImages = computed<MediaFile[]>(() => {
  const media = getAllVisualMedia(directoryStore.mediaTree)
  return media.filter((f) => f.mediaType === 'image')
})

const filteredImages = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return allImages.value
  return allImages.value.filter((f) => f.displayName.toLowerCase().includes(q))
})

function selectImage(path: string): void {
  emit('update:modelValue', path)
  showPicker.value = false
}
</script>
