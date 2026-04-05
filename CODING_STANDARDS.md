# TGU Coding Standards & Architecture Rules

## Code & Naming Conventions
- ES6(Best Practices) without import / export
- no overexplaining comments
- JSDoc for a source of true
- arrow functions and default params(if needed)
---

### Functions
- Format: `tgu_[module]_functionName(arg1, arg2='default')`
- camelCase for function names
- Describe what the function does


### Constants
- Format: `tgu_[module]_CONSTANT_NAME`
- UPPER_SNAKE_CASE
- All caps with underscores

---

## Error Handling

### ❌ DO NOT
❌ Silent failures
❌ No type checking

```

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