/**
 * @file tgu-utils.js
 * @description Utility functions for date formatting, color operations, and text escaping.
 */

// ===== Constants =====

/**
 * Color threshold for white detection (0-255 per channel).
 * Colors above this threshold on all channels are considered "white".
 */
const tgu_utils_WHITE_THRESHOLD = 250;

// ===== Date Utilities =====

/**
 * Extracts a Date object from a storage key string.
 * @param {string} key - Storage key, e.g., "SET:name:D_YYYY-MM-DD"
 * @returns {Date}
 */
function tgu_utils_parseKeyDate(key) {
    const cleanKey = key.replace(
        new RegExp(`^${tgu_store_PREFIX.SET}[^:]+${tgu_store_PREFIX.SEP}`), 
        ''
    );
    const dateStr = cleanKey.substring(2); // Remove 'D_' prefix
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Formats year, month, day into YYYY-MM-DD string.
 * @param {number} year
 * @param {number} month (1-12)
 * @param {number} day
 * @returns {string}
 */
function tgu_utils_formatDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Generates full storage key for a diary entry date.
 * @param {number} year
 * @param {number} month (1-12)
 * @param {number} day
 * @param {string} [currentSet] - Set name; uses tgu_store_getCurrentSet() if omitted
 * @returns {string}
 */
function tgu_utils_getStorageKey(year, month, day, currentSet = null) {
    const dateKey = tgu_utils_formatDateKey(year, month, day);
    const setPrefix = (currentSet || tgu_store_getCurrentSet()) === tgu_main_DEFAULT_SET 
        ? '' 
        : `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}`;
    return `${setPrefix}${tgu_store_PREFIX.CONTENT}${dateKey}`;
}

/**
 * Returns array of storage keys for existing entries in current set.
 * @returns {string[]}
 */
function tgu_utils_getSetDataKeys() {
    return tgu_store_getExistingDateKeys().map(dateKey => {
        const [y, m, d] = dateKey.split('-').map(Number);
        return tgu_utils_getStorageKey(y, m, d);
    });
}

// ===== Color Utilities =====

/**
 * Determines whether white or black text should be used based on background color luminance.
 * @param {string} hex - Hex color string
 * @returns {string} - '#ffffff' (white text) or '#000000' (black text)
 */
function tgu_utils_getContrastColor(hex) {
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

/**
 * Checks if a color is too light (near white) for visibility.
 * @param {string} hex - Hex color string
 * @returns {boolean}
 */
function tgu_utils_isColorNearWhite(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r > tgu_utils_WHITE_THRESHOLD && 
           g > tgu_utils_WHITE_THRESHOLD && 
           b > tgu_utils_WHITE_THRESHOLD;
}

// ===== Text Utilities =====

/**
 * Escapes HTML special characters for safe innerHTML insertion.
 * @param {string} text
 * @returns {string}
 */
function tgu_utils_escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}
