let zoomEnabled = true;
let isZoomedInHistory = false;
let scale = 1, posX = 0, posY = 0, didPan = false;

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

function applyTransform() {
    if (!app) return;
    app.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;

    const currentlyZoomed = (scale !== 1 || posX !== 0 || posY !== 0);
    const resetBtn = document.getElementById('reset-zoom-btn');
    if (resetBtn) resetBtn.classList.toggle('hidden', !currentlyZoomed);

    if (currentlyZoomed && !isZoomedInHistory) {
        isZoomedInHistory = true;
        history.pushState({ zoom: true }, "", "#zoom");
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
        didPan = false;
        if (!zoomEnabled || (editor && editor.classList.contains('open'))) return;
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
        if (!zoomEnabled || (editor && editor.classList.contains('open'))) return;
        if (e.target.closest('.modal-header, .modal-window')) return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.2, Math.min(5, scale * delta));

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