/**
 * TGU Zoom Module
 * Manages viewport transformations including panning, pinch-to-zoom, and smart alignment.
 */

let tgu_zoom_enabled = true;
let tgu_zoom_scale = 1;
let tgu_zoom_posX = 0;
let tgu_zoom_posY = 0;
let tgu_zoom_didPan = false;

/** @type {Map<number, PointerEvent>} */
const tgu_zoom_pointers = new Map();

/** @description Captures initial values at the start of a pan/zoom gesture */
const tgu_zoom_session = {
    dist: 0,
    scale: 1,
    mid: { x: 0, y: 0 },
    pos: { x: 0, y: 0 }
};

const tgu_zoom_PAN_THRESHOLD = 5;
const tgu_zoom_MIN_SCALE = 0.2;
const tgu_zoom_MAX_SCALE = 5;
const tgu_zoom_WHEEL_DOWN_FACTOR = 0.9;
const tgu_zoom_WHEEL_UP_FACTOR = 1.1;

/** 
 * Margin for "Today" cell alignment. 
 * Ranges: 0.0 = edge of screen, 0.5 = dead center.
 */
const tgu_zoom_SAFE_PAD = 0.2;

/**
 * Enables or disables zoom functionality and resets state if disabled.
 * @param {boolean} enabled 
 */
function tgu_zoom_toggleZoom(enabled) {
    tgu_zoom_enabled = enabled;
    document.body.style.touchAction = enabled ? 'none' : 'auto';
    if (!enabled) tgu_zoom_resetZoom();
    tgu_store_saveGlobalSetting(tgu_store_KEYS.ZOOM_ENABLED, enabled);
}

/**
 * Resets zoom to 1:1 and pans to "Today" if the grid exceeds viewport bounds.
 * @param {boolean} [triggerBack=true] Whether to trigger history.back()
 */
function tgu_zoom_resetZoom(triggerBack = true) {
    const wasZoomed = window.isZoomedInHistory;
    const app = document.getElementById('app');
    const today = document.querySelector('.tdy');
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    tgu_zoom_scale = 1;

    if (!app) {
        tgu_zoom_posX = 0;
        tgu_zoom_posY = 0;
        return;
    }

    const gw = app.offsetWidth;
    const gh = app.offsetHeight;

    // Helper to calculate smart nudge per axis
    const getNudge = (gridSize, viewSize, todayPos, todaySize) => {
        if (gridSize <= viewSize) return 0; // Do not pan if the axis fits the screen
        if (!today) return 0;
        const center = todayPos + todaySize / 2;
        const pad = viewSize * tgu_zoom_SAFE_PAD;
        let t = 0;
        if (center < pad) t = pad - center;
        else if (center > viewSize - pad) t = (viewSize - pad) - center;
        return Math.max(viewSize - gridSize, Math.min(0, t));
    };

    tgu_zoom_posX = getNudge(gw, vw, today?.offsetLeft || 0, today?.offsetWidth || 0);
    tgu_zoom_posY = getNudge(gh, vh, today?.offsetTop || 0, today?.offsetHeight || 0);

    window.isZoomedInHistory = false;
    tgu_zoom_applyTransform();
    
    if (triggerBack && wasZoomed && window.location.hash === '#zoom') history.back();
}

/**
 * Updates the DOM via CSS transform and manages zoom history state.
 */
function tgu_zoom_applyTransform() {
    const app = document.getElementById('app');
    if (!app) return;

    app.style.transform = `translate(${tgu_zoom_posX}px, ${tgu_zoom_posY}px) scale(${tgu_zoom_scale})`;
    
    const zoomed = (tgu_zoom_scale !== 1 || tgu_zoom_posX !== 0 || tgu_zoom_posY !== 0);
    const resetBtn = document.getElementById('reset-zoom-btn');
    
    if (resetBtn) resetBtn.classList.toggle('hidden', !zoomed);
    
    if (zoomed && !window.isZoomedInHistory) {
        window.isZoomedInHistory = true;
        history.pushState({ zoom: true }, "", "#zoom");
    }
}

/**
 * Handles initial pointer contact for panning or scaling.
 * @param {PointerEvent} e 
 */
function tgu_zoom_handlePointerDown(e) {
    tgu_zoom_didPan = false;
    if (!tgu_zoom_enabled || document.getElementById('editor')?.classList.contains('open')) return;
    if (e.target.closest('.modal-header, .modal-window')) return;
    
    tgu_zoom_pointers.set(e.pointerId, e);

    if (tgu_zoom_pointers.size === 1) {
        tgu_zoom_session.mid = { x: e.clientX, y: e.clientY };
        tgu_zoom_session.pos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
    } else if (tgu_zoom_pointers.size === 2) {
        const pts = Array.from(tgu_zoom_pointers.values());
        tgu_zoom_session.dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        tgu_zoom_session.scale = tgu_zoom_scale;
        tgu_zoom_session.mid = { x: (pts[0].clientX + pts[1].clientX) / 2, y: (pts[0].clientY + pts[1].clientY) / 2 };
        tgu_zoom_session.pos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
    }
}

/**
 * Manages active pan and pinch movements.
 * @param {PointerEvent} e 
 */
function tgu_zoom_handlePointerMove(e) {
    if (!tgu_zoom_enabled || !tgu_zoom_pointers.has(e.pointerId)) return;
    
    tgu_zoom_pointers.set(e.pointerId, e);
    
    if (tgu_zoom_pointers.size === 1) {
        const dx = e.clientX - tgu_zoom_session.mid.x;
        const dy = e.clientY - tgu_zoom_session.mid.y;
        
        if (Math.hypot(dx, dy) > tgu_zoom_PAN_THRESHOLD) {
            tgu_zoom_didPan = true;
            tgu_zoom_posX = tgu_zoom_session.pos.x + dx;
            tgu_zoom_posY = tgu_zoom_session.pos.y + dy;
            tgu_zoom_applyTransform();
        }
    } else if (tgu_zoom_pointers.size === 2) {
        tgu_zoom_didPan = true;
        const pts = Array.from(tgu_zoom_pointers.values());
        const curDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        const mX = (pts[0].clientX + pts[1].clientX) / 2;
        const mY = (pts[0].clientY + pts[1].clientY) / 2;

        if (tgu_zoom_session.dist > 0) {
            const s = Math.max(tgu_zoom_MIN_SCALE, Math.min(tgu_zoom_MAX_SCALE, tgu_zoom_session.scale * (curDist / tgu_zoom_session.dist)));
            tgu_zoom_posX = mX - (tgu_zoom_session.mid.x - tgu_zoom_session.pos.x) * (s / tgu_zoom_session.scale);
            tgu_zoom_posY = mY - (tgu_zoom_session.mid.y - tgu_zoom_session.pos.y) * (s / tgu_zoom_session.scale);
            tgu_zoom_scale = s;
            tgu_zoom_applyTransform();
        }
    }
}

/**
 * Cleans up pointer data and updates session for remaining pointers.
 * @param {PointerEvent} e 
 */
function tgu_zoom_handlePointerEnd(e) {
    tgu_zoom_pointers.delete(e.pointerId);
    
    if (tgu_zoom_pointers.size === 1) {
        const rem = tgu_zoom_pointers.values().next().value;
        tgu_zoom_session.mid = { x: rem.clientX, y: rem.clientY };
        tgu_zoom_session.pos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
    }
    
    if (tgu_zoom_pointers.size < 2) tgu_zoom_session.dist = 0;
}

/**
 * Handles mouse wheel zooming.
 * @param {WheelEvent} e 
 */
function tgu_zoom_handleWheel(e) {
    if (!tgu_zoom_enabled || document.getElementById('editor')?.classList.contains('open')) return;
    if (e.target.closest('.modal-header, .modal-window')) return;

    e.preventDefault();
    const d = e.deltaY > 0 ? tgu_zoom_WHEEL_DOWN_FACTOR : tgu_zoom_WHEEL_UP_FACTOR;
    const s = Math.max(tgu_zoom_MIN_SCALE, Math.min(tgu_zoom_MAX_SCALE, tgu_zoom_scale * d));
    
    tgu_zoom_posX = e.clientX - (e.clientX - tgu_zoom_posX) * (s / tgu_zoom_scale);
    tgu_zoom_posY = e.clientY - (e.clientY - tgu_zoom_posY) * (s / tgu_zoom_scale);
    tgu_zoom_scale = s;
    tgu_zoom_applyTransform();
}

/**
 * Suppresses click events if a pan gesture was just completed.
 * @param {MouseEvent} e 
 */
function tgu_zoom_handleClickAfterPan(e) {
    if (tgu_zoom_didPan) {
        e.stopImmediatePropagation();
        tgu_zoom_didPan = false;
    }
}

/**
 * Initializes global event listeners for pan/zoom interactions.
 */
function tgu_zoom_setupPanZoom() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.style.transformOrigin = '0 0';
    
    document.addEventListener('pointerdown', tgu_zoom_handlePointerDown);
    document.addEventListener('pointermove', tgu_zoom_handlePointerMove);
    document.addEventListener('pointerup', tgu_zoom_handlePointerEnd);
    document.addEventListener('pointercancel', tgu_zoom_handlePointerEnd);
    document.addEventListener('wheel', tgu_zoom_handleWheel, { passive: false });
    document.addEventListener('click', tgu_zoom_handleClickAfterPan, true);
}
