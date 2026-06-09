<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header / Toolbar -->
      <div class="p-3 border-b border-gray-700 bg-gray-800">
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            🗺️ Battlemap
          </h2>
          <span v-if="hasMap" class="text-sm text-gray-400 truncate max-w-[14rem]">
            {{ map?.name || 'Untitled Battlemap' }}
          </span>

          <div class="flex-1"></div>

          <!-- Display toggle -->
          <button
            v-if="hasMap"
            @click="toggleDisplay"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="store.isDisplayed
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'"
          >
            {{ store.isDisplayed ? '🔲 Hide from Display' : '📺 Show on Display' }}
          </button>

          <!-- DM view reset (trackpad pinch-zoom / two-finger pan) -->
          <button
            v-if="hasMap"
            @click="resetDmView"
            class="tool-icon bg-gray-700 rounded-lg"
            title="Reset your view (pinch to zoom, two-finger drag to pan)"
          >
            ⛶ {{ Math.round(viewScale * 100) }}%
          </button>

          <!-- Display camera group (controls what players see) -->
          <div v-if="hasMap" class="flex items-center gap-1 bg-gray-700 rounded-lg px-1">
            <button @click="zoomOut" class="tool-icon" title="Zoom display out">➖</button>
            <span class="text-xs text-gray-300 w-12 text-center">{{ zoomPercent }}%</span>
            <button @click="zoomIn" class="tool-icon" title="Zoom display in">➕</button>
            <button @click="resetView" class="tool-icon" title="Reset display view">🎯</button>
          </div>

          <button v-if="hasMap" @click="openConfig" class="tool-btn">⚙️ Config</button>
          <button @click="openLoad" class="tool-btn">🗂️ Load</button>

          <!-- Global options burger -->
          <div v-if="hasMap" class="bm-popup relative">
            <button @click.stop="showBurger = !showBurger" class="tool-btn" title="More options">⋯</button>
            <div
              v-if="showBurger"
              class="absolute right-0 mt-1 w-52 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50"
              @click.stop
            >
              <button class="ctx-item" @click="hideAll(); showBurger = false">🌑 Hide entire map</button>
              <button class="ctx-item" @click="revealAll(); showBurger = false">☀️ Reveal entire map</button>
              <p v-if="hiddenTileCount" class="px-3 py-1 text-xs text-gray-500">{{ hiddenTileCount }} tile{{ hiddenTileCount !== 1 ? 's' : '' }} hidden</p>
              <div class="ctx-divider"></div>
              <button class="ctx-item ctx-danger" @click="clearMap(); showBurger = false">🗑️ Clear battlemap</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Editor body -->
      <div class="flex-1 min-h-0 bg-gray-900 relative overflow-hidden">
        <!-- Empty state -->
        <div v-if="!hasMap" class="absolute inset-0 flex items-center justify-center p-4">
          <div class="text-center text-gray-400 max-w-md">
            <p class="text-6xl mb-4">🗺️</p>
            <p class="text-xl text-white mb-2">No battlemap yet</p>
            <p class="mb-6">Select a location background to start building your tactical map.</p>
            <button @click="openBackgroundPicker('new')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              📍 Select Background
            </button>
            <button v-if="store.battlemapFiles.length" @click="openLoad" class="ml-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium">
              🗂️ Load Existing
            </button>
          </div>
        </div>

        <!-- Map viewport: pinch-to-zoom / two-finger pan (DM's local view) -->
        <div
          v-else
          ref="stageViewport"
          class="stage-viewport"
          @wheel.prevent="onWheel"
        >
          <div class="battlemap-stage" :style="stageStyle">
            <div
              class="battlemap-grid"
                :style="{
                  gridTemplateColumns: `repeat(${map!.gridWidth}, 1fr)`,
                  gridTemplateRows: `repeat(${map!.gridHeight}, 1fr)`
                }"
              >
            <div
              v-for="cell in cells"
              :key="cell.key"
              class="battlemap-cell"
              :class="{
                'cell-occupied': cell.token,
                'cell-radius': cell.inRadius,
                'cell-radius-center': cell.isRadiusCenter,
                'cell-move-inrange': cell.isMoveInRange,
                'cell-move-target': cell.isMoveTarget,
                'cell-move-source': cell.isMoveSource,
                'cell-fog': cell.isHidden,
                'cell-region-preview': cell.isRegionPreview
              }"
              @click.stop="onCellClick(cell.x, cell.y, $event)"
              @contextmenu.prevent.stop="onCellRightClick"
              @mousedown="onCellMouseDown(cell.x, cell.y, $event)"
              @mouseenter="onCellEnter(cell.x, cell.y)"
            >
              <div
                v-if="cell.token"
                class="battlemap-token"
                :class="{ 'token-hidden': cell.token.hidden, 'token-selected': cell.isMoveSource }"
                :style="tokenStyle(cell.token)"
                :title="cell.token.name"
              >
                <span
                  v-if="!cell.token.portrait"
                  class="token-initial"
                  :style="{ fontSize: `${Math.max(10, cellPx * 0.4)}px` }"
                >{{ initial(cell.token.name) }}</span>
                <span
                  class="token-name"
                  :style="{ fontSize: `${Math.max(9, cellPx * 0.22)}px` }"
                >{{ withLabel(cleanName(cell.token.name), cell.label) }}</span>
                <span v-if="cell.token.hidden" class="token-hidden-icon">🚫</span>
                <span
                  v-if="cell.token.name.startsWith('???') && cell.token.nameRevealed"
                  class="token-reveal-icon"
                  title="Name revealed to players"
                >👁️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Move-mode hint bar -->
      <div v-if="moveMode" class="px-4 py-2 bg-orange-900/60 border-t border-orange-700 text-orange-100 text-sm flex items-center gap-3">
        🏃 Moving <strong>{{ moveMode.name }}</strong> — click an empty cell to place, or press Esc to cancel.
        <button @click="cancelMove" class="ml-auto px-2 py-0.5 bg-orange-700 hover:bg-orange-600 rounded text-xs">Cancel</button>
      </div>
    </div>

    <!-- Context Menu -->
    <teleport to="body">
      <div
        v-if="contextMenu"
        class="bm-popup fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[10rem]"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <button class="ctx-item" @click="ctxFocus">🎯 Focus Here</button>
        <button v-if="radiusActive" class="ctx-item" @click="ctxClearRadius">❌ Clear Movement Radius</button>

        <template v-if="contextMenu.hasToken">
          <div class="ctx-divider"></div>
          <button class="ctx-item" @click="ctxMove">🏃 Move</button>
          <button class="ctx-item" @click="ctxToggleHidden">
            {{ contextToken?.hidden ? '👁️ Show Token' : '🙈 Hide Token' }}
          </button>
          <button v-if="contextTokenSecret" class="ctx-item" @click="ctxToggleNameReveal">
            {{ contextToken?.nameRevealed ? '🙈 Hide name from players' : '👁️ Reveal name to players' }}
          </button>
          <button v-if="!contextToken?.hidden" class="ctx-item" @click="ctxShowRadius">🎯 Show Movement Radius</button>
          <div class="ctx-divider"></div>
          <button class="ctx-item ctx-danger" @click="ctxRemove">🗑️ Remove Token</button>
        </template>
        <template v-else>
          <div class="ctx-divider"></div>
          <button v-if="canMoveHere" class="ctx-item" @click="ctxMoveHere">🏃 Move {{ radiusTokenName }} here</button>
          <button class="ctx-item" @click="ctxAddToken">👤 Add Token</button>
        </template>
      </div>
    </teleport>

    <!-- Region (drag) Menu -->
    <teleport to="body">
      <div
        v-if="regionMenu"
        class="bm-popup fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[11rem]"
        :style="{ left: `${regionMenu.x}px`, top: `${regionMenu.y}px` }"
        @click.stop
      >
        <p class="px-3 py-1 text-xs text-gray-500">
          {{ regionTileCount }} tile{{ regionTileCount !== 1 ? 's' : '' }} · {{ rulerFeet }} ft
        </p>
        <button class="ctx-item" @click="regionHide">🌑 Hide region</button>
        <button class="ctx-item" @click="regionShow">☀️ Show region</button>
      </div>
    </teleport>

    <!-- Live ruler readout while dragging -->
    <teleport to="body">
      <div
        v-if="fogDragStart && dragPointer && regionTileCount > 1"
        class="fixed z-50 pointer-events-none bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded shadow-lg"
        :style="{ left: `${dragPointer.x + 14}px`, top: `${dragPointer.y + 14}px` }"
      >
        📏 {{ rulerFeet }} ft · {{ regionDims }}
      </div>
    </teleport>

    <!-- Config Modal -->
    <teleport to="body">
      <div v-if="showConfig" class="modal-backdrop" @click.self="showConfig = false">
        <div class="modal-panel w-[28rem] max-w-[90vw]">
          <h3 class="modal-title">⚙️ Map Configuration</h3>

          <label class="modal-label">Map Name</label>
          <input v-model="configName" type="text" class="modal-input" placeholder="Untitled Battlemap" />

          <label class="modal-label mt-4">Background</label>
          <div class="flex items-center gap-3">
            <div class="w-24 h-16 rounded bg-gray-900 overflow-hidden flex items-center justify-center">
              <img v-if="map?.backgroundImage" :src="`media://${map.backgroundImage}`" class="w-full h-full object-cover" />
              <span v-else class="text-gray-500 text-xs">None</span>
            </div>
            <button @click="openBackgroundPicker('change')" class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
              📍 Change Background
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label class="modal-label">Grid Width</label>
              <input v-model.number="configWidth" type="number" min="5" class="modal-input" />
            </div>
            <div>
              <label class="modal-label">Grid Height</label>
              <input :value="derivedHeight" type="number" readonly class="modal-input opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-1">
            {{ map?.imageAspectRatio
              ? `Height auto-derived from background (ratio ${map.imageAspectRatio.toFixed(2)}:1)`
              : 'Select a background to lock the aspect ratio' }}
          </p>

          <div class="flex justify-end gap-2 mt-6">
            <button @click="showConfig = false" class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Cancel</button>
            <button @click="applyConfig" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Apply</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Token Picker Modal -->
    <teleport to="body">
      <div v-if="showTokenPicker" class="modal-backdrop" @click.self="showTokenPicker = false">
        <div class="modal-panel w-[42rem] max-w-[90vw]">
          <h3 class="modal-title">👤 Add Token</h3>
          <input ref="tokenSearchInput" v-model="tokenSearch" type="text" placeholder="Search characters…" class="modal-input mb-3" />
          <div class="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            <button
              v-for="p in filteredPortraits"
              :key="p.path"
              @click="selectToken(p)"
              class="group flex flex-col items-center gap-1"
            >
              <div class="w-full aspect-square rounded-lg overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500 transition"
                   :class="typeRing(p.type)">
                <img :src="`media://${p.path}`" class="w-full h-full object-cover" />
              </div>
              <span class="text-xs text-gray-300 truncate w-full text-center">{{ p.name }}</span>
            </button>
            <p v-if="!filteredPortraits.length" class="col-span-full text-center text-gray-500 py-8">
              No portraits found. Add images with the <code>portrait</code> subtype to your media folder.
            </p>
          </div>
          <div class="flex justify-end mt-4">
            <button @click="showTokenPicker = false" class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Close</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Background Picker Modal -->
    <teleport to="body">
      <div v-if="showBackgroundPicker" class="modal-backdrop" @click.self="showBackgroundPicker = false">
        <div class="modal-panel w-[46rem] max-w-[92vw]">
          <h3 class="modal-title">📍 Select Background</h3>
          <input v-model="bgSearch" type="text" placeholder="Search locations…" class="modal-input mb-3" />
          <div class="grid grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            <button
              v-for="b in filteredBackgrounds"
              :key="b.path"
              @click="selectBackground(b)"
              class="group flex flex-col gap-1"
            >
              <div class="w-full aspect-video rounded-lg overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500 transition">
                <img :src="`media://${b.path}`" class="w-full h-full object-cover" />
              </div>
              <span class="text-xs text-gray-300 truncate text-center">{{ b.name }}</span>
            </button>
            <p v-if="!filteredBackgrounds.length" class="col-span-full text-center text-gray-500 py-8">
              No backgrounds found. Add images ending in <code>_location</code> to your media folder.
            </p>
          </div>
          <div class="flex justify-end mt-4">
            <button @click="showBackgroundPicker = false" class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Close</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Load Modal -->
    <teleport to="body">
      <div v-if="showLoad" class="modal-backdrop" @click.self="showLoad = false">
        <div class="modal-panel w-[40rem] max-w-[90vw]">
          <h3 class="modal-title">🗂️ Load Battlemap</h3>
          <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            <button
              v-for="f in store.battlemapFiles"
              :key="f.path"
              @click="loadFile(f)"
              class="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-lg text-left transition"
            >
              <div class="w-20 h-12 rounded bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                <img v-if="f.backgroundImage" :src="`media://${f.backgroundImage}`" class="w-full h-full object-cover" />
                <span v-else class="text-gray-600 text-xs">No bg</span>
              </div>
              <div class="min-w-0">
                <p class="text-white font-medium truncate">{{ f.name }}</p>
                <p class="text-xs text-gray-400">{{ f.gridWidth }}×{{ f.gridHeight }} · {{ f.tokenCount }} token{{ f.tokenCount !== 1 ? 's' : '' }}</p>
              </div>
            </button>
            <p v-if="!store.battlemapFiles.length" class="text-center text-gray-500 py-8">No saved battlemaps yet.</p>
          </div>
          <div class="flex justify-end mt-4">
            <button @click="showLoad = false" class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Close</button>
          </div>
        </div>
      </div>
    </teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useBattlemapStore, useDirectoryStore, usePartyStore } from '../stores'
import { getAllVisualMedia } from '../utils/mediaFilters'
import { getGMDisplayName } from '../utils/displayNames'
import {
  cellsInRadius,
  computeTokenLabels,
  isWithinRadius,
  parseTokenKey,
  radiusFromSpeed,
  tokenKey,
  withLabel,
  DEFAULT_MOVEMENT_SPEED,
  FEET_PER_CELL
} from '../utils/battlemap'
import type { Battlemap, BattlemapToken, BattlemapFileInfo, BattlemapTokenType } from '../types'

const store = useBattlemapStore()
const directoryStore = useDirectoryStore()
const partyStore = usePartyStore()

const map = computed<Battlemap | null>(() => store.currentBattlemap)
const hasMap = computed(() => !!map.value)

// File the current map persists to
const currentFileName = ref<string>('default_battlemap.json')

// ---- Editor-only state ----
const moveMode = ref<{ fromX: number; fromY: number; name: string } | null>(null)
// Automatic move-mode radius lives only in the editor (never displayed/persisted)
const localAutoRadius = ref<{ centerX: number; centerY: number; radius: number } | null>(null)

// Fog of war: drag a rectangle of tiles, then choose Hide/Show in a menu.
// A plain click (no drag) falls through to the normal per-tile context menu.
const fogDragStart = ref<{ x: number; y: number } | null>(null)
const fogDragCurrent = ref<{ x: number; y: number } | null>(null)
// Live cursor position while dragging (for the ruler readout)
const dragPointer = ref<{ x: number; y: number } | null>(null)
// The dragged region, kept while its Hide/Show menu is open
const pendingRegion = ref<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
const regionMenu = ref<{ x: number; y: number } | null>(null)
// Global options burger menu
const showBurger = ref(false)

// DM's local view (pinch-to-zoom / two-finger pan) — affects only the editor,
// not what players see. We zoom by changing the stage's real pixel size (so the
// background image, grid and labels re-rasterise crisply) and translate to pan.
const stageViewport = ref<HTMLElement | null>(null)
const viewScale = ref(1)
const panX = ref(0)
const panY = ref(0)
const viewportW = ref(1)
const viewportH = ref(1)
const VIEW_PADDING = 32
const MIN_VIEW_SCALE = 0.25
const MAX_VIEW_SCALE = 8

function clampScale(s: number): number {
  return Math.min(MAX_VIEW_SCALE, Math.max(MIN_VIEW_SCALE, s))
}

// Base (scale-1) fit size of the map within the viewport
const baseStageWidth = computed(() => {
  if (!map.value) return 0
  const aspect = map.value.gridWidth / map.value.gridHeight
  return Math.max(50, Math.min(viewportW.value - VIEW_PADDING, (viewportH.value - VIEW_PADDING) * aspect))
})

// Actual on-screen box of the stage given current zoom + pan
const stageBox = computed(() => {
  if (!map.value) return { w: 0, h: 0, tx: 0, ty: 0 }
  const aspect = map.value.gridWidth / map.value.gridHeight
  const w = baseStageWidth.value * viewScale.value
  const h = w / aspect
  const tx = (viewportW.value - w) / 2 + panX.value
  const ty = (viewportH.value - h) / 2 + panY.value
  return { w, h, tx, ty }
})

const cellPx = computed(() => (map.value ? stageBox.value.w / map.value.gridWidth : 0))

function measureViewport(): void {
  const el = stageViewport.value
  if (el) {
    viewportW.value = el.clientWidth
    viewportH.value = el.clientHeight
  }
}

let viewportObserver: ResizeObserver | null = null
watch(stageViewport, (el) => {
  viewportObserver?.disconnect()
  viewportObserver = null
  if (el) {
    viewportObserver = new ResizeObserver(() => measureViewport())
    viewportObserver.observe(el)
    measureViewport()
  }
})

function onWheel(e: WheelEvent) {
  const vp = stageViewport.value
  if (!vp || !map.value) return
  const rect = vp.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top

  // Trackpad pinch / ctrl+wheel = zoom toward the cursor; otherwise pan.
  if (e.ctrlKey || e.metaKey) {
    const box = stageBox.value
    const fx = box.w ? (cx - box.tx) / box.w : 0.5
    const fy = box.h ? (cy - box.ty) / box.h : 0.5
    const newScale = clampScale(viewScale.value * Math.exp(-e.deltaY * 0.01))
    const aspect = map.value.gridWidth / map.value.gridHeight
    const w2 = baseStageWidth.value * newScale
    const h2 = w2 / aspect
    // Keep the point under the cursor fixed after the zoom
    panX.value = cx - fx * w2 - (viewportW.value - w2) / 2
    panY.value = cy - fy * h2 - (viewportH.value - h2) / 2
    viewScale.value = newScale
  } else {
    panX.value -= e.deltaX
    panY.value -= e.deltaY
  }
}

function resetDmView() {
  viewScale.value = 1
  panX.value = 0
  panY.value = 0
}

const contextMenu = ref<{ x: number; y: number; cellX: number; cellY: number; hasToken: boolean } | null>(null)

const showConfig = ref(false)
const showTokenPicker = ref(false)
const showBackgroundPicker = ref(false)
const showLoad = ref(false)

const bgPickerMode = ref<'new' | 'change'>('new')
const pickerCell = ref<{ x: number; y: number }>({ x: 0, y: 0 })

const tokenSearch = ref('')
const bgSearch = ref('')
const tokenSearchInput = ref<HTMLInputElement | null>(null)

const configName = ref('')
const configWidth = ref(20)

// ---- Media sources ----
const allVisual = computed(() => getAllVisualMedia(directoryStore.mediaTree))

const availablePortraits = computed(() =>
  allVisual.value
    .filter((m) => m.mediaType === 'image' && m.mediaSubtype === 'portrait')
    .map((m) => ({
      name: getGMDisplayName(m),
      path: m.path,
      type: (partyStore.members.some((p) => p.portraitPath === m.path)
        ? 'player'
        : 'character') as BattlemapTokenType
    }))
)

const availableBackgrounds = computed(() =>
  allVisual.value
    .filter((m) => m.mediaType === 'image' && m.mediaSubtype === 'background')
    .map((m) => ({ name: getGMDisplayName(m), path: m.path }))
)

const filteredPortraits = computed(() => {
  const q = tokenSearch.value.trim().toLowerCase()
  if (!q) return availablePortraits.value
  return availablePortraits.value.filter((p) => p.name.toLowerCase().includes(q))
})

const filteredBackgrounds = computed(() => {
  const q = bgSearch.value.trim().toLowerCase()
  if (!q) return availableBackgrounds.value
  return availableBackgrounds.value.filter((b) => b.name.toLowerCase().includes(q))
})

// ---- Derived rendering ----
const zoomPercent = computed(() => Math.round((map.value?.zoom?.scale ?? 1) * 100))

const radiusActive = computed(() => !!map.value?.movementRadius?.active || !!localAutoRadius.value)

// ---- Fog of war ----
const hiddenTileSet = computed(() => new Set(map.value?.hiddenTiles || []))
const hiddenTileCount = computed(() => hiddenTileSet.value.size)

// Inclusive rectangle bounds being dragged (or pending while the menu is open)
const fogDragRect = computed(() => {
  const a = fogDragStart.value
  const b = fogDragCurrent.value
  if (a && b) {
    return {
      x0: Math.min(a.x, b.x),
      y0: Math.min(a.y, b.y),
      x1: Math.max(a.x, b.x),
      y1: Math.max(a.y, b.y)
    }
  }
  return pendingRegion.value
})

function inRegionPreview(x: number, y: number): boolean {
  const r = fogDragRect.value
  return !!r && x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1
}

const regionTileCount = computed(() => {
  const r = fogDragRect.value
  if (!r) return 0
  return (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1)
})

const regionDims = computed(() => {
  const r = fogDragRect.value
  if (!r) return ''
  return `${r.x1 - r.x0 + 1}×${r.y1 - r.y0 + 1}`
})

// Straight-line (Euclidean) distance from the start to the end tile, in feet
const rulerFeet = computed(() => {
  const r = fogDragRect.value
  if (!r) return 0
  return Math.round(Math.hypot(r.x1 - r.x0, r.y1 - r.y0) * FEET_PER_CELL)
})

const contextToken = computed<BattlemapToken | null>(() => {
  if (!contextMenu.value || !map.value) return null
  return map.value.tokens[tokenKey(contextMenu.value.cellX, contextMenu.value.cellY)] || null
})

// Whether the right-clicked token is a "???" secret token (eligible for reveal)
const contextTokenSecret = computed(() => !!contextToken.value?.name.startsWith('???'))

// Name of the token whose (manual) movement radius is currently shown
const radiusTokenName = computed(() => {
  const mr = map.value?.movementRadius
  if (!mr?.active) return ''
  return cleanName(mr.tokenName || map.value?.tokens[tokenKey(mr.centerX, mr.centerY)]?.name || 'token')
})

// "Move here" applies when a movement radius is shown and the right-clicked
// empty cell is reachable within that radius.
const canMoveHere = computed(() => {
  const cm = contextMenu.value
  const mr = map.value?.movementRadius
  if (!cm || !mr?.active || cm.hasToken) return false
  if (cm.cellX === mr.centerX && cm.cellY === mr.centerY) return false
  // The source cell must still hold a token to move
  if (!map.value?.tokens[tokenKey(mr.centerX, mr.centerY)]) return false
  return isWithinRadius(cm.cellX, cm.cellY, mr.centerX, mr.centerY, mr.radius)
})

const stageStyle = computed(() => {
  if (!map.value) return {}
  const box = stageBox.value
  return {
    position: 'absolute' as const,
    left: '0',
    top: '0',
    width: `${box.w}px`,
    height: `${box.h}px`,
    transform: `translate(${box.tx}px, ${box.ty}px)`,
    backgroundImage: map.value.backgroundImage ? `url('media://${map.value.backgroundImage}')` : 'none'
  }
})

// Merged editor radius (manual on the map, or the local automatic one)
const editorRadius = computed(() => {
  const m = map.value?.movementRadius
  if (m?.active) return { centerX: m.centerX, centerY: m.centerY, radius: m.radius }
  return localAutoRadius.value
})

const radiusCellSet = computed(() => {
  const r = editorRadius.value
  if (!r || !map.value) return new Set<string>()
  return cellsInRadius(r.centerX, r.centerY, r.radius, map.value.gridWidth, map.value.gridHeight)
})

// Auto-labels (A, B, C…) for matching tokens, keyed by "x-y"
const tokenLabels = computed(() => computeTokenLabels(map.value?.tokens || {}))

interface EditorCell {
  key: string
  x: number
  y: number
  token: BattlemapToken | null
  label: string
  inRadius: boolean
  isRadiusCenter: boolean
  isMoveInRange: boolean
  isMoveTarget: boolean
  isMoveSource: boolean
  isHidden: boolean
  isRegionPreview: boolean
}

const cells = computed<EditorCell[]>(() => {
  const list: EditorCell[] = []
  if (!map.value) return list
  const { gridWidth, gridHeight, tokens } = map.value
  const r = editorRadius.value
  const mv = moveMode.value
  const fog = hiddenTileSet.value
  const labels = tokenLabels.value

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const key = tokenKey(x, y)
      const token = tokens[key] || null
      const isRadiusCenter = !!r && r.centerX === x && r.centerY === y
      const inRadius = !isRadiusCenter && radiusCellSet.value.has(key)
      const isMoveSource = !!mv && mv.fromX === x && mv.fromY === y
      // While moving: reachable (in-range) empty cells are filled blue, cells
      // beyond the movement radius keep the orange "drop anywhere" highlight.
      const isEmptyTarget = !!mv && !token && !isMoveSource
      list.push({
        key,
        x,
        y,
        token,
        label: labels[key] || '',
        inRadius,
        isRadiusCenter,
        isMoveSource,
        isMoveInRange: isEmptyTarget && inRadius,
        isMoveTarget: isEmptyTarget && !inRadius,
        isHidden: fog.has(key),
        isRegionPreview: inRegionPreview(x, y)
      })
    }
  }
  return list
})

const derivedHeight = computed(() => {
  const aspect = map.value?.imageAspectRatio
  if (!aspect) return map.value?.gridHeight ?? 0
  return Math.max(5, Math.round(configWidth.value / aspect))
})

// ---- Persistence / display sync ----
function fileNameFor(bm: Battlemap): string {
  const safe = (bm.name || 'untitled')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
  return `${safe || 'untitled'}_battlemap.json`
}

async function persist(): Promise<void> {
  if (!map.value) return
  await store.saveBattlemap(currentFileName.value)
  if (store.isDisplayed) {
    await store.displayBattlemap()
  }
}

// ---- Image helpers ----
function loadAspectRatio(path: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1)
    img.onerror = () => resolve(1)
    img.src = `media://${path}`
  })
}

// ---- Token helpers ----
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

function typeRing(type?: string): string {
  if (type === 'enemy') return 'ring-1 ring-red-500/40'
  if (type === 'player') return 'ring-1 ring-blue-500/40'
  return ''
}

function initial(name: string): string {
  return (name || '?').trim().charAt(0).toUpperCase()
}

function cleanName(name: string): string {
  return name.replace(/_/g, ' ')
}

function tokenSpeed(token: BattlemapToken): number {
  return token.movementSpeed ?? DEFAULT_MOVEMENT_SPEED
}

// ---- Cell interaction ----
function onCellClick(x: number, y: number, event: MouseEvent) {
  // A multi-cell drag fires no cell-level click; a single click lands here.
  if (moveMode.value && event.type === 'click') {
    // In move mode a left click on an empty cell completes the move
    const occupied = !!map.value?.tokens[tokenKey(x, y)]
    if (!occupied) {
      completeMove(x, y)
      return
    }
    // clicking an occupied cell cancels
    cancelMove()
    return
  }
  openContextMenu(x, y, event)
}

// Right-click anywhere on the grid dismisses any open menus
function onCellRightClick() {
  contextMenu.value = null
  closeRegionMenu()
}

// ---- Region drag (fog of war) ----
function onCellMouseDown(x: number, y: number, event: MouseEvent) {
  // Left-drag only, and not while placing a token
  if (event.button !== 0 || moveMode.value) return
  event.preventDefault() // avoid text selection while dragging a region
  // Starting a new gesture dismisses a region menu left open from a prior drag
  closeRegionMenu()
  fogDragStart.value = { x, y }
  fogDragCurrent.value = { x, y }
  dragPointer.value = { x: event.clientX, y: event.clientY }
}

function onCellEnter(x: number, y: number) {
  if (fogDragStart.value) fogDragCurrent.value = { x, y }
}

// Track the cursor while dragging so the ruler readout can follow it
function onPointerMove(event: MouseEvent) {
  if (fogDragStart.value) dragPointer.value = { x: event.clientX, y: event.clientY }
}

// Fired on window mouseup: a true drag (start ≠ end) opens the region menu;
// a single-cell press is left to the normal click → per-tile menu.
function onPointerUp(event: MouseEvent) {
  const start = fogDragStart.value
  const cur = fogDragCurrent.value
  fogDragStart.value = null
  fogDragCurrent.value = null
  dragPointer.value = null
  if (!start || !cur) return

  const isDrag = start.x !== cur.x || start.y !== cur.y
  if (!isDrag) return

  // Keep the region highlighted while its menu is open
  pendingRegion.value = {
    x0: Math.min(start.x, cur.x),
    y0: Math.min(start.y, cur.y),
    x1: Math.max(start.x, cur.x),
    y1: Math.max(start.y, cur.y)
  }
  contextMenu.value = null
  regionMenu.value = {
    x: Math.min(event.clientX, window.innerWidth - 200),
    y: Math.min(event.clientY, window.innerHeight - 140)
  }
}

function applyFogRect(
  rect: { x0: number; y0: number; x1: number; y1: number },
  hide: boolean
): void {
  if (!map.value) return
  const set = new Set(map.value.hiddenTiles || [])
  for (let y = rect.y0; y <= rect.y1; y++) {
    for (let x = rect.x0; x <= rect.x1; x++) {
      const key = tokenKey(x, y)
      if (hide) set.add(key)
      else set.delete(key)
    }
  }
  map.value.hiddenTiles = Array.from(set)
  persist()
}

function closeRegionMenu() {
  regionMenu.value = null
  pendingRegion.value = null
}

function regionHide() {
  if (pendingRegion.value) applyFogRect(pendingRegion.value, true)
  closeRegionMenu()
}

function regionShow() {
  if (pendingRegion.value) applyFogRect(pendingRegion.value, false)
  closeRegionMenu()
}

// ---- Whole-map fog (burger menu) ----
function hideAll() {
  if (!map.value) return
  const all: string[] = []
  for (let y = 0; y < map.value.gridHeight; y++) {
    for (let x = 0; x < map.value.gridWidth; x++) all.push(tokenKey(x, y))
  }
  map.value.hiddenTiles = all
  persist()
}

function revealAll() {
  if (!map.value) return
  map.value.hiddenTiles = []
  persist()
}

function openContextMenu(x: number, y: number, event: MouseEvent) {
  // Opening a tile menu dismisses a lingering region menu
  closeRegionMenu()
  contextMenu.value = {
    x: Math.min(event.clientX, window.innerWidth - 180),
    y: Math.min(event.clientY, window.innerHeight - 280),
    cellX: x,
    cellY: y,
    hasToken: !!map.value?.tokens[tokenKey(x, y)]
  }
}

// Dismiss any open menu when pressing anywhere that isn't inside a menu.
// Using mousedown (not click) means it fires before a new menu opens and isn't
// fooled by the synthetic click that follows a drag.
function handleDocMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('.bm-popup')) return
  contextMenu.value = null
  closeRegionMenu()
  showBurger.value = false
}

// ---- Context menu actions ----
function ctxFocus() {
  if (!contextMenu.value) return
  focusCell(contextMenu.value.cellX, contextMenu.value.cellY)
  contextMenu.value = null
}

function ctxClearRadius() {
  clearRadius()
  contextMenu.value = null
}

function ctxMove() {
  if (!contextMenu.value) return
  enterMoveMode(contextMenu.value.cellX, contextMenu.value.cellY)
  contextMenu.value = null
}

function ctxToggleHidden() {
  if (!contextMenu.value) return
  const { cellX, cellY } = contextMenu.value
  const token = map.value?.tokens[tokenKey(cellX, cellY)]
  if (token) {
    store.updateToken(cellX, cellY, { hidden: !token.hidden })
    persist()
  }
  contextMenu.value = null
}

function ctxToggleNameReveal() {
  if (!contextMenu.value) return
  const { cellX, cellY } = contextMenu.value
  const token = map.value?.tokens[tokenKey(cellX, cellY)]
  if (token) {
    store.updateToken(cellX, cellY, { nameRevealed: !token.nameRevealed })
    persist()
  }
  contextMenu.value = null
}

function ctxShowRadius() {
  if (!contextMenu.value || !map.value) return
  const { cellX, cellY } = contextMenu.value
  const token = map.value.tokens[tokenKey(cellX, cellY)]
  if (token) {
    const speed = tokenSpeed(token)
    store.setMovementRadius({
      active: true,
      centerX: cellX,
      centerY: cellY,
      radius: radiusFromSpeed(speed),
      tokenName: token.name,
      movementSpeed: speed,
      isAutomatic: false
    })
    localAutoRadius.value = null
    persist()
  }
  contextMenu.value = null
}

function ctxRemove() {
  if (!contextMenu.value) return
  store.removeToken(contextMenu.value.cellX, contextMenu.value.cellY)
  persist()
  contextMenu.value = null
}

function ctxAddToken() {
  if (!contextMenu.value) return
  pickerCell.value = { x: contextMenu.value.cellX, y: contextMenu.value.cellY }
  contextMenu.value = null
  tokenSearch.value = ''
  showTokenPicker.value = true
  nextTick(() => tokenSearchInput.value?.focus())
}

// ---- Move mode ----
function enterMoveMode(x: number, y: number) {
  const token = map.value?.tokens[tokenKey(x, y)]
  if (!token) return
  moveMode.value = { fromX: x, fromY: y, name: token.name }
  // Show an automatic, editor-only radius if no manual one is active
  if (!map.value?.movementRadius?.active) {
    localAutoRadius.value = { centerX: x, centerY: y, radius: radiusFromSpeed(tokenSpeed(token)) }
  }
}

function moveTokenTo(fromX: number, fromY: number, toX: number, toY: number) {
  if (!map.value) return
  store.moveToken(fromX, fromY, toX, toY)
  // Highlight and focus the moved token on the display
  const token = map.value.tokens[tokenKey(toX, toY)]
  map.value.zoom = {
    scale: map.value.zoom?.scale ?? 1,
    centerX: (toX + 0.5) / map.value.gridWidth,
    centerY: (toY + 0.5) / map.value.gridHeight,
    lastMovedToken: { x: toX, y: toY, name: token?.name }
  }
  moveMode.value = null
  localAutoRadius.value = null
  // Movement radius is cleared after a move (matches legacy)
  if (map.value.movementRadius?.active) store.clearMovementRadius()
  persist()
}

function completeMove(toX: number, toY: number) {
  const mv = moveMode.value
  if (!mv) return
  moveTokenTo(mv.fromX, mv.fromY, toX, toY)
}

function cancelMove() {
  moveMode.value = null
  localAutoRadius.value = null
}

// Move the token whose movement radius is shown directly to the clicked cell
function ctxMoveHere() {
  const cm = contextMenu.value
  const mr = map.value?.movementRadius
  if (!cm || !mr?.active) return
  moveTokenTo(mr.centerX, mr.centerY, cm.cellX, cm.cellY)
  contextMenu.value = null
}

// ---- Movement radius ----
function clearRadius() {
  localAutoRadius.value = null
  if (map.value?.movementRadius?.active) {
    store.clearMovementRadius()
    persist()
  }
}

// ---- Zoom / focus ----
function updateZoom(z: Partial<NonNullable<Battlemap['zoom']>>) {
  if (!map.value) return
  map.value.zoom = {
    scale: map.value.zoom?.scale ?? 1,
    centerX: map.value.zoom?.centerX ?? 0.5,
    centerY: map.value.zoom?.centerY ?? 0.5,
    lastMovedToken: map.value.zoom?.lastMovedToken,
    ...z
  }
  persist()
}

function zoomIn() {
  updateZoom({ scale: Math.min((map.value?.zoom?.scale ?? 1) * 1.2, 4) })
}

function zoomOut() {
  updateZoom({ scale: Math.max((map.value?.zoom?.scale ?? 1) / 1.2, 0.3) })
}

function resetView() {
  updateZoom({ scale: 1, centerX: 0.5, centerY: 0.5, lastMovedToken: undefined })
}

function focusCell(x: number, y: number) {
  if (!map.value) return
  const token = map.value.tokens[tokenKey(x, y)]
  updateZoom({
    centerX: (x + 0.5) / map.value.gridWidth,
    centerY: (y + 0.5) / map.value.gridHeight,
    lastMovedToken: token && !token.hidden ? { x, y, name: token.name } : undefined
  })
}

// ---- Display toggle ----
async function toggleDisplay() {
  if (store.isDisplayed) {
    const ok = await store.hideBattlemap()
    if (!ok) alert(`Could not hide battlemap: ${store.lastError ?? 'unknown error'}`)
  } else {
    const ok = await store.displayBattlemap()
    if (!ok) alert(`Could not show battlemap on display: ${store.lastError ?? 'unknown error'}`)
  }
}

// ---- Config ----
function openConfig() {
  if (!map.value) return
  configName.value = map.value.name || ''
  configWidth.value = map.value.gridWidth
  showConfig.value = true
}

function applyConfig() {
  if (!map.value) return
  map.value.name = configName.value.trim() || 'Untitled Battlemap'
  applyGridWidth(configWidth.value)
  currentFileName.value = fileNameFor(map.value)
  showConfig.value = false
  persist()
}

function applyGridWidth(newWidth: number) {
  if (!map.value) return
  const width = Math.max(5, Math.round(newWidth) || 5)
  const aspect = map.value.imageAspectRatio || width / map.value.gridHeight
  const height = Math.max(5, Math.round(width / aspect))

  // Prune tokens that fall outside the new bounds
  const pruned: Record<string, BattlemapToken> = {}
  for (const [key, token] of Object.entries(map.value.tokens)) {
    const { x, y } = parseTokenKey(key)
    if (x < width && y < height) pruned[key] = token
  }
  // Prune fog tiles that fall outside the new bounds too
  const prunedFog = (map.value.hiddenTiles || []).filter((key) => {
    const { x, y } = parseTokenKey(key)
    return x < width && y < height
  })
  map.value.gridWidth = width
  map.value.gridHeight = height
  map.value.tokens = pruned
  map.value.hiddenTiles = prunedFog
}

// ---- Pickers ----
function openBackgroundPicker(mode: 'new' | 'change') {
  bgPickerMode.value = mode
  bgSearch.value = ''
  showConfig.value = false
  showBackgroundPicker.value = true
}

async function selectBackground(b: { name: string; path: string }) {
  const aspect = await loadAspectRatio(b.path)

  if (bgPickerMode.value === 'new' || !map.value) {
    const gridWidth = 20
    const gridHeight = Math.max(5, Math.round(gridWidth / aspect))
    store.createBattlemap(gridWidth, gridHeight, b.path, 'Untitled Battlemap')
    if (store.currentBattlemap) {
      store.currentBattlemap.imageAspectRatio = aspect
      currentFileName.value = fileNameFor(store.currentBattlemap)
    }
    resetDmView()
  } else {
    map.value.backgroundImage = b.path
    map.value.imageAspectRatio = aspect
    applyGridWidth(map.value.gridWidth)
  }
  const reopenConfig = bgPickerMode.value === 'change'
  showBackgroundPicker.value = false
  await persist()
  if (reopenConfig) {
    configWidth.value = map.value?.gridWidth ?? 20
    showConfig.value = true
  }
}

function selectToken(p: { name: string; path: string; type: BattlemapTokenType }) {
  const { x, y } = pickerCell.value
  // Monotonic sequence so matching tokens label A, B, C… in insertion order
  const maxSeq = Object.values(map.value?.tokens || {}).reduce(
    (m, t) => Math.max(m, t.seq ?? -1),
    -1
  )
  store.setToken(x, y, {
    name: p.name,
    x,
    y,
    portrait: p.path,
    type: p.type,
    hidden: true,
    seq: maxSeq + 1
  })
  showTokenPicker.value = false
  persist()
}

// ---- Load / clear ----
function openLoad() {
  store.refreshBattlemapList()
  showLoad.value = true
}

async function loadFile(f: BattlemapFileInfo) {
  await store.loadBattlemap(f.path)
  currentFileName.value = f.filename
  showLoad.value = false
  resetDmView()
  if (store.isDisplayed) await store.displayBattlemap()
}

async function clearMap() {
  if (!confirm('Clear the current battlemap? This removes all tokens and the background from the editor.')) {
    return
  }
  if (store.isDisplayed) await store.hideBattlemap()
  store.clearBattlemap()
  moveMode.value = null
  localAutoRadius.value = null
}

function closeModals() {
  showConfig.value = false
  showTokenPicker.value = false
  showBackgroundPicker.value = false
  showLoad.value = false
}

// ---- Keyboard ----
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (fogDragStart.value) {
    // cancel an in-progress fog rectangle
    fogDragStart.value = null
    fogDragCurrent.value = null
    return
  }
  if (regionMenu.value) return closeRegionMenu()
  if (showBurger.value) {
    showBurger.value = false
    return
  }
  if (moveMode.value) return cancelMove()
  if (radiusActive.value) return clearRadius()
  if (contextMenu.value) {
    contextMenu.value = null
    return
  }
  closeModals()
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('mousemove', onPointerMove)
  document.addEventListener('mousedown', handleDocMouseDown)
  await Promise.all([partyStore.initialize(), store.refreshBattlemapList()])
  // Load the most recent battlemap if none is active yet
  if (!store.currentBattlemap && store.battlemapFiles.length) {
    const recent = store.battlemapFiles[0]
    await store.loadBattlemap(recent.path)
    currentFileName.value = recent.filename
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('mousemove', onPointerMove)
  document.removeEventListener('mousedown', handleDocMouseDown)
  viewportObserver?.disconnect()
})
</script>

<style scoped>
.tool-btn,
.tool-btn-danger {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: #fff;
  background: #374151;
  transition: background-color 0.15s;
}
.tool-btn:hover {
  background: #4b5563;
}
.tool-btn-danger:hover {
  background: #b91c1c;
}
.tool-icon {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.375rem;
  transition: background-color 0.15s;
}
.tool-icon:hover {
  background: #4b5563;
}

/* ---- Map viewport (DM pan/zoom) ---- */
.stage-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

/* ---- Map stage ---- */
.battlemap-stage {
  position: relative;
  background-size: cover;
  background-position: top left;
  background-color: #11161c;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.battlemap-grid {
  position: absolute;
  inset: 0;
  display: grid;
  gap: 1px;
}

.battlemap-cell {
  position: relative;
  background: rgba(52, 73, 94, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
  cursor: pointer;
  transition: background 0.12s;
}
.battlemap-cell:hover {
  background: rgba(52, 152, 219, 0.3);
}
.cell-occupied {
  background: rgba(46, 204, 113, 0.18);
}
.cell-radius {
  background: rgba(52, 152, 219, 0.3);
  box-shadow: inset 0 0 0 1px rgba(52, 152, 219, 0.8);
}
.cell-radius-center {
  background: rgba(52, 152, 219, 0.55);
  box-shadow: inset 0 0 0 2px rgba(52, 152, 219, 1);
}
/* Reachable cells while moving — filled blue (within the movement radius) */
.cell-move-inrange {
  background: rgba(52, 152, 219, 0.45);
  box-shadow: inset 0 0 0 1px rgba(52, 152, 219, 0.9);
  cursor: crosshair;
}
.cell-move-inrange:hover {
  background: rgba(52, 152, 219, 0.7);
}
/* Cells beyond the movement radius — still droppable, shown orange */
.cell-move-target {
  background: rgba(243, 156, 18, 0.35);
  cursor: crosshair;
}
.cell-move-target:hover {
  background: rgba(243, 156, 18, 0.55);
}

/* ---- Fog of war (DM sees a dark veil; players see solid black) ---- */
.cell-fog {
  background: rgba(0, 0, 0, 0.62);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
}
/* Region selection preview while dragging / choosing hide vs show */
.cell-region-preview {
  background: rgba(99, 102, 241, 0.4);
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.95);
  cursor: crosshair;
}

/* ---- Tokens ---- */
.battlemap-token {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.token-initial {
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}
.token-name {
  position: absolute;
  bottom: -1.25em;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.6rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 0 4px;
  border-radius: 4px;
  pointer-events: none;
}
.token-hidden {
  opacity: 0.3;
  filter: grayscale(50%);
}
.token-hidden-icon {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 0.6rem;
}
.token-reveal-icon {
  position: absolute;
  top: -4px;
  left: -4px;
  font-size: 0.6rem;
}
.token-selected {
  border: 3px solid #f39c12;
  box-shadow: 0 0 14px rgba(243, 156, 18, 0.9);
  animation: token-pulse 1.2s ease-in-out infinite;
}
@keyframes token-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* ---- Context menu ---- */
.ctx-item {
  width: 100%;
  text-align: left;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #e5e7eb;
  transition: background-color 0.15s;
}
.ctx-item:hover {
  background: #374151;
}
.ctx-danger {
  color: #fca5a5;
}
.ctx-danger:hover {
  background: rgba(127, 29, 29, 0.4);
}
.ctx-divider {
  margin: 0.25rem 0;
  border-top: 1px solid #374151;
}

/* ---- Modals ---- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-panel {
  padding: 1.25rem;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.modal-title {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1rem;
}
.modal-label {
  display: block;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}
.modal-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: #111827;
  color: #fff;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
}
.modal-input:focus {
  border-color: #3b82f6;
  outline: none;
}
</style>
