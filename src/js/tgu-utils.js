// ===== Constants =====

const tgu_utils_WHITE_THRESHOLD = 250;

// ===== Date Utilities =====

function tgu_utils_parseKeyDate(key) {
    const cleanKey = key.replace(
        new RegExp(`^${tgu_store_PREFIX.SET}[^:]+${tgu_store_PREFIX.SEP}`), 
        ''
    );
    const dateStr = cleanKey.substring(2); // Remove 'D_' prefix
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function tgu_utils_formatDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function tgu_utils_getStorageKey(year, month, day, currentSet = null) {
    const dateKey = tgu_utils_formatDateKey(year, month, day);
    const setPrefix = (currentSet || tgu_store_getCurrentSet()) === tgu_main_DEFAULT_SET 
        ? '' 
        : `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}`;
    return `${setPrefix}${tgu_store_PREFIX.CONTENT}${dateKey}`;
}

function tgu_utils_getSetDataKeys() {
    return tgu_store_getExistingDateKeys().map(dateKey => {
        const [y, m, d] = dateKey.split('-').map(Number);
        return tgu_utils_getStorageKey(y, m, d);
    });
}

// ===== Color Utilities =====

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

function tgu_utils_isColorNearWhite(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r > tgu_utils_WHITE_THRESHOLD && 
           g > tgu_utils_WHITE_THRESHOLD && 
           b > tgu_utils_WHITE_THRESHOLD;
}

// ===== Text Utilities =====

function tgu_utils_escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}
