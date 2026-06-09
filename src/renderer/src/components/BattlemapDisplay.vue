<template>
  <div ref="viewport" class="battlemap-viewport">
    <!-- Camera: the whole grid is translated so the zoom center sits mid-screen -->
    <div
      class="battlemap-camera"
      :style="{
        width: `${totalGridWidth}px`,
        height: `${totalGridHeight}px`,
        transform: cameraTransform,
        '--inv-zoom': invZoom
      }"
    >
      <!-- Background image -->
      <img
        v-if="battlemap.backgroundImage"
        :src="`media://${battlemap.backgroundImage}`"
        class="battlemap-bg"
        alt=""
      />

      <!-- Grid + tokens -->
      <div
        class="battlemap-grid"
        :style="{
          gridTemplateColumns: `repeat(${battlemap.gridWidth}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${battlemap.gridHeight}, ${cellSize}px)`
        }"
      >
        <div
          v-for="cell in cells"
          :key="cell.key"
          class="battlemap-cell"
          :class="{
            'cell-radius': cell.inRadius,
            'cell-radius-center': cell.isRadiusCenter,
            'cell-hidden': cell.isHidden
          }"
        >
          <div
            v-if="cell.token"
            class="battlemap-token"
            :class="{ 'token-moved': cell.isLastMoved }"
            :style="tokenStyle(cell.token)"
          >
            <span v-if="!cell.token.portrait" class="token-initial">
              {{ initial(playerName(cell.token)) }}
            </span>
            <span
              class="token-name"
              :class="{ 'token-name-moved': cell.isLastMoved }"
              :style="{ fontSize: `${Math.max(10, cellSize * 0.13)}px` }"
            >
              {{ withLabel(playerName(cell.token), cell.label) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Battlemap, BattlemapToken } from '../types'
import { isWithinRadius, computeTokenLabels, withLabel } from '../utils/battlemap'

const props = defineProps<{ battlemap: Battlemap }>()

const GAP = 1

// Reactive viewport size
const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

function onResize() {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const zoom = computed(() => ({
  scale: props.battlemap.zoom?.scale ?? 1,
  centerX: props.battlemap.zoom?.centerX ?? 0.5,
  centerY: props.battlemap.zoom?.centerY ?? 0.5,
  lastMovedToken: props.battlemap.zoom?.lastMovedToken ?? null
}))

// The grid is laid out at a FIXED base size (whole grid fits the viewport at
// scale 1). Zoom and pan are applied purely via a CSS transform on the camera,
// so scale + translate animate together smoothly instead of the grid resizing
// instantly while only the translate transitions (which caused jumpy zooming).
const cellSize = computed(() =>
  Math.min(
    viewportWidth.value / props.battlemap.gridWidth,
    viewportHeight.value / props.battlemap.gridHeight
  )
)

const totalGridWidth = computed(
  () => cellSize.value * props.battlemap.gridWidth + GAP * (props.battlemap.gridWidth - 1)
)
const totalGridHeight = computed(
  () => cellSize.value * props.battlemap.gridHeight + GAP * (props.battlemap.gridHeight - 1)
)

// Inverse of the zoom scale — used to counter-scale token chrome (border
// thickness, name labels) so they keep a constant on-screen size while the map
// itself scales with zoom.
const invZoom = computed(() => 1 / zoom.value.scale)

// transform-origin is 0 0, so map the focal point (centerX, centerY) of the
// unscaled grid to the centre of the viewport: screen = translate + scale * point.
const cameraTransform = computed(() => {
  const s = zoom.value.scale
  const tx = viewportWidth.value / 2 - s * zoom.value.centerX * totalGridWidth.value
  const ty = viewportHeight.value / 2 - s * zoom.value.centerY * totalGridHeight.value
  return `translate(${tx}px, ${ty}px) scale(${s})`
})

interface RenderCell {
  key: string
  token: BattlemapToken | null
  label: string
  inRadius: boolean
  isRadiusCenter: boolean
  isLastMoved: boolean
  isHidden: boolean
}

const fogSet = computed(() => new Set(props.battlemap.hiddenTiles || []))
const tokenLabels = computed(() => computeTokenLabels(props.battlemap.tokens))

const cells = computed<RenderCell[]>(() => {
  const list: RenderCell[] = []
  const { gridWidth, gridHeight, tokens, movementRadius } = props.battlemap
  const last = zoom.value.lastMovedToken
  const fog = fogSet.value
  const labels = tokenLabels.value

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const key = `${x}-${y}`
      const token = tokens[key]
      const isHidden = fog.has(key)

      let inRadius = false
      let isRadiusCenter = false
      if (movementRadius?.active && !isHidden) {
        if (x === movementRadius.centerX && y === movementRadius.centerY) {
          isRadiusCenter = true
        } else if (
          isWithinRadius(x, y, movementRadius.centerX, movementRadius.centerY, movementRadius.radius)
        ) {
          inRadius = true
        }
      }

      list.push({
        key,
        // Tokens under fog are not shown to players
        token: token && !token.hidden && !isHidden ? token : null,
        label: labels[key] || '',
        inRadius,
        isRadiusCenter,
        isLastMoved: !!last && last.x === x && last.y === y,
        isHidden
      })
    }
  }
  return list
})

function tokenStyle(token: BattlemapToken) {
  if (token.portrait) {
    return {
      backgroundImage: `url('media://${token.portrait}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return { background: typeGradient(token.type) }
}

function typeGradient(type?: string): string {
  if (type === 'enemy') return 'linear-gradient(135deg, #c0392b, #7b241c)'
  if (type === 'player') return 'linear-gradient(135deg, #2980b9, #1f618d)'
  return 'linear-gradient(135deg, #566573, #2c3e50)'
}

function initial(name: string): string {
  return (name || '?').trim().charAt(0).toUpperCase()
}

function cleanName(name: string): string {
  return name.replace(/_/g, ' ')
}

// Player-facing token name. Secret ("???") tokens show only "???" until the DM
// reveals them, at which point the "???" prefix is dropped.
function playerName(token: BattlemapToken): string {
  const name = cleanName(token.name || '')
  if (name.startsWith('???')) {
    return token.nameRevealed ? name.replace(/^\?\?\?\s*/, '').trim() : '???'
  }
  return name
}
</script>

<style scoped>
.battlemap-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* Transparent so the display's background layer shows beneath the map
     (e.g. in letterbox areas when the map doesn't fill the screen). */
  background: transparent;
  /* Above the background layer (z-0), below events (z-10) and portraits (z-20). */
  z-index: 5;
}

.battlemap-camera {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.battlemap-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top left;
}

.battlemap-grid {
  position: relative;
  display: grid;
  gap: 1px;
  width: 100%;
  height: 100%;
}

.battlemap-cell {
  position: relative;
  background: rgba(52, 73, 94, 0.15);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.cell-radius {
  background: rgba(52, 152, 219, 0.3);
  box-shadow: inset 0 0 0 1px rgba(52, 152, 219, 0.8);
}

.cell-radius-center {
  background: rgba(52, 152, 219, 0.6);
  box-shadow: inset 0 0 0 2px rgba(52, 152, 219, 1);
}

/* Fog of war — solid black for players. The outset shadow covers the 1px grid
   gap so adjacent hidden tiles read as one seamless black region. */
.cell-hidden {
  background: #000;
  box-shadow: 0 0 0 1.5px #000;
  z-index: 1;
}

.battlemap-token {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  /* Counter-scaled by the inverse zoom so the outline keeps a constant
     on-screen thickness while the token circle scales with the map. */
  border-style: solid;
  border-color: #fff;
  border-width: calc(3px * var(--inv-zoom, 1));
  box-shadow: 0 0 calc(10px * var(--inv-zoom, 1)) rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  /* Match the camera zoom so the counter-scaled chrome stays in sync */
  transition:
    border-width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.token-initial {
  color: #fff;
  font-weight: 700;
  font-size: 1.2em;
}

.token-name {
  position: absolute;
  bottom: -1.4em;
  left: 50%;
  /* translateX(-50%) keeps it centred; scale(inv-zoom) counter-scales it to a
     constant on-screen size (centred origin preserves the centre point). */
  transform: translateX(-50%) scale(var(--inv-zoom, 1));
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 6px;
  border-radius: 6px;
}

.token-moved {
  border-color: #f39c12;
  border-width: calc(4px * var(--inv-zoom, 1));
  box-shadow: 0 0 calc(20px * var(--inv-zoom, 1)) rgba(243, 156, 18, 0.8);
  animation: pulse-highlight 2s ease-in-out infinite;
}

.token-name-moved {
  background: rgba(243, 156, 18, 0.9);
}

@keyframes pulse-highlight {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
