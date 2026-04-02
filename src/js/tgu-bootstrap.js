// ===== Service Worker Registration =====

function tgu_bootstrap_registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('[tgu_bootstrap] Service Worker registered'))
            .catch(err => console.log('[tgu_bootstrap] Service Worker registration failed:', err));
    }
}

// ===== DOM Readiness =====

function tgu_bootstrap_onDOMReady() {
    // Register Service Worker (independent of app logic)
    tgu_bootstrap_registerServiceWorker();

    // Initialize the application
    tgu_main_init();

    // Set up pan/zoom interaction
    tgu_zoom_setupPanZoom();
}

// ===== Startup Hook =====

// Wait for DOM to be fully parsed before running app
document.addEventListener('DOMContentLoaded', tgu_bootstrap_onDOMReady);
