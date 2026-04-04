// ===== localStorage Operations =====

function tgu_store_get(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    // Auto-convert JSON, booleans, numbers
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    try { return JSON.parse(value); } catch { return value; }
}

function tgu_store_set(key, value) {
    localStorage.setItem(key, String(value));
}

function tgu_store_remove(key) {
    localStorage.removeItem(key);
}

function tgu_store_getKeysWithPrefix(prefix) {
    return Object.keys(localStorage).filter(k => k.startsWith(prefix));
}

function tgu_store_clearLocalStorage() {
    localStorage.clear();
}

// ===== Storage Constants =====

const tgu_store_PREFIX = {
    CONTENT: 'D_',
    COLOR: 'C_',
    SET: 'SET:',
    SEP: ':'
};

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

function tgu_store_getPrefixedKey(dateKey, type) {
    const currentSet = tgu_store_getCurrentSet();
    const setPrefix = currentSet === tgu_main_DEFAULT_SET 
        ? '' 
        : `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}`;
    const typePrefix = tgu_store_PREFIX[type];
    return `${setPrefix}${typePrefix}${dateKey}`;
}

function tgu_store_getSetSettingKey(settingName) {
    const currentSet = tgu_store_getCurrentSet();
    return `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}${settingName}`;
}

function tgu_store_getEntry(dateKey) {
    return {
        text: tgu_store_get(tgu_store_getPrefixedKey(dateKey, 'CONTENT')) || "",
        color: tgu_store_get(tgu_store_getPrefixedKey(dateKey, 'COLOR')) || ""
    };
}

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

function tgu_store_getExistingDateKeys() {
    const currentSet = tgu_store_getCurrentSet();
    const prefix = currentSet === tgu_main_DEFAULT_SET 
        ? tgu_store_PREFIX.CONTENT 
        : `${tgu_store_PREFIX.SET}${currentSet}${tgu_store_PREFIX.SEP}${tgu_store_PREFIX.CONTENT}`;
    return tgu_store_getKeysWithPrefix(prefix)
        .map(k => k.substring(prefix.length)) // Extract YYYY-MM-DD part
        .sort();
}

function tgu_store_clearSetData(setName) {
    const prefix = `${tgu_store_PREFIX.SET}${setName}${tgu_store_PREFIX.SEP}`;
    tgu_store_getKeysWithPrefix(prefix).forEach(k => tgu_store_remove(k));
}

function tgu_store_getSets() {
    return tgu_store_get(tgu_store_KEYS.SETS, [tgu_main_DEFAULT_SET]);
}

function tgu_store_saveSets(setsArray) {
    tgu_store_set(tgu_store_KEYS.SETS, JSON.stringify(setsArray));
}

function tgu_store_getCurrentSet() {
    return tgu_store_get(tgu_store_KEYS.CURRENT_SET) || tgu_main_DEFAULT_SET;
}

function tgu_store_setCurrentSet(setName) {
    console.log(`[tgu_store] setCurrentSet: "${setName}"`);
    tgu_store_set(tgu_store_KEYS.CURRENT_SET, setName);
}

function tgu_store_getGlobalSetting(key, defaultValue) {
    return tgu_store_get(key, defaultValue);
}

function tgu_store_saveGlobalSetting(key, value) {
    tgu_store_set(key, String(value));
}

function tgu_store_getSetSetting(settingName) {
    return tgu_store_get(tgu_store_getSetSettingKey(settingName)) || null;
}

function tgu_store_saveSetSetting(settingName, value) {
    tgu_store_set(tgu_store_getSetSettingKey(settingName), value);
}

function tgu_store_removeSetSetting(settingName) {
    tgu_store_remove(tgu_store_getSetSettingKey(settingName));
}



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
