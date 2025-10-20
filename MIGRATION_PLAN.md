# D&D Helper - Vue 3 Migration Plan

## 📋 Overview

Migrate the D&D Helper Electron app from vanilla HTML/JS to **Vue 3 + electron-vite + TypeScript** without breaking any features.

**Current State:**
- Vanilla HTML/CSS/JS
- 3 separate HTML files (7,800+ lines)
- Manual DOM manipulation
- Inline styles and scripts
- No build process (beyond Electron)

**Target State:**
- Vue 3 (Composition API)
- electron-vite (optimized Electron + Vite setup)
- TypeScript
- Component-based architecture
- Tailwind CSS for styling
- Pinia for state management
- Vitest for unit tests (migrated from Jest)

---

## 🎯 Goals

✅ Zero feature loss
✅ Improved developer experience
✅ Better testability
✅ Type safety
✅ Hot Module Replacement (HMR)
✅ Smaller bundle size
✅ Maintainable codebase

---

## 📊 Current Feature Inventory

### Window 1: Starting Screen
- ✅ Directory selection dialog
- ✅ Cached directory loading
- ✅ Directory validation
- ✅ Session start button
- ✅ Visual feedback (cached vs new)

### Window 2: Dashboard (7,637 lines!)
**Left Sidebar:**
- ✅ Collapsible navigation
- ✅ Media browser view
- ✅ Party management view
- ✅ Encounter management view
- ✅ Initiative tracker view
- ✅ Battlemap view

**Main Content Area:**
- ✅ Media file browser (tree view)
- ✅ Media categorization (images, videos, audio)
- ✅ Media thumbnails
- ✅ Drag & drop support (implied)
- ✅ Battlemap editor
  - ✅ Grid-based battlemap
  - ✅ Token placement
  - ✅ Movement radius visualization
  - ✅ Zoom and pan
  - ✅ Background image support
  - ✅ Save/load battlemaps

**Right Sidebar (Live Display Panel):**
- ✅ Portrait list (with preview)
- ✅ Background media display
- ✅ Event media display
- ✅ Audio controls (sounds, music, effects)
- ✅ Clear buttons for each section

**Modals:**
- ✅ Portrait selection modal
- ✅ Enemy portrait selection modal
- ✅ Encounter selection modal
- ✅ Load battlemap modal
- ✅ Add note modal
- ✅ HP modal
- ✅ Enemy info modal

**Party Management:**
- ✅ Add/remove party members
- ✅ Edit character details
- ✅ Save/load party data
- ✅ Portrait assignment

**Encounter Management:**
- ✅ Create encounters
- ✅ Add enemies
- ✅ Save/load encounters
- ✅ List encounter files

**Initiative Tracker:**
- ✅ Roll initiative
- ✅ Track turn order
- ✅ HP tracking
- ✅ Save/load initiative state

### Window 3: Display Window
- ✅ Portrait layer (dynamic scaling based on count)
- ✅ Background layer (images/videos)
- ✅ Event layer (full-screen videos)
- ✅ Fade transitions
- ✅ Battlemap display
  - ✅ Grid rendering
  - ✅ Token display
  - ✅ Movement radius highlighting
  - ✅ Zoom support
  - ✅ Last moved token highlight
- ✅ Keyboard shortcuts (Escape, Spacebar)
- ✅ Auto-hide/restore on event end

### IPC Communication
- ✅ 20+ IPC channels
- ✅ Bi-directional communication
- ✅ State synchronization between windows

---

## 🏗️ New Project Structure

```
dd-helper-vue/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts            # Entry point
│   │   ├── windows/
│   │   │   ├── MainWindow.ts
│   │   │   └── DisplayWindow.ts
│   │   ├── ipc/
│   │   │   ├── handlers.ts
│   │   │   ├── directory.ts
│   │   │   ├── media.ts
│   │   │   ├── party.ts
│   │   │   ├── encounter.ts
│   │   │   ├── initiative.ts
│   │   │   └── battlemap.ts
│   │   └── services/
│   │       ├── DirectoryService.ts
│   │       ├── MediaScanner.ts
│   │       └── FileStorage.ts
│   │
│   ├── preload/                 # Preload Scripts
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   └── renderer/                # Vue 3 Renderer
│       ├── src/
│       │   ├── main.ts          # Vue app entry
│       │   ├── App.vue          # Root component
│       │   │
│       │   ├── windows/          # Window Components
│       │   │   ├── StartingScreen.vue
│       │   │   ├── Dashboard.vue
│       │   │   └── DisplayWindow.vue
│       │   │
│       │   ├── components/       # Shared Components
│       │   │   ├── common/
│       │   │   │   ├── Button.vue
│       │   │   │   ├── Modal.vue
│       │   │   │   └── Card.vue
│       │   │   │
│       │   │   ├── dashboard/
│       │   │   │   ├── Sidebar.vue
│       │   │   │   ├── MediaBrowser.vue
│       │   │   │   ├── LiveDisplayPanel.vue
│       │   │   │   └── NavigationSidebar.vue
│       │   │   │
│       │   │   ├── party/
│       │   │   │   ├── PartyList.vue
│       │   │   │   ├── PartyMember.vue
│       │   │   │   └── AddMemberModal.vue
│       │   │   │
│       │   │   ├── encounter/
│       │   │   │   ├── EncounterList.vue
│       │   │   │   ├── EnemyCard.vue
│       │   │   │   └── CreateEncounterModal.vue
│       │   │   │
│       │   │   ├── initiative/
│       │   │   │   ├── InitiativeTracker.vue
│       │   │   │   ├── CombatantRow.vue
│       │   │   │   └── TurnIndicator.vue
│       │   │   │
│       │   │   ├── battlemap/
│       │   │   │   ├── BattlemapEditor.vue
│       │   │   │   ├── BattlemapGrid.vue
│       │   │   │   ├── BattlemapToken.vue
│       │   │   │   ├── BattlemapControls.vue
│       │   │   │   └── MovementRadius.vue
│       │   │   │
│       │   │   └── display/
│       │   │       ├── PortraitLayer.vue
│       │   │       ├── BackgroundLayer.vue
│       │   │       ├── EventLayer.vue
│       │   │       └── BattlemapDisplay.vue
│       │   │
│       │   ├── composables/      # Vue Composables
│       │   │   ├── useElectronAPI.ts
│       │   │   ├── useMediaBrowser.ts
│       │   │   ├── useParty.ts
│       │   │   ├── useEncounter.ts
│       │   │   ├── useInitiative.ts
│       │   │   ├── useBattlemap.ts
│       │   │   ├── useDisplayState.ts
│       │   │   └── useKeyboardShortcuts.ts
│       │   │
│       │   ├── stores/            # Pinia Stores
│       │   │   ├── directory.ts
│       │   │   ├── media.ts
│       │   │   ├── party.ts
│       │   │   ├── encounter.ts
│       │   │   ├── initiative.ts
│       │   │   ├── battlemap.ts
│       │   │   └── display.ts
│       │   │
│       │   ├── types/             # TypeScript Types
│       │   │   ├── electron.ts
│       │   │   ├── media.ts
│       │   │   ├── party.ts
│       │   │   ├── encounter.ts
│       │   │   ├── initiative.ts
│       │   │   ├── battlemap.ts
│       │   │   └── display.ts
│       │   │
│       │   ├── utils/             # Utilities
│       │   │   ├── fileUtils.ts
│       │   │   ├── validation.ts
│       │   │   └── formatting.ts
│       │   │
│       │   └── assets/            # Static Assets
│       │       ├── styles/
│       │       │   └── main.css
│       │       └── images/
│       │
│       └── index.html             # HTML template
│
├── tests/
│   ├── unit/                      # Vitest Unit Tests
│   │   ├── components/
│   │   ├── composables/
│   │   └── stores/
│   ├── integration/               # Integration Tests
│   │   └── ipc/
│   └── e2e/                       # E2E Tests (keep Jest)
│
├── electron.vite.config.ts        # electron-vite config
├── tailwind.config.js             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
├── vitest.config.ts               # Vitest config
└── package.json
```

---

## 📝 Migration Phases

### Phase 1: Project Setup (Day 1)
**Goal:** Get the new Vue 3 + electron-vite project scaffolded

#### Tasks:
1. **Create new electron-vite project**
   ```bash
   npm create @quick-start/electron dd-helper-vue
   # Select: Vue + TypeScript
   ```

2. **Install dependencies**
   ```bash
   npm install pinia vue-router
   npm install -D tailwindcss postcss autoprefixer
   npm install -D @vue/test-utils vitest jsdom
   npx tailwindcss init -p
   ```

3. **Configure Tailwind CSS**
   - Set up tailwind.config.js
   - Add Tailwind directives to main.css

4. **Set up project structure**
   - Create folder structure as outlined above
   - Set up path aliases in tsconfig.json

5. **Copy existing files**
   - Copy main.js → src/main/index.ts (will refactor)
   - Copy preload.js → src/preload/index.ts (will refactor)
   - Keep for reference: HTML files

**Deliverable:** Clean Vue 3 + electron-vite project that compiles

---

### Phase 2: Type Definitions (Day 1-2)
**Goal:** Define all TypeScript interfaces

#### Tasks:
1. **Create type definitions from existing code**
   ```typescript
   // types/media.ts
   export interface MediaFile {
     name: string
     path: string
     type: 'file' | 'folder'
     mediaType: 'image' | 'video' | 'audio' | 'other'
     mediaSubtype: 'portrait' | 'background' | 'event' | 'loop' | 'music' | 'sound' | 'default'
     displayName: string
     children?: MediaFile[]
   }

   // types/party.ts
   export interface PartyMember {
     name: string
     class: string
     level: number
     maxHp: number
     currentHp: number
     ac: number
     portraitPath?: string
   }

   // types/encounter.ts
   export interface Enemy {
     name: string
     hp: number
     maxHp: number
     ac: number
     initiative?: number
     portraitPath?: string
   }

   export interface Encounter {
     name: string
     enemies: Enemy[]
   }

   // types/battlemap.ts
   export interface BattlemapToken {
     name: string
     x: number
     y: number
     portrait?: string
     hidden?: boolean
   }

   export interface Battlemap {
     gridWidth: number
     gridHeight: number
     backgroundImage: string
     tokens: Record<string, BattlemapToken>
     zoom?: {
       scale: number
       centerX: number
       centerY: number
       lastMovedToken?: { x: number; y: number }
     }
     movementRadius?: {
       active: boolean
       centerX: number
       centerY: number
       radius: number
     }
   }

   // types/display.ts
   export interface DisplayState {
     portraits: MediaItem[]
     background: MediaItem | null
     event: MediaItem | null
     backgroundSounds: MediaItem[]
     backgroundMusic: MediaItem | null
     soundEffects: MediaItem[]
   }
   ```

2. **Define ElectronAPI types**
   ```typescript
   // types/electron.ts
   export interface ElectronAPI {
     // Directory
     selectDirectory: () => Promise<string | null>
     getCachedDirectory: () => Promise<string | null>
     scanDirectory: (path: string) => Promise<MediaFile>

     // Windows
     openDisplayWindow: () => Promise<boolean>
     loadDashboard: () => Promise<boolean>

     // Display
     displayMedia: (path: string, type: string, subtype: string, name: string) => Promise<boolean>
     clearDisplayElement: (type: string, path?: string) => Promise<boolean>
     getDisplayState: () => Promise<DisplayState>

     // Party
     savePartyData: (path: string, data: any) => Promise<boolean>
     loadPartyData: (path: string) => Promise<any>

     // Encounters
     saveEncounterData: (path: string, data: Encounter) => Promise<boolean>
     loadEncounterData: (path: string) => Promise<Encounter>
     selectEncounterFile: (dir: string) => Promise<string | null>
     getEncounterFiles: (dir: string) => Promise<any[]>

     // Initiative
     saveInitiativeData: (dir: string, data: any) => Promise<{ success: boolean }>
     loadInitiativeData: (dir: string) => Promise<any>

     // Battlemap
     saveBattlemapData: (dir: string, data: Battlemap, filename?: string) => Promise<{ success: boolean }>
     loadBattlemapData: (path: string) => Promise<Battlemap>
     getBattlemapFiles: (dir: string) => Promise<any[]>
     displayBattlemap: (data: Battlemap) => Promise<{ success: boolean }>
     hideBattlemap: () => Promise<{ success: boolean }>

     // Event listeners
     onUpdateDisplay: (callback: (event: any, state: DisplayState) => void) => void
     onDisplayStateUpdated: (callback: (event: any, state: DisplayState) => void) => void
     onDisplayBattlemap: (callback: (event: any, data: Battlemap) => void) => void
     onHideBattlemap: (callback: (event: any) => void) => void
     removeDisplayListeners: () => void
   }

   declare global {
     interface Window {
       electronAPI: ElectronAPI
     }
   }
   ```

**Deliverable:** Complete TypeScript type definitions

---

### Phase 3: Main Process Migration (Day 2-3)
**Goal:** Refactor main process to TypeScript

#### Tasks:
1. **Convert main.js to TypeScript**
   - src/main/index.ts
   - Keep all existing functionality
   - Add types

2. **Split into modules**
   - src/main/windows/MainWindow.ts
   - src/main/windows/DisplayWindow.ts
   - src/main/ipc/handlers.ts (register all handlers)
   - src/main/ipc/directory.ts
   - src/main/ipc/media.ts
   - src/main/ipc/party.ts
   - src/main/ipc/encounter.ts
   - src/main/ipc/initiative.ts
   - src/main/ipc/battlemap.ts

3. **Create service layer**
   - DirectoryService (caching, validation)
   - MediaScanner (file scanning, categorization)
   - FileStorage (read/write JSON files)

4. **Update preload.ts**
   - Add proper types
   - Keep context bridge implementation

**Deliverable:** Fully typed main process that compiles

---

### Phase 4: Pinia Stores (Day 3-4)
**Goal:** Create reactive state management

#### Tasks:
1. **Directory Store**
   ```typescript
   // stores/directory.ts
   export const useDirectoryStore = defineStore('directory', () => {
     const currentDirectory = ref<string | null>(null)
     const mediaTree = ref<MediaFile | null>(null)
     const isScanning = ref(false)

     async function selectDirectory() {
       const path = await window.electronAPI.selectDirectory()
       if (path) {
         currentDirectory.value = path
         await scanDirectory(path)
       }
       return path
     }

     async function loadCachedDirectory() {
       const cached = await window.electronAPI.getCachedDirectory()
       if (cached) {
         currentDirectory.value = cached
         await scanDirectory(cached)
       }
     }

     async function scanDirectory(path: string) {
       isScanning.value = true
       try {
         mediaTree.value = await window.electronAPI.scanDirectory(path)
       } finally {
         isScanning.value = false
       }
     }

     return { currentDirectory, mediaTree, isScanning, selectDirectory, loadCachedDirectory, scanDirectory }
   })
   ```

2. **Display Store** (for live display panel)
3. **Party Store**
4. **Encounter Store**
5. **Initiative Store**
6. **Battlemap Store**

**Deliverable:** All Pinia stores with full functionality

---

### Phase 5: Starting Screen (Day 4)
**Goal:** Build first window to validate setup

#### Tasks:
1. **Create StartingScreen.vue**
   ```vue
   <template>
     <div class="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
       <div class="bg-white/10 backdrop-blur-lg p-10 rounded-2xl max-w-md w-full">
         <h1 class="text-4xl font-bold text-white mb-8">🎲 D&D Helper</h1>

         <div class="space-y-6">
           <div>
             <p class="text-white mb-4">Select the directory where your media files are stored:</p>
             <button @click="handleSelectDirectory" class="btn-primary w-full">
               📁 Select Media Directory
             </button>

             <div v-if="directory.currentDirectory" class="mt-4 p-4 rounded-lg"
                  :class="isCached ? 'bg-green-500/20' : 'bg-blue-500/20'">
               <p class="text-white font-mono text-sm break-all">
                 {{ directory.currentDirectory }}
               </p>
               <p class="text-white/70 text-xs mt-2">
                 {{ isCached ? '✓ Using cached directory' : '✓ New directory selected' }}
               </p>
             </div>
           </div>

           <button
             @click="startSession"
             :disabled="!directory.currentDirectory"
             class="btn-gradient w-full"
           >
             🚀 Start Session
           </button>
         </div>
       </div>
     </div>
   </template>

   <script setup lang="ts">
   import { onMounted, ref } from 'vue'
   import { useDirectoryStore } from '@/stores/directory'

   const directory = useDirectoryStore()
   const isCached = ref(false)

   onMounted(async () => {
     await directory.loadCachedDirectory()
     isCached.value = !!directory.currentDirectory
   })

   async function handleSelectDirectory() {
     await directory.selectDirectory()
     isCached.value = false
   }

   async function startSession() {
     await window.electronAPI.openDisplayWindow()
     await window.electronAPI.loadDashboard()
   }
   </script>
   ```

2. **Create basic Button component**
3. **Add Tailwind utilities**

**Deliverable:** Working starting screen

---

### Phase 6: Display Window (Day 5-6)
**Goal:** Build the display window

#### Tasks:
1. **Create DisplayWindow.vue**
   - Use Composition API
   - Layer-based rendering

2. **Create display components**
   - PortraitLayer.vue
   - BackgroundLayer.vue
   - EventLayer.vue
   - BattlemapDisplay.vue

3. **Implement keyboard shortcuts composable**
   ```typescript
   // composables/useKeyboardShortcuts.ts
   export function useKeyboardShortcuts(handlers: {
     escape?: () => void
     space?: () => void
   }) {
     onMounted(() => {
       function handleKeydown(e: KeyboardEvent) {
         if (e.key === 'Escape' && handlers.escape) {
           handlers.escape()
         } else if (e.key === ' ' && handlers.space) {
           e.preventDefault()
           handlers.space()
         }
       }
       window.addEventListener('keydown', handleKeydown)
       onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
     })
   }
   ```

4. **Implement display state listener**
   ```typescript
   // composables/useDisplayState.ts
   import { ref, onMounted, onUnmounted } from 'vue'
   import type { DisplayState } from '@/types/display'

   export function useDisplayState() {
     const displayState = ref<DisplayState>({
       portraits: [],
       background: null,
       event: null,
       backgroundSounds: [],
       backgroundMusic: null,
       soundEffects: []
     })

     onMounted(() => {
       window.electronAPI.onUpdateDisplay((_, state) => {
         displayState.value = state
       })
     })

     onUnmounted(() => {
       window.electronAPI.removeDisplayListeners()
     })

     return { displayState }
   }
   ```

**Deliverable:** Fully functional display window

---

### Phase 7: Dashboard - Part 1 (Day 7-9)
**Goal:** Build core dashboard layout

#### Tasks:
1. **Create Dashboard.vue** (main layout)
   ```vue
   <template>
     <div class="dashboard-grid">
       <NavigationSidebar v-model:collapsed="navCollapsed" />
       <main class="main-content">
         <component :is="currentView" />
       </main>
       <LiveDisplayPanel v-model:collapsed="displayCollapsed" />
     </div>
   </template>
   ```

2. **Create NavigationSidebar.vue**
   - Collapsible sidebar
   - Navigation items
   - Active state

3. **Create LiveDisplayPanel.vue**
   - Portraits section
   - Background section
   - Event section
   - Audio sections

4. **Create MediaBrowser.vue**
   - Tree view
   - File icons
   - Click handlers

**Deliverable:** Dashboard shell with navigation

---

### Phase 8: Dashboard - Part 2 (Day 10-12)
**Goal:** Build party and encounter features

#### Tasks:
1. **Party Management**
   - PartyList.vue
   - PartyMember.vue
   - AddMemberModal.vue
   - Edit/delete functionality

2. **Encounter Management**
   - EncounterList.vue
   - EnemyCard.vue
   - CreateEncounterModal.vue
   - Save/load functionality

3. **Initiative Tracker**
   - InitiativeTracker.vue
   - CombatantRow.vue
   - TurnIndicator.vue
   - HP tracking
   - Turn management

**Deliverable:** Party, encounter, and initiative features

---

### Phase 9: Dashboard - Part 3 (Day 13-15)
**Goal:** Build battlemap feature

#### Tasks:
1. **Battlemap Components**
   - BattlemapEditor.vue (main container)
   - BattlemapGrid.vue (grid rendering)
   - BattlemapToken.vue (token component)
   - BattlemapControls.vue (toolbar)
   - MovementRadius.vue (radius overlay)

2. **Battlemap Composable**
   ```typescript
   // composables/useBattlemap.ts
   export function useBattlemap() {
     const store = useBattlemapStore()

     const createBattlemap = (width: number, height: number, bgImage: string) => {
       // ...
     }

     const addToken = (x: number, y: number, token: BattlemapToken) => {
       // ...
     }

     const moveToken = (fromX: number, fromY: number, toX: number, toY: number) => {
       // ...
     }

     const showMovementRadius = (x: number, y: number, radius: number) => {
       // ...
     }

     const setZoom = (scale: number, centerX: number, centerY: number) => {
       // ...
     }

     return { createBattlemap, addToken, moveToken, showMovementRadius, setZoom }
   }
   ```

3. **Implement zoom/pan**
4. **Implement token drag-and-drop**
5. **Implement movement radius**

**Deliverable:** Fully functional battlemap editor

---

### Phase 10: Testing Migration (Day 16-17)
**Goal:** Migrate and update tests

#### Tasks:
1. **Set up Vitest**
   ```typescript
   // vitest.config.ts
   import { defineConfig } from 'vitest/config'
   import vue from '@vitejs/plugin-vue'
   import { fileURLToPath } from 'node:url'

   export default defineConfig({
     plugins: [vue()],
     test: {
       environment: 'jsdom',
       globals: true,
     },
     resolve: {
       alias: {
         '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url))
       }
     }
   })
   ```

2. **Create component tests**
   ```typescript
   // tests/unit/components/StartingScreen.spec.ts
   import { mount } from '@vue/test-utils'
   import { createPinia } from 'pinia'
   import StartingScreen from '@/windows/StartingScreen.vue'

   describe('StartingScreen', () => {
     it('renders correctly', () => {
       const wrapper = mount(StartingScreen, {
         global: {
           plugins: [createPinia()]
         }
       })
       expect(wrapper.text()).toContain('D&D Helper')
     })
   })
   ```

3. **Create composable tests**
4. **Create store tests**
5. **Keep E2E tests** (update paths only)

**Deliverable:** Full test coverage with Vitest

---

### Phase 11: Polish & Optimization (Day 18-19)
**Goal:** Final touches

#### Tasks:
1. **Styling polish**
   - Ensure all Tailwind classes are used
   - Remove old CSS
   - Responsive design
   - Dark mode (if desired)

2. **Performance optimization**
   - Lazy load heavy components
   - Virtual scrolling for large lists
   - Image optimization
   - Bundle analysis

3. **Error handling**
   - Global error handler
   - User-friendly error messages
   - Loading states

4. **Accessibility**
   - Keyboard navigation
   - ARIA labels
   - Focus management

**Deliverable:** Production-ready app

---

### Phase 12: Documentation & Deployment (Day 20)
**Goal:** Document and prepare for release

#### Tasks:
1. **Update README**
   - New setup instructions
   - Development guide
   - Architecture overview

2. **Create CHANGELOG**
3. **Update build config**
4. **Test builds**
   - macOS build
   - Windows build (if applicable)
   - Linux build (if applicable)

5. **Migration guide** (for future reference)

**Deliverable:** Complete documentation and builds

---

## 🔄 Migration Strategy

### Approach: **Parallel Development**

1. **Keep old code running** - Don't delete original HTML files until migration is complete
2. **Build feature by feature** - Migrate one complete feature at a time
3. **Test continuously** - Ensure each feature works before moving to next
4. **Use feature flags** - Can toggle between old/new implementation if needed

### Risk Mitigation

- ✅ Keep original code in `src-legacy/` folder
- ✅ Git branch for migration: `feat/vue-migration`
- ✅ Commit after each phase
- ✅ Test thoroughly after each phase
- ✅ Can rollback at any point

---

## 📦 Dependencies to Install

```bash
# Core
npm install vue@^3 pinia vue-router

# Build tools
npm install -D electron-vite vite @vitejs/plugin-vue

# TypeScript
npm install -D typescript @types/node

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Testing
npm install -D vitest @vue/test-utils jsdom @vitest/ui

# Utilities
npm install lodash-es
npm install -D @types/lodash-es
```

---

## ⏱️ Timeline

**Total Estimated Time: 20 days (4 weeks)**

| Phase | Days | Status |
|-------|------|--------|
| 1. Project Setup | 1 | ⏳ |
| 2. Type Definitions | 1 | ⏳ |
| 3. Main Process | 2 | ⏳ |
| 4. Pinia Stores | 1 | ⏳ |
| 5. Starting Screen | 1 | ⏳ |
| 6. Display Window | 2 | ⏳ |
| 7. Dashboard Part 1 | 3 | ⏳ |
| 8. Dashboard Part 2 | 3 | ⏳ |
| 9. Dashboard Part 3 | 3 | ⏳ |
| 10. Testing | 2 | ⏳ |
| 11. Polish | 2 | ⏳ |
| 12. Documentation | 1 | ⏳ |

---

## ✅ Success Criteria

- [ ] All 123 tests passing
- [ ] All features from original app working
- [ ] No performance regression
- [ ] TypeScript errors: 0
- [ ] Build size <= original
- [ ] Hot reload working in development
- [ ] Production builds successful
- [ ] Documentation complete

---

## 📚 Resources

- [electron-vite Documentation](https://electron-vite.org/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vitest Documentation](https://vitest.dev/)

---

## 🎓 Learning Curve Considerations

**If you're new to Vue 3:**
- Start with Vue 3 tutorial first
- Focus on Composition API (not Options API)
- Learn about reactivity (`ref`, `reactive`, `computed`)
- Understand lifecycle hooks (`onMounted`, `onUnmounted`)

**If you're new to TypeScript:**
- Start with basic types
- Use type inference where possible
- Add types incrementally
- Use `any` temporarily if stuck (mark with `// TODO: type this`)

**Recommended learning order:**
1. Vue 3 Composition API basics (2-3 hours)
2. Pinia basics (1 hour)
3. TypeScript basics (2-3 hours)
4. Start Phase 1

---

## 🤝 Next Steps

Ready to start? I can help with:

1. **Set up the new project** (Phase 1)
2. **Create type definitions** (Phase 2)
3. **Build a specific component** (any phase)
4. **Answer questions** about the plan

Just let me know which phase you'd like to start with!
