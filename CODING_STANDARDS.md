# TGU Coding Standards & Architecture Rules

## DOM Access & Registry Pattern

### ✅ DO

- **Use DOM registry for all element access**
  ```javascript
  const editor = tgu_dom_get('editor');
  const cells = tgu_dom_getAll('.tgu-cell');
  ```
  
- **Always null-check registry results**
  ```javascript
  const modal = tgu_dom_get('settingsModal');
  if (modal) modal.classList.add('open');
  ```

- **Cache frequently accessed elements in functions**
  ```javascript
  function tgu_ui_openModal(id) {
      const modal = tgu_dom_get(id);
      if (!modal) return;
      modal.classList.add('open');
  }
  ```

- **Update registry when adding new element IDs**
  - Edit `tgu_dom_ids` object in `js/tgu_dom.js`
  - Use camelCase for key names
  - Example: `newSetNameInput: 'new-set-name'`

- **Query by selector for dynamic collections**
  ```javascript
  tgu_dom_getAll('.tgu-set-selector').forEach(sel => { ... });
  tgu_dom_getAll('[data-action]').forEach(el => { ... });
  ```

### ❌ DO NOT

```javascript
// ❌ Bad - Direct DOM queries scattered everywhere
document.getElementById('editor');
document.querySelector('.tgu-cell');
document.querySelectorAll('button');

// ❌ Bad - Element mutations without registry
document.getElementById('editor').classList.add('open');

// ❌ Bad - No null checks
const el = tgu_dom_get('missing');
el.classList.add('open');  // Crashes if null

// ❌ Bad - Element queries in default parameters
function myFunc(el = document.getElementById('app')) { ... }
```

---

## CSS & Styling

### ✅ DO

- **Use CSS classes for appearance**
  ```javascript
  element.classList.add('open');
  element.classList.toggle('hidden');
  element.classList.remove('error');
  ```

- **Use CSS custom properties (variables) for color/theme**
  ```javascript
  document.documentElement.style.setProperty('--primary', color);
  // CSS: .element { color: var(--primary); }
  ```

- **Group related classes semantically**
  - `.open / .closed` - visibility states
  - `.hidden / .visible` - display states
  - `.active / .inactive` - selection states
  - `.error / .success` - validation states

- **Keep styling in CSS files**, not JavaScript

### ❌ DO NOT

```javascript
// ❌ Bad - Direct inline styles (except zoom/transform)
element.style.color = color;       // Use classes instead
element.style.display = 'none';    // Use .hidden class
element.style.background = 'red';  // Define in CSS

// ❌ Bad - Magic strings in JavaScript
element.className = 'open active'; // Use classList API instead
```

---

## JSDoc Requirements

### Function Documentation

**Every public function MUST have:**
1. Description of what it does
2. `@param {type} name - description` for each parameter
3. `@returns {type} description` (including `void`)

```javascript
/**
 * Opens a modal dialog by ID.
 * @param {string} id - Modal element ID (from tgu_dom_ids)
 * @returns {void}
 */
function tgu_ui_openModal(id) {
    const modal = tgu_dom_get(id);
    if (!modal) {
        console.warn(`[tgu_ui] Modal not found: ${id}`);
        return;
    }
    modal.classList.add('open');
}
```

### Constant Documentation

**All constants should have JSDoc comments:**

```javascript
/** Month names for calendar display */
const tgu_grid_MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Number of months in a year */
const tgu_grid_MONTHS = 12;
```

### Private Functions

**Mark internal functions with `@private`:**

```javascript
/**
 * Internal: Calculates cell position in grid.
 * @private
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @returns {Object} Position object with x/y coordinates
 */
function tgu_grid_calculatePosition(row, col) { 
    // ... 
}
```

---

## Naming Conventions

### Functions
- Format: `tgu_[module]_functionName()`
- camelCase for function names
- Describe what the function does
- Examples:
  - `tgu_ui_openModal(id)` - Opens a modal
  - `tgu_store_getEntry(key)` - Retrieves an entry
  - `tgu_utils_parseKeyDate(key)` - Parses date from key

### Constants
- Format: `tgu_[module]_CONSTANT_NAME`
- UPPER_SNAKE_CASE
- All caps with underscores
- Examples:
  - `tgu_grid_MAX_CELLS = 37`
  - `tgu_state_TOOLTIP_MAX_LEN = 600`
  - `tgu_store_PREFIX = 'CONTENT'`

### Private Helpers (Internal Only)
- Still use `tgu_[module]_` prefix
- Add `@private` in JSDoc
- Example: `tgu_store_getPrefixedKey()` (only used internally by tgu-store.js)

### DOM Registry Keys
- camelCase
- Descriptive of element purpose
- Group related elements with common prefix
- Examples:
  - `settingsModal`, `helpModal` (modals)
  - `prevYearBtn`, `nextYearBtn` (buttons)
  - `diaryText`, `cellColorPicker` (inputs)

---

## Error Handling

### ✅ DO

```javascript
/**
 * Safely gets element, warns if missing.
 * @param {string} key - Registry key
 * @returns {Element|null}
 */
function tgu_dom_get(key) {
    if (tgu_dom_cache.has(key)) {
        return tgu_dom_cache.get(key);
    }
    const id = tgu_dom_ids[key];
    if (!id) {
        console.warn(`[tgu_dom] Unknown registry key: ${key}`);
        return null;
    }
    const el = document.getElementById(id);
    if (el) {
        tgu_dom_cache.set(key, el);
    }
    return el;
}

// Defensive code:
const modal = tgu_dom_get('settingsModal');
if (modal) modal.classList.add('open');  // Safe null-check
```

### ❌ DO NOT

```javascript
// ❌ Assume element exists (no validation)
tgu_dom_get('editor').classList.add('open');  // Crashes if null

// ❌ Silent failures
if (el) { 
    /* do something */ 
}  
// No logging, no warning

// ❌ No type checking
function myFunc(element) {
    element.classList.add('open');  // What if element isn't valid?
}
```

---

## Performance Guidelines

- **Element caching happens automatically** in `tgu_dom.js`
- **No need to cache individually** in each function
- **`tgu_dom_getAll()` returns fresh NodeList** (not cached)
- **For loops over NodeLists are safe and fast**

```javascript
// ✅ Good - Fresh query each time (acceptable for setups)
tgu_dom_getAll('.tgu-cell').forEach(el => {
    el.classList.add('sm');
});

// ✅ Good - Cached single element (preferred)
const searchBar = tgu_dom_get('searchBar');
if (searchBar) searchBar.value = '';
```

---

## Testing Checklist Before Commit

- [ ] All `document.getElementById()` replaced with `tgu_dom_get()`
- [ ] All `document.querySelectorAll()` replaced with `tgu_dom_getAll()`
- [ ] New element IDs added to `tgu_dom_ids` object in `tgu_dom.js`
- [ ] All public functions have complete JSDoc (description, @param, @returns)
- [ ] Console warnings logged for missing elements
- [ ] No inline styles (except zoom transform)
- [ ] CSS classes used for appearance changes only
- [ ] No `window` object polluted with custom functions
- [ ] Null checks on all registry lookups
- [ ] No magic strings in business logic
- [ ] Module responsibilities respected (no cross-cutting concerns)
