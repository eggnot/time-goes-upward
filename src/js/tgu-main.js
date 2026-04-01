/**
 * @file tgu-main.js
 * @description Application initialization and orchestration (centralized event binding in tgu_events.js).
 */

// ===== App Constants =====

/** Default set name */
const tgu_main_DEFAULT_SET = 'life';

/** Default background color */
const tgu_main_DEFAULT_BG_COLOR = '#d0ff8a';

// ===== Initialization & Setup =====

/**
 * Initializes the application: applies settings, renders grid, and binds event listeners.
 * Orchestration only - detailed event binding is in tgu_events.js.
 */
function tgu_main_init() {
    // Validate localStorage format (detect corrupted/old data from previous versions)
    const storageStatus = tgu_store_validateStorageFormat();
    if (!storageStatus.isClean) {
        console.log(`[tgu_main] Storage validation: ${storageStatus.issueCount} corrupted keys will be ignored`);
    }

    // Apply user settings to UI
    tgu_main_applyGlobalSettings();
    tgu_main_applySetSettings();
    tgu_ui_updateSetSelector();

    // Render the calendar grid
    tgu_main_renderGrid();

    // Bind all event listeners (centralized in tgu_events.js)
    tgu_events_bindAll();

    console.log(`[tgu_main] App initialized.`);
}

/**
 * Handles global keyboard shortcuts (Escape, Tab trapping).
 * @param {KeyboardEvent} e
 */
function tgu_main_handleGlobalKey(e) {
    const editor = tgu_dom_get('editor');
    if (e.key === "Escape") {
        if (editor?.classList.contains('open')) { tgu_editor_closeEditor(); return; }
        const modal = document.querySelector('.modal-window.open:not(#editor)');
        if (modal) { tgu_ui_closeModal(modal.id); return; }
        tgu_zoom_resetZoom();
        return;
    }

    if (e.key === 'Tab') {
        const modal = document.querySelector('.modal-window.open');
        if (!modal) return;

        const focusables = modal.querySelectorAll('button:not(:disabled), [href], input:not(.hidden), select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            last.focus(); e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus(); e.preventDefault();
        }
    }
}

/**
 * Applies global appearance settings to the UI.
 */
function tgu_main_applyGlobalSettings() {
    tgu_ui_toggleAnimation(tgu_store_getGlobalSetting(tgu_store_KEYS.BG_ANIM, false), false);
    tgu_ui_updateFontSize(tgu_store_getGlobalSetting(tgu_store_KEYS.FONT_SIZE, 16), false);
    tgu_ui_updateModalOpacity(tgu_store_getGlobalSetting(tgu_store_KEYS.MODAL_OPACITY, 1), false);
    tgu_ui_updatePastOpacity(tgu_store_getGlobalSetting(tgu_store_KEYS.OPACITY_PAST, 1), false);
    tgu_ui_updateFutureOpacity(tgu_store_getGlobalSetting(tgu_store_KEYS.OPACITY_FUTURE, 0.85), false);
    tgu_zoom_toggleZoom(tgu_store_getGlobalSetting(tgu_store_KEYS.ZOOM_ENABLED, true), false);
}

/**
 * Applies set-specific theme settings (colors).
 */
function tgu_main_applySetSettings() {
    ['--bg-content', '--primary', '--bg-tooltip'].forEach(v => {
        const settingName = 'cfg_' + v.replace('--', '');
        const saved = tgu_store_getSetSetting(settingName);
        if (saved) {
            document.documentElement.style.setProperty(v, saved);
            if (v === '--bg-content') {
                document.documentElement.style.setProperty('--text-on-content', tgu_utils_getContrastColor(saved));
            }
        } else {
            document.documentElement.style.removeProperty(v);
            if (v === '--bg-content') {
                document.documentElement.style.setProperty('--text-on-content', tgu_utils_getContrastColor(tgu_main_DEFAULT_BG_COLOR));
            }
        }
        // Update color picker input with current CSS variable value
        // Convert --bg-content → bgContent (camelCase registry key)
        const cssVar = v.replace(/--/g, ''); // 'bg-content'
        const inputKey = 'cfg' + cssVar.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('');
        const input = tgu_dom_get(inputKey);
        if (input) input.value = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    });
}

/**
 * Handles keyboard navigation within the grid.
 * @param {KeyboardEvent} e
 */
function tgu_main_handleGridKeyDown(e) {
    const active = document.activeElement;
    if (!active || !active.classList.contains('tgu-cell')) return;

    let tr = parseInt(active.dataset.r);
    let tc = parseInt(active.dataset.c);

    const dr = e.key === 'ArrowUp' ? -1 : (e.key === 'ArrowDown' ? 1 : 0);
    const dc = e.key === 'ArrowLeft' ? -1 : (e.key === 'ArrowRight' ? 1 : 0);

    if (dr === 0 && dc === 0) {
        if (e.key === 'Enter' || e.key === ' ') { active.click(); e.preventDefault(); }
        return;
    }

    e.preventDefault();
    let target = null;
    const app = tgu_dom_get('app');

    while (true) {
        tr += dr;
        tc += dc;
        if (tr < 1 || tr > tgu_grid_MONTHS || tc < 1 || tc > tgu_grid_MAX_CELLS) {
            const searchBar = tgu_dom_get('searchBar');
            if (dr === -1 && searchBar) searchBar.focus();
            break;
        }
        const cand = app?.querySelector(`.tgu-cell[data-r="${tr}"][data-c="${tc}"]`);
        if (cand) { target = cand; break; }
    }

    if (target) target.focus();
}

/**
 * Orchestrates grid rendering.
 */
function tgu_main_renderGrid() {
    const yearDisplay = tgu_dom_get('currentYearDisplay');
    const curYear = parseInt(yearDisplay?.textContent || new Date().getFullYear());
    const curSet = tgu_store_getCurrentSet();
    const app = tgu_dom_get('app');
    const searchBar = tgu_dom_get('searchBar');

    console.log(`[tgu_main] renderGrid: year=${curYear}, set="${curSet}"`);

    if (app) tgu_grid_rebuild(app, curYear);
    
    const searchTerm = (searchBar?.value || '').trim().length > 2 ? searchBar.value.trim().toLowerCase() : "";
    tgu_state_updateCellStates(searchTerm);
}
