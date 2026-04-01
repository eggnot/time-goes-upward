/**
 * @file tgu-state.js
 * @description Cell state management and search/tooltip logic.
 */

// ===== Constants =====

/** Maximum length for tooltip content display */
const tgu_state_TOOLTIP_MAX_LEN = 600;

// ===== Functions =====

/**
 * Refreshes the visual classes and dots on the grid based on current data and search.
 * @param {string} [searchTerm] - Current search term.
 * @returns {boolean} Whether any cell matches the current search term.
 */
function tgu_state_updateCellStates(searchTerm = "") {
    const now = new Date();
    const todayDateKey = tgu_utils_formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);
    let foundAny = false;

    tgu_dom_getAll('.tgu-cell').forEach(el => {
        const dateKey = el.dataset.date;
        const dateObj = tgu_utils_parseKeyDate(el.dataset.k);
        const entry = tgu_store_getEntry(dateKey);

        el.classList.toggle('hc', !!entry.text);
        el.classList.toggle('tdy', dateKey === todayDateKey);
        el.classList.toggle('tgu-past', dateObj < todayStart);

        const isMatch = searchTerm && entry.text.toLowerCase().includes(searchTerm);
        el.classList.toggle('sm', !!isMatch);
        if (isMatch) foundAny = true;
        if (entry.color) el.style.setProperty('--dot', entry.color);
        else el.style.removeProperty('--dot');
    });
    return foundAny;
}

/**
 * Filters grid cells based on a search query.
 * @param {string} query
 * @returns {string} The processed search term.
 */
function tgu_state_handleSearch(query) {
    const trimmed = query.trim();
    const searchTerm = trimmed.length > 2 ? trimmed.toLowerCase() : "";
    const foundAny = tgu_state_updateCellStates(searchTerm);
    const clearBtn = tgu_dom_get('clearSearchBtn');
    const searchBar = tgu_dom_get('searchBar');
    if (clearBtn) clearBtn.classList.toggle('hidden', query.length === 0);
    if (searchBar) searchBar.classList.toggle('search-found', !!(searchTerm && foundAny));
    return searchTerm;
}

/**
 * Clears search state and input.
 * @returns {void}
 */
function tgu_state_clearSearch() {
    const searchBar = tgu_dom_get('searchBar');
    if (searchBar) {
        searchBar.value = "";
        tgu_state_handleSearch("");
    }
}

/**
 * Shows the hovering tooltip for a cell.
 * @param {MouseEvent|PointerEvent} e - Mouse/pointer event.
 * @param {string} key - Storage key.
 * @param {string} [searchTerm] - Current search term for highlighting.
 * @returns {void}
 */
function tgu_state_showTooltip(e, key, searchTerm = "") {
    const dateKey = key.substring(key.indexOf(tgu_store_PREFIX.CONTENT) + tgu_store_PREFIX.CONTENT.length);
    const entry = tgu_store_getEntry(dateKey);
    if (!entry.text) return tgu_state_hideTooltip();

    const tooltip = tgu_dom_get('tooltip');
    if (!tooltip) return;
    let displayContent = entry.text;
    if (displayContent.length > tgu_state_TOOLTIP_MAX_LEN) {
        displayContent = displayContent.substring(0, tgu_state_TOOLTIP_MAX_LEN) + '...';
    }

    if (searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        tooltip.innerHTML = tgu_utils_escapeHtml(displayContent)
            .replace(regex, '<mark>$1</mark>');
    } else {
        tooltip.textContent = displayContent;
    }

    tooltip.classList.remove('hidden');
    tgu_state_moveTooltip(e);
}

/**
 * Positions the tooltip relative to the cursor.
 * @param {MouseEvent|PointerEvent} e - Mouse/pointer event.
 * @returns {void}
 */
function tgu_state_moveTooltip(e) {
    const tooltip = tgu_dom_get('tooltip');
    if (!tooltip) return;
    const offset = 15;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (e.clientX > vw / 2) {
        tooltip.style.left = 'auto';
        tooltip.style.right = (vw - e.clientX + offset) + 'px';
    } else {
        tooltip.style.right = 'auto';
        tooltip.style.left = (e.clientX + offset) + 'px';
    }

    if (e.clientY > vh / 2) {
        tooltip.style.top = 'auto';
        tooltip.style.bottom = (vh - e.clientY + offset) + 'px';
    } else {
        tooltip.style.bottom = 'auto';
        tooltip.style.top = (e.clientY + offset) + 'px';
    }
}

/**
 * Hides the tooltip.
 * @returns {void}
 */
function tgu_state_hideTooltip() {
    const tooltip = tgu_dom_get('tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}
