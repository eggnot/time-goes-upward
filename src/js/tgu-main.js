// ===== App Constants =====

const tgu_main_DEFAULT_SET = 'life';
const tgu_main_DEFAULT_BG_COLOR = '#d0ff8a';
const tgu_main_FOCUS_DELAY_MS = 100;

// ===== Initialization & Setup =====

function tgu_main_init() {
    // Apply user settings to UI
    tgu_main_applyGlobalSettings();
    tgu_main_applySetSettings();
    tgu_ui_updateSetSelector();

    // Render the calendar grid
    tgu_main_renderGrid();

    // Ensure Today is visible and comfortable on screen
    requestAnimationFrame(() => tgu_zoom_resetZoom(false));

    // Bind all event listeners (centralized in tgu_events.js)
    tgu_events_bindAll();

    console.log(`[tgu_main] App initialized.`);
}

function tgu_main_handleGlobalKey(e) {
    const editor = document.getElementById('editor');
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

function tgu_main_applyGlobalSettings() {
    tgu_ui_toggleAnimation(tgu_store_getGlobalSetting(tgu_store_KEYS.BG_ANIM, true));
    tgu_ui_updateFontSize(tgu_store_getGlobalSetting(tgu_store_KEYS.FONT_SIZE, 16));
    tgu_ui_updateModalOpacity(tgu_store_getGlobalSetting(tgu_store_KEYS.MODAL_OPACITY, 1));
    tgu_ui_updatePastOpacity(tgu_store_getGlobalSetting(tgu_store_KEYS.OPACITY_PAST, 1));
    tgu_ui_updateFutureOpacity(tgu_store_getGlobalSetting(tgu_store_KEYS.OPACITY_FUTURE, 0.85));
    tgu_zoom_toggleZoom(tgu_store_getGlobalSetting(tgu_store_KEYS.ZOOM_ENABLED, true));
}

function tgu_main_applySetSettings() {
    const colorVars = {
        '--bg-content': 'cfg-bg-content',
        '--primary': 'cfg-primary',
        '--bg-tooltip': 'cfg-bg-tooltip'
    };
    
    Object.entries(colorVars).forEach(([cssVar, inputId]) => {
        const settingName = 'cfg_' + cssVar.slice(2);
        const saved = tgu_store_getSetSetting(settingName);
        const colorValue = saved || tgu_main_DEFAULT_BG_COLOR;
        
        if (saved) {
            document.documentElement.style.setProperty(cssVar, saved);
        } else {
            document.documentElement.style.removeProperty(cssVar);
        }
        
        if (cssVar === '--bg-content') {
            document.documentElement.style.setProperty('--text-on-content', tgu_utils_getContrastColor(colorValue));
        }
        
        const input = document.getElementById(inputId);
        if (input) input.value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    });
}

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
    const app = document.getElementById('app');

    while (true) {
        tr += dr;
        tc += dc;
        if (tr < 1 || tr > tgu_grid_MONTHS || tc < 1 || tc > tgu_grid_MAX_CELLS) {
            const searchBar = document.getElementById('search-bar');
            if (dr === -1 && searchBar) searchBar.focus();
            break;
        }
        const cand = app?.querySelector(`.tgu-cell[data-r="${tr}"][data-c="${tc}"]`);
        if (cand) { target = cand; break; }
    }

    if (target) target.focus();
}

function tgu_main_renderGrid() {
    const yearDisplay = document.getElementById('current-year-display');
    const curYear = parseInt(yearDisplay?.textContent || new Date().getFullYear());
    const curSet = tgu_store_getCurrentSet();
    const app = document.getElementById('app');
    const searchBar = document.getElementById('search-bar');

    console.log(`[tgu_main] renderGrid: year=${curYear}, set="${curSet}"`);

    if (app) tgu_grid_rebuild(app, curYear);
    const searchTerm = (searchBar?.value || '').trim().length > 2 ? searchBar.value.trim().toLowerCase() : "";
    tgu_state_updateCellStates(searchTerm);
}
