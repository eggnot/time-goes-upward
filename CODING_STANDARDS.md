# TGU Coding Standards & Architecture Rules


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

## Naming Conventions

### Functions
- Format: `tgu_[module]_functionName()`
- camelCase for function names
- Describe what the function does
- Examples:
  - `tgu_utils_parseKeyDate(key)` - Parses date from key

### Constants
- Format: `tgu_[module]_CONSTANT_NAME`
- UPPER_SNAKE_CASE
- All caps with underscores
- Examples:
  - `tgu_grid_MAX_CELLS = 37`
  - `tgu_state_TOOLTIP_MAX_LEN = 600`
  - `tgu_store_PREFIX = 'CONTENT'`
---

## Error Handling

### ❌ DO NOT

```javascript
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

## Testing Checklist Before Commit
- [ ] No inline styles (except zoom transform)
- [ ] CSS classes used for appearance changes only
- [ ] No `window` object polluted with custom functions
- [ ] Module responsibilities respected (no cross-cutting concerns)
