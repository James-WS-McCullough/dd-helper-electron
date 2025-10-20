<template>
  <div>
    <div
      @click="handleClick"
      class="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 cursor-pointer transition-colors"
      :style="{ paddingLeft: `${depth * 1 + 0.75}rem` }"
    >
      <!-- Expand/Collapse Icon -->
      <span v-if="node.type === 'folder'" class="text-gray-400 text-sm w-4">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="w-4"></span>

      <!-- Icon -->
      <span class="text-lg">{{ getIcon(node) }}</span>

      <!-- Name -->
      <span class="text-sm text-gray-200 flex-1">{{ node.displayName || node.name }}</span>

      <!-- Badge for media type -->
      <span
        v-if="node.type === 'file'"
        class="text-xs px-2 py-0.5 rounded"
        :class="getBadgeClass(node.mediaSubtype)"
      >
        {{ node.mediaSubtype }}
      </span>
    </div>

    <!-- Children -->
    <div v-if="isExpanded && node.children && node.children.length > 0">
      <MediaTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        @select-media="$emit('select-media', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MediaFile, MediaSubtype } from '../types'

interface Props {
  node: MediaFile
  depth: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select-media', media: MediaFile): void
}>()

const isExpanded = ref(props.depth === 0)

function handleClick() {
  if (props.node.type === 'folder') {
    isExpanded.value = !isExpanded.value
  } else {
    emit('select-media', props.node)
  }
}

function getIcon(node: MediaFile): string {
  if (node.type === 'folder') return '📁'

  switch (node.mediaType) {
    case 'image':
      return '🖼️'
    case 'video':
      return '🎬'
    case 'audio':
      return '🎵'
    default:
      return '📄'
  }
}

function getBadgeClass(subtype: MediaSubtype): string {
  const classes: Record<MediaSubtype, string> = {
    portrait: 'bg-blue-500/30 text-blue-200',
    background: 'bg-green-500/30 text-green-200',
    event: 'bg-purple-500/30 text-purple-200',
    loop: 'bg-yellow-500/30 text-yellow-200',
    music: 'bg-pink-500/30 text-pink-200',
    sound: 'bg-orange-500/30 text-orange-200',
    default: 'bg-gray-500/30 text-gray-200'
  }

  return classes[subtype] || classes.default
}
</script>
