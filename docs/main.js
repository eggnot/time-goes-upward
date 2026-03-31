const SW_FILENAME = 'sw.js';

const KEY_PREFIX_CONTENT = 'D_';
const KEY_PREFIX_COLOR = 'C_';
const KEY_PREFIX_SET = 'SET:';
const KEY_PREFIX_SEP = ':';

const STORAGE_KEY_SETS = 'tgu_sets';
const STORAGE_KEY_CURRENT_SET = 'tgu_current_set';
const STORAGE_KEY_BG_ANIM = 'tgu_global_bg_anim';
const STORAGE_KEY_FONT_SIZE = 'tgu_global_font_size';
const STORAGE_KEY_MODAL_OPACITY = 'tgu_global_modal_opacity';
const STORAGE_KEY_OPACITY_PAST = 'tgu_global_opacity_past';
const STORAGE_KEY_OPACITY_FUTURE = 'tgu_global_opacity_future';
const STORAGE_KEY_ZOOM_ENABLED = 'tgu_global_zoom_enabled';
const DEFAULT_SET = 'life';

const MONTHS_COUNT = 12;
const DEFAULT_BG_COLOR = '#d0ff8a';
const COLOR_WHITE_THRESHOLD = 250;

// --- Global Utilities ---
function getContrastColor(hex) {
    if (!hex) return '#000000';
    let r, g, b;
    if (hex.startsWith('rgb')) {
        const rgb = hex.match(/\d+/g);
        r = parseInt(rgb[0]);
        g = parseInt(rgb[1]);
        b = parseInt(rgb[2]);
    } else {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return (r * 0.299 + g * 0.587 + b * 0.114) < 128 ? '#ffffff' : '#000000';
}

function isColorNearWhite(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r > COLOR_WHITE_THRESHOLD && g >COLOR_WHITE_THRESHOLD && b > COLOR_WHITE_THRESHOLD;
}

// Helper: Extract date from storage key (handles SET:name:D_YYYY-MM-DD format)
function parseKeyDate(key) {
    const cleanKey = key.replace(new RegExp(`^${KEY_PREFIX_SET}[^:]+:`), '');
    const dateStr = cleanKey.substring(2); // Remove 'D_'
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

let app, editor, textArea, dateLabel, colorPicker, prevBtn, nextBtn, tooltip, searchBar, clearBtn, lastFocus = null;
let themeDef = {};

let curYear = new Date().getFullYear();
let editKey = null;
let editDate = null;
let searchTerm = "";

let lastRenderYear = null;
let lastRenderSet = null;

let curSet = localStorage.getItem(STORAGE_KEY_CURRENT_SET) || DEFAULT_SET;
let sets = JSON.parse(localStorage.getItem(STORAGE_KEY_SETS) || `["${DEFAULT_SET}"]`);

    // --- Core Logic ---

    function init() {
        app = document.getElementById('app');
        editor = document.getElementById('editor');
        textArea = document.getElementById('diary-text');
        dateLabel = document.getElementById('editor-date-label');
        colorPicker = document.getElementById('cell-color-picker');
        prevBtn = document.getElementById('prev-entry-btn');
        nextBtn = document.getElementById('next-entry-btn');
        tooltip = document.getElementById('tooltip');
        searchBar = document.getElementById('search-bar');
        clearBtn = document.getElementById('clear-search');

        ['--bg-content', '--primary', '--bg-tooltip'].forEach(v => {
            themeDef[v] = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
        });

        document.documentElement.style.setProperty('--text-on-content', getContrastColor(themeDef['--bg-content']));

        if (!sets.includes(curSet)) curSet = DEFAULT_SET;
        updateSetSelector();
        applyGlobalSettings();
        applySetSettings();

        if (typeof applyUIContrast === 'function') applyUIContrast();

        renderGrid();
        setupPanZoom();

        // Ensure UI elements and modals stay above the transformed grid
        app.style.zIndex = "1";
        document.querySelectorAll('.modal-header, .modal-window').forEach(el => {
            el.style.zIndex = "100";
            el.style.touchAction = "auto";
        });

        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(SW_FILENAME).catch(() => {});
        }

        // Event Delegation for Grid Interaction
        app.onclick = (e) => {
            const cell = e.target.closest('.gc');
            if (cell) { hideTooltip(); openEditor(parseKeyDate(cell.dataset.k), cell.dataset.k); }
        };
        app.onmouseover = (e) => {
            const cell = e.target.closest('.gc');
            if (cell) showTooltip(e, cell.dataset.k);
        };
        app.onmousemove = (e) => moveTooltip(e);
        app.onmouseout = (e) => { if (e.target.closest('.gc')) hideTooltip(); };
        
        // Allow navigating from search back to the grid
        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                const firstCell = app.querySelector('.gc');
                if (firstCell) { firstCell.focus(); e.preventDefault(); }
            }
        });

        // History API for Back Button
        window.onpopstate = (e) => {
            if (isZoomedInHistory && (!e.state || !e.state.zoom)) {
                resetZoom(false);
            }
            if (editor.classList.contains('open')) closeEditor(false);
            const modal = document.querySelector('.modal-window.open:not(#editor)');
            if (modal) closeModal(modal.id, false);
        };

        window.addEventListener('keydown', handleGlobalKey);
    }

    function handleGlobalKey(e) {
        if (e.key === "Escape") {
            if (editor.classList.contains('open')) { closeEditor(); return; }
            const modal = document.querySelector('.modal-window.open:not(#editor)');
            if (modal) { closeModal(modal.id); return; }
            resetZoom();
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

    function getSetKey(key) {
        return curSet === DEFAULT_SET ? key : `${KEY_PREFIX_SET}${curSet}${KEY_PREFIX_SEP}${key}`;
    }

    function getStorageKey(y, m, d) {
        const base = `${KEY_PREFIX_CONTENT}${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        return getSetKey(base);
    }

    function getSetDataKeys() {
        const prefix = curSet === DEFAULT_SET ? KEY_PREFIX_CONTENT : `${KEY_PREFIX_SET}${curSet}${KEY_PREFIX_SEP}${KEY_PREFIX_CONTENT}`;
        return Object.keys(localStorage).filter(k => k.startsWith(prefix)).sort();
    }

    function applyGlobalSettings() {
        // Load Animation
        const bgAnim = localStorage.getItem(STORAGE_KEY_BG_ANIM) !== 'false';
        const animToggle = document.getElementById('bg-animation-toggle');
        if (animToggle) animToggle.checked = bgAnim;
        toggleAnimation(bgAnim, false);

        // Load Font Size
        const fontSize = localStorage.getItem(STORAGE_KEY_FONT_SIZE) || '16';
        const fontInput = document.getElementById('cfg-font-size');
        if (fontInput) fontInput.value = fontSize;
        updateFontSize(fontSize, false);

        // Load Modal Transparency
        const modalOpacity = localStorage.getItem(STORAGE_KEY_MODAL_OPACITY) || '1';
        const opacityInput = document.getElementById('cfg-modal-opacity');
        if (opacityInput) opacityInput.value = modalOpacity;
        updateModalOpacity(modalOpacity, false);

        // Load Past Opacity
        const pastOpacity = localStorage.getItem(STORAGE_KEY_OPACITY_PAST) || '1';
        const pastInput = document.getElementById('cfg-opacity-past');
        if (pastInput) pastInput.value = pastOpacity;
        updatePastOpacity(pastOpacity, false);

        // Load Future Opacity
        const futureOpacity = localStorage.getItem(STORAGE_KEY_OPACITY_FUTURE) || '0.85';
        const futureInput = document.getElementById('cfg-opacity-future');
        if (futureInput) futureInput.value = futureOpacity;
        updateFutureOpacity(futureOpacity, false);

        // Load Zoom State
        const zoomVal = localStorage.getItem(STORAGE_KEY_ZOOM_ENABLED) !== 'false';
        const zoomToggle = document.getElementById('cfg-zoom-enabled');
        if (zoomToggle) zoomToggle.checked = zoomVal;
        toggleZoom(zoomVal, false);
    }

    function applySetSettings() {
        ['--bg-content', '--primary', '--bg-tooltip'].forEach(v => {
            const key = getSetKey('cfg_' + v.replace('--', ''));
            const saved = localStorage.getItem(key);
            if (saved) {
                document.documentElement.style.setProperty(v, saved);
                if (v === '--bg-content') {
                    const contrast = getContrastColor(saved);
                    document.documentElement.style.setProperty('--text-on-content', contrast);
                }
            } else {
                document.documentElement.style.removeProperty(v);
                if (v === '--bg-content') {
                    const contrast = getContrastColor(themeDef['--bg-content']);
                    document.documentElement.style.setProperty('--text-on-content', contrast);
                }
            }
            const input = document.getElementById('cfg-' + v.replace('--', ''));
            if (input) input.value = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
        });
        if (typeof applyUIContrast === 'function') applyUIContrast();
    }

    function handleGridKeyDown(e) {
        const active = document.activeElement;
        if (!active || !active.classList.contains('gc')) return;

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

        while (true) {
            tr += dr; tc += dc;
            if (tr < 1 || tr > MONTHS_COUNT || tc < 1 || tc > MAX_CELLS_PER_MONTH) {
                if (dr === -1 && searchBar) searchBar.focus();
                break;
            }
            const cand = app.querySelector(`.gc[data-r="${tr}"][data-c="${tc}"]`);
            if (cand) {
                target = cand;
                break;
            }
        }

        if (target) target.focus();
    }

    function renderGrid() {
        if (curYear === lastRenderYear && curSet === lastRenderSet) {
            updateCellStates();
            return;
        }

        fullRebuild();
        
        lastRenderYear = curYear;
        lastRenderSet = curSet;
    }

    // Ensure initialization happens after all scripts are loaded and DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        init();
    });
