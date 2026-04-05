// ===== Storage Constants =====

const tgu_store_TYPE = {
    TXT: 'TXT',
    COL: 'COL'
};

const tgu_store_KEYS = {
    SETS: 'cfg:sets',
    CUR_SET: 'cfg:cur_set',
    BG_ANIM: 'cfg:bg_anim',
    FONT_SIZE: 'cfg:font_size',
    MODAL_OPACITY: 'cfg:m_op',
    OPACITY_PAST: 'cfg:p_op',
    OPACITY_FUTURE: 'cfg:f_op',
    ZOOM_ENABLED: 'cfg:zoom'
};

// ===== Data Management Functions =====

/** @description Gets value for date, type, and optional set */
const tgu_store_get = (date, type, set = tgu_store_getCurrentSet()) => 
    localStorage.getItem(`${date}:${type}:${set}`) || "";

/** @description Sets value for date, type, and optional set. Removes key if val is empty. */
const tgu_store_set = (date, type, val, set = tgu_store_getCurrentSet()) => {
    const key = `${date}:${type}:${set}`;
    const cleanVal = val?.trim();
    
    if (!cleanVal || (type === tgu_store_TYPE.COL && tgu_utils_isColorNearWhite(cleanVal))) {
        localStorage.removeItem(key);
        return;
    }
    
    localStorage.setItem(key, cleanVal);
};

/** @description Returns array of all YYYY-MM-DD keys for the current set */
const tgu_store_getExistingDateKeys = () => {
    const s = tgu_store_getCurrentSet();
    return Object.keys(localStorage)
        .filter(k => k.endsWith(`:${tgu_store_TYPE.TXT}:${s}`))
        .map(k => k.split(':')[0])
        .sort();
};

/** @description Deletes all entry data and settings for a specific set */
const tgu_store_clearSetData = (setName) => {
    Object.keys(localStorage).forEach(k => {
        if (k.endsWith(`:${setName}`) || k.startsWith(`set:${setName}:`)) {
            localStorage.removeItem(k);
        }
    });
};

/** @description Returns list of all defined sets */
const tgu_store_getSets = () => JSON.parse(localStorage.getItem(tgu_store_KEYS.SETS)) || [tgu_main_DEFAULT_SET];

/** @description Saves the list of set names */
const tgu_store_saveSets = (sets) => localStorage.setItem(tgu_store_KEYS.SETS, JSON.stringify(sets));

/** @description Returns the name of the currently active set */
const tgu_store_getCurrentSet = () => localStorage.getItem(tgu_store_KEYS.CUR_SET) || tgu_main_DEFAULT_SET;

/** @description Switches the active set */
const tgu_store_setCurrentSet = (s) => localStorage.setItem(tgu_store_KEYS.CUR_SET, s);

/** @description Retrieves a global app setting with type casting */
const tgu_store_getGlobalSetting = (key, def) => {
    const val = localStorage.getItem(key);
    if (val === null) return def;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return isNaN(val) ? val : Number(val);
};

/** @description Saves a global app setting */
const tgu_store_saveGlobalSetting = (key, val) => localStorage.setItem(key, String(val));

/** @description Gets a setting specific to the current set */
const tgu_store_getSetSetting = (key) => {
    const s = tgu_store_getCurrentSet();
    return localStorage.getItem(`set:${s}:${key}`);
};

/** @description Saves a setting specific to the current set */
const tgu_store_saveSetSetting = (key, val) => {
    const s = tgu_store_getCurrentSet();
    localStorage.setItem(`set:${s}:${key}`, val);
};

/** @description Wipes everything */
const tgu_store_clearAll = () => localStorage.clear();
