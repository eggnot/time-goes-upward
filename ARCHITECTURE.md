# TGU Architecture & Project Organization

Current file structure and module organization. **This may change as the project evolves.**

## File Structure

```
src/
  js/
    tgu_dom.js          ← Element registry (no business logic)
    tgu-utils.js        ← Shared utilities (date, color, HTML functions)
    tgu-store.js        ← Data persistence & storage abstraction (localStorage)
    tgu-state.js        ← Grid cell state management and search
    tgu-ui.js           ← UI interactions, modals, theme control
    tgu-editor.js       ← Diary entry editor functionality
    tgu-data.js         ← CSV export/import operations
    tgu-grid.js         ← Calendar grid rendering
    tgu-zoom.js         ← Pan and zoom interactions
    tgu_events.js       ← Centralized event binding
    tgu-main.js         ← Application orchestration
    tgu-bootstrap.js    ← Infrastructure setup (SW registration, startup)
  index.html            ← Main HTML document
  main.css              ← Styling and layout
  sw.js                 ← Service Worker for offline support
  manifest.json         ← PWA manifest
CODING_STANDARDS.md     ← Code-level rules and conventions for agents
update_assets.py        ← Script to update the Service Worker's JS
UPDATE_ASSETS_README.md ← Hewp for agents
ARCHITECTURE.md         ← This file (project organization)
```

## Dependency Flow

```
index.html
  ↓
js/tgu_dom.js           (no dependencies)
  ↓
js/tgu-utils.js         (utilities)
  ↓
js/tgu-store.js         (data layer with localStorage abstraction)
  ↓
js/tgu-state.js, js/tgu-ui.js, js/tgu-editor.js, etc. (feature modules)
  ↓
js/tgu_events.js        (event binding)
  ↓
js/tgu-main.js          (orchestration)
  ↓
js/tgu-bootstrap.js     (startup - deferred)
```

## Module Responsibilities

### Foundation Layer

| Module | Purpose | DOM Access | Files |
|--------|---------|---|---|
| `tgu_dom.js` | Element registry with caching | Yes (cache only) | 1 file |

### Utility & Data Layer

| Module | Purpose | DOM Access | Files |
|--------|---------|---|---|
| `tgu-utils.js` | Shared utilities (date formatting, color, HTML escaping) | Minimal | 1 file |
| `tgu-store.js` | Data persistence, localStorage abstraction, entry CRUD, settings management | No | 1 file |

### Feature Modules

| Module | Purpose | DOM Access | Dependencies |
|--------|---------|---|---|
| `tgu-state.js` | Cell state management, search, tooltips | Via registry | store, utils |
| `tgu-ui.js` | Modal dialogs, settings panels, theme control | Via registry | store, utils, dom |
| `tgu-editor.js` | Diary entry editor interaction | Via registry | store, utils, dom, ui |
| `tgu-data.js` | CSV export/import operations | Minimal | store |
| `tgu-grid.js` | Calendar grid rendering | Via registry | store, utils, state |
| `tgu-zoom.js` | Pan and zoom event handling | Via registry | dom |

### Integration & Orchestration

| Module | Purpose | Responsibility |
|--------|---------|---|
| `tgu_events.js` | Centralized event binding | Subscribe all listeners to DOM events |
| `tgu-main.js` | Application orchestration | Coordinate initialization, render, settings |
| `tgu-bootstrap.js` | Infrastructure setup | Register Service Worker, start app on DOMContentLoaded |

## Key Architectural Decisions

### 1. Registry Pattern (tgu_dom.js)
- **Why**: Eliminate magic strings scattered throughout code
- **How**: All element IDs mapped in `tgu_dom_ids` object with caching
- **Benefit**: Centralized source of truth; easy to refactor HTML without breaking JS

### 2. Layered Architecture
- **Presentation** (UI interaction): tgu-ui.js, tgu-editor.js
- **Business Logic** (State): tgu-state.js, tgu-grid.js
- **Data** (Persistence): tgu-store.js (includes storage abstraction)
- **Infrastructure** (Setup): tgu-bootstrap.js

### 3. Event Delegation via tgu_events.js
- **Why**: Separate event binding from business logic
- **How**: Single file with all `addEventListener()` calls
- **Benefit**: Clear intent; easier to modify event handling

### 4. No ES6 Modules
- **Why**: Simpler Service Worker caching, no build step needed
- **How**: Global `tgu_` prefixed functions with module namespace
- **Tradeoff**: Larger global scope but clearer dependencies

### 5. CSS-Driven Styling
- **Why**: Styling behavior defined in CSS, not scattered in JS
- **How**: Use CSS classes and CSS custom properties (variables)
- **Benefit**: Easier to adjust theme, animations work consistently

## Module Communication Patterns

### Direct Function Calls
```javascript
// ✅ Module calls feature module directly
tgu_ui_openModal('settingsModal');
tgu_grid_rebuild(app, year);
```

### Through Store
```javascript
// ✅ Data flows through store
const entry = tgu_store_getEntry(key);
tgu_store_saveEntry(key, { text, color });
```

### Via DOM (Event-Driven)
```javascript
// ✅ Modules react to DOM changes
document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="save"]')) {
        tgu_editor_saveCurrentEntry();
    }
});
```

## Bootstrap Sequence

1. **HTML loads** (`index.html`)
2. **Scripts load in order**:
   - Foundation: tgu_dom.js
   - Utilities & data: tgu-utils.js, tgu-store.js
   - Features: tgu-state.js, tgu-ui.js, tgu-editor.js, etc.
   - Integration: tgu_events.js, tgu-main.js
3. **DOMContentLoaded fires**:
   - `tgu-bootstrap.js` executes (deferred)
   - Registers Service Worker
   - Calls `tgu_main_init()` to start application
4. **Application runs**:
   - Settings hydrated from localStorage
   - Grid rendered for current year
   - Event listeners bound to DOM elements

## When to Modify This Document

Update this file when:
- File structure changes (moving files, creating new modules)
- Module responsibilities shift
- Bootstrap sequence changes
- Add new architectural patterns
- Change dependency relationships

Do **NOT** update this for:
- Code-level standards (see `CODING_STANDARDS.md`)
- Refactoring within existing modules
- Bug fixes or performance improvements
