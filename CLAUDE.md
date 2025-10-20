# D&D Helper - Codebase Documentation

*Generated: 2025-10-20*

## Project Overview

Desktop application for managing and displaying media during D&D sessions, built with Electron and Vue 3.

### Tech Stack
- **Framework**: Electron 27 with electron-vite build system
- **Frontend**: Vue 3.5 (Composition API) with TypeScript 5.9
- **State Management**: Pinia 3.0
- **Routing**: Vue Router 4.6
- **Styling**: Tailwind CSS 4.1
- **Testing**:
  - Vitest 3.2 (Vue components)
  - Jest 30.2 with ts-jest (main process)
- **Build Tool**: Vite via electron-vite

### Migration Status

**Current Phase**: Mid-migration from vanilla HTML/JS to Vue 3 + TypeScript (~60% complete)

- ✅ Phase 1-2: Project setup and type definitions
- ✅ Phase 3-4: Main process refactored, Pinia stores created
- ✅ Phase 5: Starting screen implemented
- ✅ Phase 6: Display window fully functional
- ⏳ Phase 7-9: Dashboard partially implemented
  - ✅ Images/Audio dashboards complete
  - ⏳ Party/Encounters/Initiative/Battlemap are placeholders

---

## Project Structure

```
dd-helper-electron/
├── src/                           # NEW Vue 3 Implementation
│   ├── main/                      # Electron Main Process (TypeScript)
│   │   ├── index.ts              # Entry point, app initialization
│   │   ├── windows.ts            # Window management (main + display)
│   │   ├── fileOperations.ts    # File I/O, scanning, data persistence
│   │   ├── ipcHandlers.ts       # IPC communication handlers (25+ handlers)
│   │   └── protocol.ts          # Custom media:// protocol
│   │
│   ├── preload/                   # Preload Scripts
│   │   └── index.ts              # Context bridge for secure IPC
│   │
│   └── renderer/                  # Vue 3 Renderer Process
│       ├── index.html
│       └── src/
│           ├── main.ts           # Vue app entry
│           ├── App.vue           # Root component
│           ├── router/           # Vue Router configuration
│           ├── views/            # Page-level components (8 views)
│           │   ├── DirectorySelection.vue      ✅ COMPLETE
│           │   ├── DisplayWindow.vue           ✅ COMPLETE
│           │   ├── ImagesDashboard.vue         ✅ COMPLETE
│           │   ├── AudioDashboard.vue          ✅ COMPLETE
│           │   ├── PartyManagement.vue         ⏳ PLACEHOLDER
│           │   ├── EncounterManagement.vue     ⏳ PLACEHOLDER
│           │   ├── InitiativeTracker.vue       ⏳ PLACEHOLDER
│           │   └── BattlemapEditor.vue         ⏳ PLACEHOLDER
│           ├── components/       # Shared Vue components
│           │   ├── AppLayout.vue              ✅ Navigation layout
│           │   ├── DisplayStatusBar.vue       ✅ Global display status
│           │   └── MediaTreeNode.vue          ✅ Tree view component
│           ├── stores/           # Pinia State Management (7 stores)
│           │   ├── directory.ts              ✅ COMPLETE
│           │   ├── display.ts                ✅ COMPLETE
│           │   ├── party.ts                  ✅ COMPLETE (backend only)
│           │   ├── encounter.ts              ✅ COMPLETE (backend only)
│           │   ├── initiative.ts             ✅ COMPLETE (backend only)
│           │   ├── battlemap.ts              ✅ COMPLETE (backend only)
│           │   └── index.ts
│           ├── types/            # TypeScript Definitions
│           │   ├── media.ts
│           │   ├── party.ts
│           │   ├── encounter.ts
│           │   ├── initiative.ts
│           │   ├── battlemap.ts
│           │   ├── display.ts
│           │   ├── electron.ts   # ElectronAPI interface
│           │   └── index.ts
│           ├── utils/
│           │   ├── mediaFilters.ts    # Filter/flatten media trees
│           │   └── displayNames.ts    # Format display names
│           └── assets/
│               └── styles/
│                   └── main.css       # Tailwind imports
│
├── src-legacy/                    # Original Vanilla Code (PRESERVED)
│   ├── main.js                   # 20,874 lines - monolithic
│   ├── preload.js
│   └── renderer/
│       ├── starting-screen.html
│       ├── dashboard.html        # 7,637 lines
│       └── display-window.html
│
├── tests-new/                     # New TypeScript Tests
│   ├── unit/
│   │   ├── fileOperations.test.ts      ✅ 13 tests
│   │   ├── protocol.test.ts
│   │   ├── mediaFiltering.test.ts
│   │   └── folderNavigation.test.ts
│   ├── integration/
│   │   └── starting-screen.test.ts
│   └── __mocks__/
│
└── tests-legacy/                  # Original Jest Tests (123 tests)
```

---

## Implemented Features

### ✅ Fully Functional (Vue 3)

#### Directory Management
- Select media directory via dialog
- Automatic caching of last used directory
- Recursive directory scanning with media categorization
- Hide files starting with underscore

#### Display Window System
- Separate display window (for second monitor)
- Multi-layer rendering:
  - Background layer (images/videos)
  - Portrait layer (character portraits with focus system)
  - Event layer (full-screen videos with auto-hide)
  - Audio layers (background music, loops, sound effects)
- Smooth transitions between content
- Focused portrait system (large center + small row at bottom)
- Auto-cleanup of ended videos/sounds

#### Images & Videos Dashboard
- Grid view with thumbnails
- Folder navigation (breadcrumb-style path)
- Search functionality across all files/folders
- Media categorization badges (portrait, background, event)
- Click to display on display window
- Supported formats: JPG, PNG, GIF, MP4, WEBM

#### Audio Dashboard
- Audio file browsing
- Folder navigation
- Play/pause controls
- Supported formats: MP3, WAV, OGG
- Categorization: sound effects, loops, music

#### Global Display Status Bar
- Shows all active display content at bottom of screen
- Thumbnail previews of backgrounds and portraits
- Quick clear buttons for individual items
- Portrait focus toggle
- "Clear All" button
- Slides up when content is active

#### Navigation & Layout
- AppLayout with sidebar navigation
- Active route highlighting
- Display window launcher button
- Responsive design with Tailwind

#### Media Categorization System
Media files are automatically categorized by filename patterns:
- **Portraits**: Default for images in character/portrait folders
- **Backgrounds**: Files ending with `_location`
- **Events**: Video files
- **Loops**: Audio ending with `_loop`
- **Music**: Audio ending with `_music`
- **Sounds**: Other audio files

### ⏳ Backend Ready, Frontend Placeholder

These features have full IPC handlers, stores, and types but need UI implementation:

#### Party Management
- Store: Complete with CRUD operations
- IPC: Save/load party data to JSON
- Types: PartyMember with full stats (HP, AC, level, class)
- UI: Placeholder "coming soon" page

#### Encounter Management
- Store: Complete with encounter creation/loading
- IPC: Save/load encounters, list encounter files
- Types: Encounter with enemies array
- UI: Placeholder "coming soon" page

#### Initiative Tracker
- Store: Complete with turn tracking, HP management
- IPC: Save/load initiative state
- Types: Combatant (player/enemy), turn order
- UI: Placeholder "coming soon" page

#### Battlemap Editor
- Store: Complete with grid, tokens, zoom, movement radius
- IPC: Display/hide battlemap, save/load to JSON
- Types: Full battlemap with tokens, grid dimensions, background
- UI: Placeholder "coming soon" page

---

## IPC Communication

### Directory Operations
- `select-directory` - Native OS directory picker
- `get-cached-directory` - Load last used directory
- `scan-directory` - Recursive scan with media categorization

### Window Management
- `open-display-window` - Launch second window
- `load-dashboard` - Navigate to dashboard

### Display Control
- `display-media` - Show media on display window
- `clear-display-element` - Remove specific element
- `get-display-state` - Get current display state
- `set-focused-portrait` - Change portrait focus

### Data Persistence
- `save-party-data` / `load-party-data`
- `save-encounter-data` / `load-encounter-data`
- `save-initiative-data` / `load-initiative-data`
- `save-battlemap-data` / `load-battlemap-data`
- `get-encounter-files` / `get-battlemap-files`

### Battlemap Specific
- `display-battlemap` - Send battlemap to display
- `hide-battlemap` - Hide battlemap from display

### Event Listeners
- `update-display` - Display window receives state updates
- `display-state-updated` - Dashboard receives state updates
- `display-battlemap` / `hide-battlemap` - Battlemap events

---

## Custom Protocol: `media://`

A custom protocol handler serves media files securely:
```
media://<absolute-file-path>
```
This allows Vue components to reference local files safely without CORS issues.

---

## Data Models

### MediaFile
```typescript
interface MediaFile {
  name: string
  path: string
  type: 'file' | 'folder'
  mediaType: 'image' | 'video' | 'audio' | 'other'
  mediaSubtype: 'portrait' | 'background' | 'event' | 'loop' | 'music' | 'sound' | 'default'
  displayName: string
  children?: MediaFile[]  // For folders
}
```

### DisplayState
```typescript
interface DisplayState {
  portraits: MediaItem[]
  focusedPortraitPath: string | null
  background: MediaItem | null
  event: MediaItem | null
  backgroundSounds: MediaItem[]
  backgroundMusic: MediaItem | null
  soundEffects: MediaItem[]
}
```

### PartyMember
```typescript
interface PartyMember {
  id: string
  name: string
  class: string
  level: number
  maxHp: number
  currentHp: number
  ac: number
  portraitPath?: string
  notes?: string
}
```

### Battlemap
```typescript
interface Battlemap {
  gridWidth: number
  gridHeight: number
  backgroundImage: string
  tokens: Record<string, BattlemapToken>  // Key: "x-y"
  zoom?: BattlemapZoom
  movementRadius?: MovementRadius
  name?: string
}
```

---

## Testing Status

### New TypeScript Tests (Jest + ts-jest)
**Location**: `/tests-new/`
**Status**: ✅ 13/13 passing

**Unit Tests**:
- `fileOperations.test.ts` - 13 tests covering:
  - Directory existence checks
  - Directory scanning and media categorization
  - Party data save/load
  - Battlemap data save/load
  - File hiding logic (underscore prefix)

**Coverage**:
- ✅ Core file operations
- ✅ Data persistence
- ✅ Media categorization
- ⏳ IPC handlers (not yet tested)
- ⏳ Window management (not yet tested)
- ⏳ Vue components (not yet tested)

### Test Commands
```bash
# New TypeScript tests
npm run test:main          # Run once
npm run test:main:watch    # Watch mode
npm run test:main:coverage # Coverage report

# Vue component tests (Vitest)
npm test                   # Vitest
npm run test:ui           # Vitest UI

# Legacy tests
npm run legacy:test
```

---

## Code Quality

### Strengths
- ✅ Excellent separation of concerns (main/renderer/preload)
- ✅ Type-safe throughout with comprehensive interfaces
- ✅ Clean Vue 3 Composition API usage
- ✅ Proper state management with Pinia
- ✅ Security-conscious (context isolation, custom protocol)
- ✅ Good modularity in main process
- ✅ Consistent naming conventions
- ✅ Responsive Tailwind styling

### Areas for Improvement
- ⚠️ Need more comprehensive tests (only 13 new tests vs 123 legacy)
- ⚠️ Some placeholder components need implementation
- ⚠️ No error boundaries in Vue components
- ⚠️ Limited loading/error states in UI
- ⚠️ Could benefit from more composables (reusable logic)

### Technical Debt
- Legacy code still exists (20K+ lines in src-legacy/)
- Migration not complete (4 major features as placeholders)
- Test migration incomplete

---

## Recommended Next Steps

### For Writing Tests
1. Focus on `ipcHandlers.test.ts` - Test all 25+ IPC handlers
2. Add `windows.test.ts` - Test window creation/management
3. Create component tests for:
   - `ImagesDashboard.vue`
   - `DisplayWindow.vue`
   - `DisplayStatusBar.vue`
   - `AppLayout.vue`
4. Store tests for all 7 Pinia stores

### For Bug Fixes
1. Test display state synchronization between windows
2. Verify media protocol works with all file types
3. Check edge cases in media scanning (empty dirs, permissions)
4. Test portrait focus switching
5. Verify audio cleanup on component unmount

### For New Features
1. Start with **Party Management** (most foundational)
2. Then **Encounter Management** (builds on party)
3. Then **Initiative Tracker** (uses both)
4. Finally **Battlemap Editor** (most complex)

---

## Key File Paths

### Core Main Process
- `src/main/ipcHandlers.ts` - All IPC logic
- `src/main/fileOperations.ts` - File I/O operations
- `src/main/windows.ts` - Window management
- `src/main/protocol.ts` - Custom media protocol

### State Management
- `src/renderer/src/stores/` - All Pinia stores

### Key Views
- `src/renderer/src/views/ImagesDashboard.vue` - Complex grid view
- `src/renderer/src/views/DisplayWindow.vue` - Multi-layer rendering
- `src/renderer/src/components/DisplayStatusBar.vue` - Global state display

### Tests
- `tests-new/unit/` - New TypeScript unit tests
- `tests-new/integration/` - Integration tests
- `tests-legacy/` - Original test suite (123 tests)

---

## Development Workflow

### Running the App
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test:main           # Run main process tests
npm run test:main:watch     # Watch mode
npm run test:main:coverage  # Coverage report
npm test                    # Run Vitest
npm run test:ui            # Vitest UI
```

### Code Quality
```bash
npm run typecheck   # TypeScript type checking
npm run lint        # Lint code
```

---

*This document serves as a comprehensive reference for understanding the D&D Helper codebase structure, features, and development status.*
