/**
 * @file tgu-grid.js
 * @description Grid rendering for the calendar view.
 */

// ===== Grid Constants =====

/** Maximum cells per month */
const tgu_grid_MAX_CELLS = 37;

/** Number of months in a year */
const tgu_grid_MONTHS = 12;

/** Month names for display */
const tgu_grid_MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Week day names for display */
const tgu_grid_WEEK_NAMES = ['S','M','T','W','T','F','S'];

// ===== Grid Functions =====

/**
 * Rebuilds the calendar grid for a given year.
 * @param {HTMLElement} container - The grid container element.
 * @param {number} year - Year to display.
 * @param {string} [searchTerm] - Optional search filter.
 */
function tgu_grid_rebuild(container, year, searchTerm) {
    const fragment = document.createDocumentFragment();
    container.textContent = '';
    const yearDisplay = tgu_dom_get('currentYearDisplay');
    if (yearDisplay) yearDisplay.textContent = year;
    
    const now = new Date();
    const todayDateKey = tgu_utils_formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    container.style.gridTemplateColumns = `repeat(${tgu_grid_MAX_CELLS}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${tgu_grid_MONTHS}, 1fr)`;
    
    for (let m = 0; m < tgu_grid_MONTHS; m++) {
        const fOffset = new Date(year, m, 1).getDay();
        const dInMonth = new Date(year, m + 1, 0).getDate();
        const row = tgu_grid_MONTHS - m;
        const lGap = fOffset;
        const rGap = tgu_grid_MAX_CELLS - (fOffset + dInMonth);
        
        if (lGap >= rGap && lGap > 0) {
            tgu_grid_createHeader(tgu_grid_MONTH_NAMES[m], row, row + 1, 1, lGap + 1, false, fragment, 'tgu-month tgu-month-left');
        } else if (rGap > 0) {
            tgu_grid_createHeader(tgu_grid_MONTH_NAMES[m], row, row + 1, fOffset + dInMonth + 1, tgu_grid_MAX_CELLS + 1, false, fragment, 'tgu-month tgu-month-right');
        }
        
        for (let d = 1; d <= dInMonth; d++) {
            const dKey = tgu_utils_formatDateKey(year, m + 1, d);
            const dObj = new Date(year, m, d);
            const entry = tgu_store_getEntry(dKey);
            const sKey = tgu_utils_getStorageKey(year, m + 1, d);
            const el = document.createElement('div');
            const col = fOffset + d;
            
            el.className = 'tgu-cell';
            el.style.gridRow = row;
            el.style.gridColumn = col;
            el.dataset.r = row;
            el.dataset.c = col;
            el.tabIndex = 0;
            el.dataset.k = sKey;
            el.dataset.date = dKey;
            
            const span = document.createElement('span');
            span.textContent = d;
            const small = document.createElement('small');
            small.textContent = tgu_grid_WEEK_NAMES[(col - 1) % 7];
            
            el.append(span, small);
            
            if (dObj.getDay() === 0) el.classList.add('sun');
            el.classList.add((dObj > todayStart) ? 'tgu-future' : 'tgu-past');
            if (entry.text) el.classList.add('hc');
            if (searchTerm && entry.text.toLowerCase().includes(searchTerm)) el.classList.add('sm');
            if (dKey === todayDateKey) el.classList.add('tdy');
            if (entry.color) el.style.setProperty('--dot', entry.color);
            
            fragment.appendChild(el);
        }
    }
    
    container.appendChild(fragment);
}

/**
 * Creates a header cell in the grid.
 * @param {string} txt - Header text.
 * @param {number} rS - Row start.
 * @param {number} rE - Row end.
 * @param {number} cS - Column start.
 * @param {number} cE - Column end.
 * @param {boolean} [isS] - Whether styled specially.
 * @param {HTMLElement} [target] - Target container (defaults to app).
 * @param {string} [cls] - CSS class.
 */
function tgu_grid_createHeader(txt, rS, rE, cS, cE, isS = false, target = null, cls = 'tgu-header') {
    const container = target || tgu_dom_get('app') || document.body;
    const h = document.createElement('div');
    h.className = cls;
    if (isS) h.classList.add('s');
    h.style.gridRowStart = rS;
    h.style.gridRowEnd = rE;
    h.style.gridColumnStart = cS;
    h.style.gridColumnEnd = cE;
    
    if (cls.includes('tgu-month')) {
        const s = document.createElement('span');
        s.textContent = String(txt);
        h.appendChild(s);
    } else {
        h.textContent = String(txt);
    }
    
    container.appendChild(h);
}
