/**
 * @file tgu-store.js
 * @description Data persistence layer with localStorage operations and entry management.
 * Consolidated from separate storage/store modules for simplicity.
 */

// ===== localStorage Operations =====

/**
 * Retrieves a value from localStorage with auto-conversion.
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 * @private
 */
function tgu_store_get(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    // Auto-convert JSON, booleans, numbers
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    try { return JSON.parse(value); } catch { return value; }
}

/**
 * Saves a value to localStorage.
 * @param {string} key
 * @param {*} value
 * @private
 */
function tgu_store_set(key, value) {
    localStorage.setItem(key, String(value));
}

/**
 * Removes a key from localStorage.
 * @param {string} key
 * @private
 */
function tgu_store_remove(key) {
    localStorage.removeItem(key);
}

/**
 * Retrieves all keys matching a prefix.
 * @param {string} prefix
 * @returns {string[]}
 * @private
 */
function tgu_store_getKeysWithPrefix(prefix) {
    return Object.keys(localStorage).filter(k => k.startsWith(prefix));
}

/**
 * Clears all localStorage.
 * @private
 */
function tgu_store_clearLocalStorage() {
    localStorage.clear();
}

// ===== Storage Constants =====

/**
 * Storage key prefix patterns for organizing keys
 */
const tgu_store_PREFIX = {
    CONTENT: 'D_',
    COLOR: 'C_',
    SET: 'SET:',
    SEP: ':'
};

/**
 * localStorage key names for global and set-specific settings
 */
const tgu_store_KEYS = {
    SETS: 'tgu_sets',
    CURRENT_SET: 'tgu_current_set',
    BG_ANIM: 'tgu_global_bg_anim',
    FONT_SIZE: 'tgu_global_font_size',
    MODAL_OPACITY: 'tgu_global_modal_opacity',
    OPACITY_PAST: 'tgu_global_opacity_past',
    OPACITY_FUTURE: 'tgu_global_opacity_future',
    ZOOM_ENABLED: 'tgu_global_zoom_enabled'
};

// ===== Data Management Functions =====

/**
 * @typedef {Object} DayData
 * @property {string} text - Diary content
 * @property {string} color - Hex color for the dot (e.g., "#RRGGBB")
 */

/**
 * Generates a namespaced storage key for a specific date and type within the current set.
 * @private
 * @param {string} dateKey - Date in YYYY-MM-DD format.
 * @param {'CONTENT'|'COLOR'} type - Type of data (content or color).
 * @returns {string} The full localStorage key.
 */
function tgu_store_getPrefixedKey(dateKey, type) {
    const currentSet = tgu_store_getCurrentSet();
    const setPrefix = currentSet === tgu_main_DEFAULT_SET 
        ? '' 
        : `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}`;
    const typePrefix = tgu_store_PREFIX[type];
    return `${setPrefix}${typePrefix}${dateKey}`;
}

/**
 * Generates a namespaced storage key for a set-specific setting.
 * @private
 * @param {string} settingName - Name of the setting (e.g., 'cfg_bg-content').
 * @returns {string} The full localStorage key.
 */
function tgu_store_getSetSettingKey(settingName) {
    const currentSet = tgu_store_getCurrentSet();
    return `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}${settingName}`;
}

/**
 * Retrieves unified data (text and color) for a specific date.
 * Returns empty values if data is corrupted or missing.
 * @param {string} dateKey - Date in YYYY-MM-DD format.
 * @returns {DayData} An object containing text and color.
 */
function tgu_store_getEntry(dateKey) {
    return {
        text: tgu_store_get(tgu_store_getPrefixedKey(dateKey, 'CONTENT')) || "",
        color: tgu_store_get(tgu_store_getPrefixedKey(dateKey, 'COLOR')) || ""
    };
}

/**
 * Saves specific fields for a date. Only provided fields will be updated.
 * If a field's value is empty/undefined, it will be removed from storage.
 * @param {string} dateKey - Date in YYYY-MM-DD format.
 * @param {Partial<DayData>} data - Object with `text` and/or `color` properties to save.
 * @returns {void}
 */
function tgu_store_saveEntry(dateKey, data) {
    if (data.text !== undefined) {
        const key = tgu_store_getPrefixedKey(dateKey, 'CONTENT');
        if (data.text.trim()) tgu_store_set(key, data.text.trim());
        else tgu_store_remove(key);
    }
    if (data.color !== undefined) {
        const key = tgu_store_getPrefixedKey(dateKey, 'COLOR');
        if (data.color && !tgu_utils_isColorNearWhite(data.color)) tgu_store_set(key, data.color);
        else tgu_store_remove(key);
    }
}

/**
 * Gets all date keys (YYYY-MM-DD) for the current set that have content.
 * @returns {string[]} An array of date keys, sorted chronologically.
 */
function tgu_store_getExistingDateKeys() {
    const currentSet = tgu_store_getCurrentSet();
    const prefix = currentSet === tgu_main_DEFAULT_SET 
        ? tgu_store_PREFIX.CONTENT 
        : `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}${tgu_store_PREFIX.CONTENT}`;
    return tgu_store_getKeysWithPrefix(prefix)
        .map(k => k.substring(prefix.length)) // Extract YYYY-MM-DD part
        .sort();
}

/**
 * Clears all data associated with a specific set.
 * @param {string} setName - The name of the set to clear.
 * @returns {void}
 */
function tgu_store_clearSetData(setName) {
    const prefix = `${tgu_store_PREFIX.SET}${setName}${tgu_store_PREFIX.SEP}`;
    tgu_store_getKeysWithPrefix(prefix).forEach(k => tgu_store_remove(k));
}

/**
 * Gets all sets defined in the app.
 * @returns {string[]}
 */
function tgu_store_getSets() {
    return tgu_store_get(tgu_store_KEYS.SETS, [tgu_main_DEFAULT_SET]);
}

/**
 * Saves the list of defined sets.
 * @param {string[]} setsArray
 * @returns {void}
 */
function tgu_store_saveSets(setsArray) {
    tgu_store_set(tgu_store_KEYS.SETS, JSON.stringify(setsArray));
}

/**
 * Gets the currently active set.
 * @returns {string}
 */
function tgu_store_getCurrentSet() {
    return tgu_store_get(tgu_store_KEYS.CURRENT_SET) || tgu_main_DEFAULT_SET;
}

/**
 * Sets the currently active set.
 * @param {string} setName
 * @returns {void}
 */
function tgu_store_setCurrentSet(setName) {
    console.log(`[tgu_store] setCurrentSet: "${setName}"`);
    tgu_store_set(tgu_store_KEYS.CURRENT_SET, setName);
}

/**
 * Gets a global (app-wide) setting.
 * Returns default if data is corrupted or missing.
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function tgu_store_getGlobalSetting(key, defaultValue) {
    try {
        return tgu_store_get(key, defaultValue);
    } catch (e) {
        console.warn(`[tgu_store] Corrupt global setting "${key}", using default`);
        return defaultValue;
    }
}

/**
 * Saves a global (app-wide) setting.
 * @param {string} key
 * @param {*} value
 * @returns {void}
 */
function tgu_store_saveGlobalSetting(key, value) {
    tgu_store_set(key, String(value));
}

/**
 * Gets a set-specific setting.
 * Returns null if data is corrupted or missing.
 * @param {string} settingName
 * @returns {string|null}
 */
function tgu_store_getSetSetting(settingName) {
    try {
        const value = tgu_store_get(tgu_store_getSetSettingKey(settingName));
        return value || null;
    } catch (e) {
        console.warn(`[tgu_store] Corrupt set setting "${settingName}"`);
        return null;
    }
}

/**
 * Saves a set-specific setting.
 * @param {string} settingName
 * @param {*} value
 * @returns {void}
 */
function tgu_store_saveSetSetting(settingName, value) {
    tgu_store_set(tgu_store_getSetSettingKey(settingName), value);
}

/**
 * Removes a set-specific setting.
 * @param {string} settingName
 * @returns {void}
 */
function tgu_store_removeSetSetting(settingName) {
    tgu_store_remove(tgu_store_getSetSettingKey(settingName));
}

/**
 * Clears all localStorage.
 * @returns {void}
 */
function tgu_store_clearAllLocalStorage() {
    tgu_store_clearLocalStorage();
}

/**
 * Validates localStorage format and detects corrupted/outdated keys.
 * Logs warnings for unexpected data without removing it (graceful degradation).
 * @returns {Object} Summary with {isClean: boolean, orphanedKeys: string[], issueCount: number}
 */
function tgu_store_validateStorageFormat() {
    const orphaned = [];
    const validPatterns = [
        /^D_\d{4}-\d{2}-\d{2}$/,           // Data: D_YYYY-MM-DD
        /^C_\d{4}-\d{2}-\d{2}$/,           // Color: C_YYYY-MM-DD
        /^SET:[^:]+:D_\d{4}-\d{2}-\d{2}$/, // Set data: SET:name:D_YYYY-MM-DD
        /^SET:[^:]+:C_\d{4}-\d{2}-\d{2}$/, // Set color: SET:name:C_YYYY-MM-DD
        /^SET:[^:]+:.+$/,                  // Set settings: SET:name:anything
        /^tgu_/                            // App settings: tgu_*
    ];

    Object.keys(localStorage).forEach(key => {
        const isValid = validPatterns.some(p => p.test(key));
        if (!isValid) {
            orphaned.push(key);
            console.warn(`[tgu_store] Orphaned/corrupted key detected: "${key}"`);
        }
    });

    const summary = {
        isClean: orphaned.length === 0,
        orphanedKeys: orphaned,
        issueCount: orphaned.length
    };

    if (!summary.isClean) {
        console.warn(`[tgu_store] Found ${orphaned.length} corrupted/outdated keys. Data will be ignored.`);
    }

    return summary;
}

/**
 * Fills random diary data for testing/demo.
 * @param {number} [year] - Year to fill; defaults to current year.
 */
function tgu_store_fillRandomData(year = new Date().getFullYear()) {
    console.log(`[tgu_store] fillRandomData for year: ${year}, set: "${tgu_store_getCurrentSet()}"`);
    const lorem = "you are beautiful beast and i love you".split(' ');
    for (let i = 0; i < 5; i++) {
        const m = Math.floor(Math.random() * 12) + 1;
        const d = Math.floor(Math.random() * 28) + 1;
        const txt = Array.from({length: 10}, () => lorem[Math.floor(Math.random() * lorem.length)]).join(' ');
        const dateKey = tgu_utils_formatDateKey(year, m, d);
        tgu_store_saveEntry(dateKey, { text: txt });
    }
}

/**
 * Gets all entries across all sets for export.
 * @returns {Array<{set: string, date: string, color: string, content: string}>}
 */
function tgu_store_getAllDataForExport() {
    const entries = [];
    tgu_store_getKeysWithPrefix(tgu_store_PREFIX.CONTENT).forEach(k => {
        const parts = k.split(tgu_store_PREFIX.SEP);
        const dateKey = parts[parts.length - 1].substring(2);
        const set = k.startsWith(tgu_store_PREFIX.SET) ? parts[1] : tgu_main_DEFAULT_SET;
        const entry = tgu_store_getEntry(dateKey);
        entries.push({ set, date: dateKey, color: entry.color, content: entry.text });
    });
    return entries;
}

/**
 * Imports diary entries.
 * @param {Array<{set: string, date: string, color: string, content: string}>} data
 */
function tgu_store_importData(data) {
    let allSets = tgu_store_getSets();
    data.forEach(e => {
        if (!allSets.includes(e.set)) allSets.push(e.set);
        const currentSetBackup = tgu_store_getCurrentSet();
        tgu_store_setCurrentSet(e.set);
        tgu_store_saveEntry(e.date, { text: e.content, color: e.color });
        tgu_store_setCurrentSet(currentSetBackup);
    });
    tgu_store_saveSets(allSets);
}
