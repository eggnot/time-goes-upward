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
const STORAGE_KEY_ZOOM_ENABLED = 'tgu_global_zoom_enabled';
const STORAGE_KEY_GRID_ORIENTATION = 'tgu_global_grid_orient';

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
let zoomEnabled = true;
let gridOrientation = 'auto';
let isZoomedInHistory = false;
let scale = 1, posX = 0, posY = 0, didPan = false;

let lastRenderYear = null;
let lastRenderOrient = null;
let lastRenderSet = null;

let curSet = localStorage.getItem(STORAGE_KEY_CURRENT_SET) || 'def';
let sets = JSON.parse(localStorage.getItem(STORAGE_KEY_SETS) || '["def"]');

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

        if (!sets.includes(curSet)) curSet = 'def';
        updateSetSelector();
        applyGlobalSettings();
        applySetSettings();

        const yrDisp = document.getElementById('current-year-display');
        if (yrDisp) yrDisp.addEventListener('click', resetZoom);

        if (typeof applyUIContrast === 'function') applyUIContrast();

        renderGrid();
        setupPanZoom();
        window.addEventListener('resize', renderGrid); // Re-render to fix grid placements if aspect ratio flips

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

        app.addEventListener('keydown', handleGridKeyDown);
        
        // Allow navigating from search back to the grid
        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                const firstCell = app.querySelector('.gc:not(.res)');
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
        return curSet === 'def' ? key : `${KEY_PREFIX_SET}${curSet}${KEY_PREFIX_SEP}${key}`;
    }

    function getStorageKey(y, m, d) {
        const base = `${KEY_PREFIX_CONTENT}${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        return getSetKey(base);
    }

    function getSetDataKeys() {
        const prefix = curSet === 'def' ? KEY_PREFIX_CONTENT : `${KEY_PREFIX_SET}${curSet}${KEY_PREFIX_SEP}${KEY_PREFIX_CONTENT}`;
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

        // Load Zoom State
        const zoomVal = localStorage.getItem(STORAGE_KEY_ZOOM_ENABLED) !== 'false';
        const zoomToggle = document.getElementById('cfg-zoom-enabled');
        if (zoomToggle) zoomToggle.checked = zoomVal;
        toggleZoom(zoomVal, false);

        // Load Grid Orientation
        gridOrientation = localStorage.getItem(STORAGE_KEY_GRID_ORIENTATION) || 'auto';
        const orientSelect = document.getElementById('cfg-grid-orientation');
        if (orientSelect) orientSelect.value = gridOrientation;
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

        // Loop to skip residue cells (.res) until we hit a valid one or the grid edge
        while (true) {
            tr += dr; tc += dc;
            const cand = app.querySelector(`.gc[data-r="${tr}"][data-c="${tc}"]`);
            
            if (!cand) {
                // If moving UP out of grid, jump to search bar
                if (dr === -1 && searchBar) searchBar.focus();
                break;
            }
            
            if (!cand.classList.contains('res')) {
                target = cand;
                break;
            }
        }

        if (target) target.focus();
    }

    function applyTransform() {
        if (!app) return;
        app.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;

        // Reflect zoom in history so browser back button can reset it
        const currentlyZoomed = (scale !== 1 || posX !== 0 || posY !== 0);
        if (currentlyZoomed && !isZoomedInHistory) {
            isZoomedInHistory = true;
            history.pushState({ zoom: true }, "", "#zoom");
        }
    }

    function toggleZoom(enabled, save = true) {
        zoomEnabled = enabled;
        document.body.style.touchAction = enabled ? 'none' : 'auto';
        if (!enabled) resetZoom();
        if (save) localStorage.setItem(STORAGE_KEY_ZOOM_ENABLED, enabled);
    }

    function resetZoom(triggerBack = true) {
        const wasZoomed = isZoomedInHistory;
        scale = 1; posX = 0; posY = 0;
        isZoomedInHistory = false;
        applyTransform();
        if (triggerBack && wasZoomed && window.location.hash === '#zoom') {
            history.back();
        }
    }

    function setupPanZoom() {
        let startPoint = { x: 0, y: 0 };
        let startPos = { x: 0, y: 0 };
        let points = new Map();
        let initialDistance = 0;
        let initialScale = 1;
        let initialMidpoint = { x: 0, y: 0 };
        let initialPos = { x: 0, y: 0 };

        app.style.transformOrigin = '0 0';

        document.addEventListener('pointerdown', (e) => {
            didPan = false; // Ensure flag is reset even for UI clicks
            if (!zoomEnabled || editor.classList.contains('open')) return;
            if (e.target.closest('.modal-header, .modal-window')) return;

            points.set(e.pointerId, e);
            
            if (points.size === 1) {
                startPoint = { x: e.clientX, y: e.clientY };
                startPos = { x: posX, y: posY };
            } else if (points.size === 2) {
                const p = Array.from(points.values());
                initialDistance = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
                initialScale = scale;
                initialMidpoint = { x: (p[0].clientX + p[1].clientX) / 2, y: (p[0].clientY + p[1].clientY) / 2 };
                initialPos = { x: posX, y: posY };
            }
        });

        document.addEventListener('pointermove', (e) => {
            if (!zoomEnabled || !points.has(e.pointerId)) return;
            points.set(e.pointerId, e);

            if (points.size === 1) {
                const dx = e.clientX - startPoint.x;
                const dy = e.clientY - startPoint.y;
                if (Math.hypot(dx, dy) > 5) {
                    didPan = true;
                    posX = startPos.x + dx;
                    posY = startPos.y + dy;
                    applyTransform();
                }
            } else if (points.size === 2) {
                didPan = true;
                const p = Array.from(points.values());
                const curDist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
                const midX = (p[0].clientX + p[1].clientX) / 2;
                const midY = (p[0].clientY + p[1].clientY) / 2;

                if (initialDistance > 0) {
                    const newScale = Math.max(0.2, Math.min(5, initialScale * (curDist / initialDistance)));
                    posX = midX - (initialMidpoint.x - initialPos.x) * (newScale / initialScale);
                    posY = midY - (initialMidpoint.y - initialPos.y) * (newScale / initialScale);
                    scale = newScale;
                    applyTransform();
                }
            }
        });

        const stop = (e) => {
            points.delete(e.pointerId);
            if (points.size === 1) {
                const remaining = points.values().next().value;
                startPoint = { x: remaining.clientX, y: remaining.clientY };
                startPos = { x: posX, y: posY };
            }
            if (points.size < 2) initialDistance = 0;
        };
        document.addEventListener('pointerup', stop);
        document.addEventListener('pointercancel', stop);

        document.addEventListener('wheel', (e) => {
            if (!zoomEnabled || editor.classList.contains('open')) return;
            if (e.target.closest('.modal-header, .modal-window')) return;
            e.preventDefault();

            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.2, Math.min(5, scale * delta));

            // Zoom toward mouse position
            posX = e.clientX - (e.clientX - posX) * (newScale / scale);
            posY = e.clientY - (e.clientY - posY) * (newScale / scale);
            scale = newScale;

            applyTransform();
        }, { passive: false });

        document.addEventListener('click', (e) => {
            if (didPan) {
                e.stopImmediatePropagation();
                didPan = false;
            }
        }, true);
    }

    function renderGrid() {
        const isPortraitWindow = window.innerHeight > window.innerWidth;
        let effectivePortrait = isPortraitWindow;

        if (gridOrientation === 'vert') effectivePortrait = true;
        else if (gridOrientation === 'horiz') effectivePortrait = false;
        
        if (curYear === lastRenderYear && effectivePortrait === lastRenderOrient && curSet === lastRenderSet) {
            updateCellStates();
            return;
        }

        fullRebuild(effectivePortrait);
        
        lastRenderYear = curYear;
        lastRenderOrient = effectivePortrait;
        lastRenderSet = curSet;
    }

    // Ensure initialization happens after all scripts are loaded and DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        init();
    });
