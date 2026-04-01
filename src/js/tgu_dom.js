/**
 * @file tgu_dom.js
 * @description Centralized DOM element registry. Eliminates magic strings and provides
 * consistent access to frequently-used elements with caching for performance.
 */

// ===== Element Registry =====

/**
 * Element ID registry. Provides a single source of truth for all element identifiers.
 * Adds type hint clarity and prevents typos in string literals.
 */
const tgu_dom_ids = {
    // Main view
    app: 'app',
    navBar: 'nav-bar',
    currentYearDisplay: 'current-year-display',
    prevYearBtn: 'prev-year-btn',
    nextYearBtn: 'next-year-btn',
    toggleNavBtn: 'toggle-nav-btn',
    openHelpBtn: 'open-help-btn',
    openSettingsBtn: 'open-settings-btn',
    resetZoomBtn: 'reset-zoom-btn',

    // Search bar
    searchBar: 'search-bar',
    clearSearchBtn: 'clear-search',

    // Editor modal
    editor: 'editor',
    editorDateLabel: 'editor-date-label',
    editorSettingsBtn: 'editor-settings-btn',
    diaryText: 'diary-text',
    cellColorPicker: 'cell-color-picker',
    prevEntryBtn: 'prev-entry-btn',
    nextEntryBtn: 'next-entry-btn',

    // Tooltip
    tooltip: 'tooltip',

    // Settings modal
    settingsModal: 'settings-modal',
    bgAnimationToggle: 'bg-animation-toggle',
    cfgZoomEnabled: 'cfg-zoom-enabled',
    cfgOpacityPast: 'cfg-opacity-past',
    cfgOpacityFuture: 'cfg-opacity-future',
    cfgFontSize: 'cfg-font-size',
    cfgModalOpacity: 'cfg-modal-opacity',
    cfgBgContent: 'cfg-bg-content',
    cfgPrimary: 'cfg-primary',
    cfgBgTooltip: 'cfg-bg-tooltip',
    addSetBtn: 'add-set-btn',
    deleteSetBtn: 'delete-set-btn',
    newSetNameInput: 'new-set-name',

    // Data import/export
    exportBtn: 'export-btn',
    importTriggerBtn: 'import-trigger-btn',
    importFile: 'import-file',
    debugLuckyBtn: 'debug-lucky-btn',
    dangerWipeBtn: 'danger-wipe-btn',

    // Modals
    helpModal: 'help-modal',
};

/**
 * Cache for frequently accessed elements. Populated on-demand to avoid excessive DOM queries.
 * @type {Map<string, Element>}
 */
const tgu_dom_cache = new Map();

// ===== Public API =====

/**
 * Gets a DOM element by registry key, with automatic caching.
 * @param {string} key - The registry key (e.g., 'searchBar')
 * @returns {Element|null} The cached or newly-fetched element, or null if not found
 */
function tgu_dom_get(key) {
    if (tgu_dom_cache.has(key)) {
        return tgu_dom_cache.get(key);
    }
    const id = tgu_dom_ids[key];
    if (!id) {
        console.warn(`[tgu_dom] Unknown registry key: ${key}`);
        return null;
    }
    const el = document.getElementById(id);
    if (el) {
        tgu_dom_cache.set(key, el);
    }
    return el;
}

/**
 * Gets multiple elements by a CSS selector. Useful for querying by class or data-attribute.
 * @param {string} selector - CSS selector string
 * @returns {NodeList} Matched elements
 */
function tgu_dom_getAll(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Clears the element cache. Useful after major DOM restructuring.
 */
function tgu_dom_clearCache() {
    tgu_dom_cache.clear();
}

/**
 * Verifies that all registered IDs exist in the DOM. Useful for debugging.
 * @returns {Object} Report with present and missing keys
 */
function tgu_dom_validateRegistry() {
    const report = { present: [], missing: [] };
    for (const [key, id] of Object.entries(tgu_dom_ids)) {
        if (document.getElementById(id)) {
            report.present.push(key);
        } else {
            report.missing.push(key);
        }
    }
    return report;
}
