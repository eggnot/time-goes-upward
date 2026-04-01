/**
 * @file tgu-zoom.js
 * @description Zoom and pan functionality for the calendar grid.
 */

// ===== Zoom State =====

let tgu_zoom_enabled = true;
let tgu_zoom_scale = 1;
let tgu_zoom_posX = 0;
let tgu_zoom_posY = 0;
let tgu_zoom_didPan = false;

// ===== Zoom Functions =====

/**
 * Toggles zoom functionality.
 * @param {boolean} enabled
 * @param {boolean} [save] - Whether to persist the setting.
 */
function tgu_zoom_toggleZoom(enabled, save = true) {
    tgu_zoom_enabled = enabled;
    document.body.style.touchAction = enabled ? 'none' : 'auto';
    if (!enabled) tgu_zoom_resetZoom();
    if (save) tgu_store_saveGlobalSetting(tgu_store_KEYS.ZOOM_ENABLED, enabled);
}

/**
 * Resets zoom to default state.
 * @param {boolean} [triggerBack] - Whether to trigger history.back().
 */
function tgu_zoom_resetZoom(triggerBack = true) {
    const wasZoomed = window.isZoomedInHistory;
    tgu_zoom_scale = 1;
    tgu_zoom_posX = 0;
    tgu_zoom_posY = 0;
    window.isZoomedInHistory = false;
    tgu_zoom_applyTransform();
    if (triggerBack && wasZoomed && window.location.hash === '#zoom') history.back();
}

/**
 * Applies the current transform to the grid.
 * @returns {void}
 */
function tgu_zoom_applyTransform() {
    const app = tgu_dom_get('app');
    if (!app) return;
    app.style.transform = `translate(${tgu_zoom_posX}px, ${tgu_zoom_posY}px) scale(${tgu_zoom_scale})`;
    const zoomed = (tgu_zoom_scale !== 1 || tgu_zoom_posX !== 0 || tgu_zoom_posY !== 0);
    const resetBtn = tgu_dom_get('resetZoomBtn');
    if (resetBtn) resetBtn.classList.toggle('hidden', !zoomed);
    if (zoomed && !window.isZoomedInHistory) {
        window.isZoomedInHistory = true;
        history.pushState({ zoom: true }, "", "#zoom");
    }
}

/**
 * Sets up pan and zoom event listeners.
 * @returns {void}
 */
function tgu_zoom_setupPanZoom() {
    const app = tgu_dom_get('app');
    const editor = tgu_dom_get('editor');
    
    let startPoint = { x: 0, y: 0 };
    let startPos = { x: 0, y: 0 };
    let points = new Map();
    let iDist = 0;
    let iScale = 1;
    let iMid = { x: 0, y: 0 };
    let iPos = { x: 0, y: 0 };

    app.style.transformOrigin = '0 0';

    document.addEventListener('pointerdown', (e) => {
        tgu_zoom_didPan = false;
        if (!tgu_zoom_enabled || editor.classList.contains('open') || e.target.closest('.modal-header, .modal-window')) return;
        points.set(e.pointerId, e);
        if (points.size === 1) {
            startPoint = { x: e.clientX, y: e.clientY };
            startPos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
        } else if (points.size === 2) {
            const p = Array.from(points.values());
            iDist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
            iScale = tgu_zoom_scale;
            iMid = { x: (p[0].clientX + p[1].clientX) / 2, y: (p[0].clientY + p[1].clientY) / 2 };
            iPos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
        }
    });

    document.addEventListener('pointermove', (e) => {
        if (!tgu_zoom_enabled || !points.has(e.pointerId)) return;
        points.set(e.pointerId, e);
        if (points.size === 1) {
            const dx = e.clientX - startPoint.x;
            const dy = e.clientY - startPoint.y;
            if (Math.hypot(dx, dy) > 5) {
                tgu_zoom_didPan = true;
                tgu_zoom_posX = startPos.x + dx;
                tgu_zoom_posY = startPos.y + dy;
                tgu_zoom_applyTransform();
            }
        } else if (points.size === 2) {
            tgu_zoom_didPan = true;
            const p = Array.from(points.values());
            const curD = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
            const mX = (p[0].clientX + p[1].clientX) / 2;
            const mY = (p[0].clientY + p[1].clientY) / 2;
            if (iDist > 0) {
                const s = Math.max(0.2, Math.min(5, iScale * (curD / iDist)));
                tgu_zoom_posX = mX - (iMid.x - iPos.x) * (s / iScale);
                tgu_zoom_posY = mY - (iMid.y - iPos.y) * (s / iScale);
                tgu_zoom_scale = s;
                tgu_zoom_applyTransform();
            }
        }
    });

    const stop = (e) => {
        points.delete(e.pointerId);
        if (points.size === 1) {
            const rem = points.values().next().value;
            startPoint = { x: rem.clientX, y: rem.clientY };
            startPos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
        }
        if (points.size < 2) iDist = 0;
    };

    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);

    document.addEventListener('wheel', (e) => {
        if (!tgu_zoom_enabled || editor.classList.contains('open') || e.target.closest('.modal-header, .modal-window')) return;
        e.preventDefault();
        const d = e.deltaY > 0 ? 0.9 : 1.1;
        const s = Math.max(0.2, Math.min(5, tgu_zoom_scale * d));
        tgu_zoom_posX = e.clientX - (e.clientX - tgu_zoom_posX) * (s / tgu_zoom_scale);
        tgu_zoom_posY = e.clientY - (e.clientY - tgu_zoom_posY) * (s / tgu_zoom_scale);
        tgu_zoom_scale = s;
        tgu_zoom_applyTransform();
    }, { passive: false });

    document.addEventListener('click', (e) => {
        if (tgu_zoom_didPan) {
            e.stopImmediatePropagation();
            tgu_zoom_didPan = false;
        }
    }, true);
}
