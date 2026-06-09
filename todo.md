# D&D Helper - Legacy Feature Migration TODO

Features from the legacy app (`src-legacy/`) that still need to be ported to the new Vue 3 + Electron app.

---

## 1. ~~Encounter Management~~ DONE

- [x] Encounter list view — browse/create/delete encounters
- [x] Encounter editor — name field, difficulty selector, enemy list management
- [x] Add/edit enemy modal — name, AC, max HP, initiative, notes, portrait selection
- [x] Remove enemy from encounter
- [x] Load encounter file picker — list saved files with metadata (name, enemy count, last modified)
- [x] Save encounter to file
- [x] "Add encounter to initiative" — push all enemies into initiative tracker
- [x] New encounter modal with name prompt
- [x] Browse files fallback for loading

---

## 2. Battlemap Editor (No UI - Placeholder Only)

Backend (store, IPC, types) is complete. Needs full UI implementation.

### Grid & Background
- [ ] Grid setup controls — width (5-999), height auto-calculated from background aspect ratio
- [ ] Background image selection modal — browse media library, preview, select
- [ ] Aspect ratio lock — grid height adjusts to maintain background image ratio
- [ ] Map name field

### Token Management
- [ ] Token placement — click/right-click grid cells to place characters
- [ ] Token selection modal — choose from party members + encounter enemies
- [ ] Token display — portrait thumbnail or initials on grid cells
- [ ] Token properties — name, portrait, position (x,y), type (player/enemy), visibility toggle
- [ ] Remove token from grid

### Token Movement
- [ ] Movement mode — enter/exit movement mode for a token
- [ ] Movement radius visualization — highlight reachable cells in blue (Manhattan distance)
- [ ] Movement speed — based on character speed from party data
- [ ] Drag-to-move tokens
- [ ] Last-moved-token pulse animation

### Zoom & Pan
- [ ] Zoom in/out controls (0.5x to 3x scale)
- [ ] Reset zoom button
- [ ] Pan to center
- [ ] Smooth zoom transitions (CSS)
- [ ] Keyboard shortcuts: +/- zoom, 0 reset, C center

### Character Focus
- [ ] Focus modal — select character from tokens on map to focus display window view
- [ ] Auto-zoom to selected character

### Toolbar & Controls
- [ ] Floating minimizable toolbar (zoom, focus, center, background, display toggle)
- [ ] Right-click context menu on tokens (remove, show radius, focus)

### Display Window Integration
- [ ] Render battlemap on display window with grid + tokens
- [ ] Manage zoom and focus based on user input for character focus and zoom.
- [ ] Smooth animated panning zoom for display window.
- [ ] Show movement radius on display
- [ ] Toggle battlemap display on/off

### Persistence
- [ ] Save battlemap to `*_battlemap.json`
- [ ] Load battlemap file picker with metadata (grid size, background, token count, last modified)
- [ ] Clear battlemap (reset tokens, keep grid/background)

---

## 3. ~~Initiative Tracker Gaps~~ DONE

- [x] HP display on combatant rows with color-coded bars (green/yellow/red)
- [x] HP management modal — click HP to damage (Enter) or heal (Shift+Enter)
- [x] "Add Encounter" button — modal to select saved encounter, add all enemies to initiative
- [x] Add Note to initiative — special note type with yellow styling and initiative ordering
- [x] Enemy info modal — view portrait, HP bar, AC, initiative, notes
- [x] Add Combatant form now includes HP/Max HP fields
- [x] CombatantType extended with 'note' type

---

## 4. Keyboard Shortcuts

Legacy had extensive keyboard shortcuts. Most are missing from the new app.

### Dashboard Navigation
- [ ] Alt+S — toggle sidebar expand/collapse
- [ ] Alt+L — toggle live panel / display status bar

### Battlemap Controls
- [ ] Ctrl+S — save battlemap
- [ ] Ctrl+O — load battlemap
- [ ] F — open character focus modal
- [ ] C — center battlemap
- [ ] D — toggle battlemap display
- [ ] +/= — zoom in
- [ ] - — zoom out
- [ ] 0 — reset zoom

### Display Window
- [ ] Escape — clear event or entire display
- [ ] Space — play/pause video

### Modal Controls
- [ ] Escape — close active modal
- [ ] Enter — confirm/apply
- [ ] Shift+Enter — alternate action (e.g., heal instead of damage)
- [ ] / — open search in portrait/file picker modals

---

## 5. Live Display Panel (Right Sidebar)

Legacy had a dedicated toggleable right sidebar for live display control. New app has a compact bottom status bar but lacks the full panel experience.

- [ ] Toggleable right sidebar panel (320px, slide in/out)
- [ ] Floating toggle button when panel is collapsed
- [ ] Expandable/collapsible sections for each display element type
- [ ] Portraits section — thumbnails + names, individual clear buttons, "Clear All Portraits"
- [ ] Background section — thumbnail, clear button
- [ ] Event section — file name, clear button
- [ ] Background sounds section — per-track volume sliders (0-100%), play/pause, remove
- [ ] Background music section — volume slider, play/pause, remove
- [ ] Sound effects section — per-track volume sliders, play/pause, remove, "Clear All Effects"

---

## 6. Audio Enhancements

- [ ] Per-track volume sliders in display status bar / live panel (background sounds, music, sound effects each independently adjustable)
- [ ] Audio fade in/out transitions (2-second default, customizable duration)

---

## Priority Order

1. **Encounter Management** — foundational, needed for initiative integration
2. **Initiative Tracker Gaps** — builds on encounters, completes combat workflow
3. **Battlemap Editor** — most complex feature, builds on party + encounters
4. **Live Display Panel** — quality-of-life improvement for DM workflow
5. **Keyboard Shortcuts** — polish, can be added incrementally
6. **Audio Enhancements** — minor improvements
