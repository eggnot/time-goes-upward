// ===== Zoom State =====

let tgu_zoom_enabled = true;
let tgu_zoom_scale = 1;
let tgu_zoom_posX = 0;
let tgu_zoom_posY = 0;
let tgu_zoom_didPan = false;

// ===== Pan/Zoom Session State =====

let tgu_zoom_startPoint = { x: 0, y: 0 };
let tgu_zoom_startPos = { x: 0, y: 0 };
let tgu_zoom_points = new Map();
let tgu_zoom_iDist = 0;
let tgu_zoom_iScale = 1;
let tgu_zoom_iMid = { x: 0, y: 0 };
let tgu_zoom_iPos = { x: 0, y: 0 };

// ===== Constants =====

const tgu_zoom_PAN_THRESHOLD = 5;
const tgu_zoom_MIN_SCALE = 0.2;
const tgu_zoom_MAX_SCALE = 5;
const tgu_zoom_WHEEL_DOWN_FACTOR = 0.9;
const tgu_zoom_WHEEL_UP_FACTOR = 1.1;

// ===== Zoom Functions =====

function tgu_zoom_toggleZoom(enabled) {
    tgu_zoom_enabled = enabled;
    document.body.style.touchAction = enabled ? 'none' : 'auto';
    if (!enabled) tgu_zoom_resetZoom();
    tgu_store_saveGlobalSetting(tgu_store_KEYS.ZOOM_ENABLED, enabled);
}

function tgu_zoom_resetZoom(triggerBack = true) {
    const wasZoomed = window.isZoomedInHistory;
    tgu_zoom_scale = 1;
    tgu_zoom_posX = 0;
    tgu_zoom_posY = 0;
    window.isZoomedInHistory = false;
    tgu_zoom_applyTransform();
    if (triggerBack && wasZoomed && window.location.hash === '#zoom') history.back();
}

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

function tgu_zoom_handlePointerDown(e) {
    tgu_zoom_didPan = false;
    const editor = document.getElementById('editor');
    if (!tgu_zoom_enabled || editor?.classList.contains('open') || e.target.closest('.modal-header, .modal-window')) return;
    
    tgu_zoom_points.set(e.pointerId, e);
    if (tgu_zoom_points.size === 1) {
        tgu_zoom_startPoint = { x: e.clientX, y: e.clientY };
        tgu_zoom_startPos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
    } else if (tgu_zoom_points.size === 2) {
        const p = Array.from(tgu_zoom_points.values());
        tgu_zoom_iDist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
        tgu_zoom_iScale = tgu_zoom_scale;
        tgu_zoom_iMid = { x: (p[0].clientX + p[1].clientX) / 2, y: (p[0].clientY + p[1].clientY) / 2 };
        tgu_zoom_iPos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
    }
}

function tgu_zoom_handlePointerMove(e) {
    if (!tgu_zoom_enabled || !tgu_zoom_points.has(e.pointerId)) return;
    
    tgu_zoom_points.set(e.pointerId, e);
    
    if (tgu_zoom_points.size === 1) {
        const dx = e.clientX - tgu_zoom_startPoint.x;
        const dy = e.clientY - tgu_zoom_startPoint.y;
        if (Math.hypot(dx, dy) > tgu_zoom_PAN_THRESHOLD) {
            tgu_zoom_didPan = true;
            tgu_zoom_posX = tgu_zoom_startPos.x + dx;
            tgu_zoom_posY = tgu_zoom_startPos.y + dy;
            tgu_zoom_applyTransform();
        }
    } else if (tgu_zoom_points.size === 2) {
        tgu_zoom_didPan = true;
        const p = Array.from(tgu_zoom_points.values());
        const curD = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
        const mX = (p[0].clientX + p[1].clientX) / 2;
        const mY = (p[0].clientY + p[1].clientY) / 2;
        if (tgu_zoom_iDist > 0) {
            const s = Math.max(tgu_zoom_MIN_SCALE, Math.min(tgu_zoom_MAX_SCALE, tgu_zoom_iScale * (curD / tgu_zoom_iDist)));
            tgu_zoom_posX = mX - (tgu_zoom_iMid.x - tgu_zoom_iPos.x) * (s / tgu_zoom_iScale);
            tgu_zoom_posY = mY - (tgu_zoom_iMid.y - tgu_zoom_iPos.y) * (s / tgu_zoom_iScale);
            tgu_zoom_scale = s;
            tgu_zoom_applyTransform();
        }
    }
}

function tgu_zoom_handlePointerEnd(e) {
    tgu_zoom_points.delete(e.pointerId);
    if (tgu_zoom_points.size === 1) {
        const rem = tgu_zoom_points.values().next().value;
        tgu_zoom_startPoint = { x: rem.clientX, y: rem.clientY };
        tgu_zoom_startPos = { x: tgu_zoom_posX, y: tgu_zoom_posY };
    }
    if (tgu_zoom_points.size < 2) tgu_zoom_iDist = 0;
}

function tgu_zoom_handleWheel(e) {
    const editor = document.getElementById('editor');
    if (!tgu_zoom_enabled || editor?.classList.contains('open') || e.target.closest('.modal-header, .modal-window')) return;
    
    e.preventDefault();
    const d = e.deltaY > 0 ? tgu_zoom_WHEEL_DOWN_FACTOR : tgu_zoom_WHEEL_UP_FACTOR;
    const s = Math.max(tgu_zoom_MIN_SCALE, Math.min(tgu_zoom_MAX_SCALE, tgu_zoom_scale * d));
    tgu_zoom_posX = e.clientX - (e.clientX - tgu_zoom_posX) * (s / tgu_zoom_scale);
    tgu_zoom_posY = e.clientY - (e.clientY - tgu_zoom_posY) * (s / tgu_zoom_scale);
    tgu_zoom_scale = s;
    tgu_zoom_applyTransform();
}

function tgu_zoom_handleClickAfterPan(e) {
    if (tgu_zoom_didPan) {
        e.stopImmediatePropagation();
        tgu_zoom_didPan = false;
    }
}

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
