// ===== Constants =======

const tgu_state_SEARCH_MIN_LENGTH = 2;
const tgu_state_TOOLTIP_MAX_LEN = 600;
const tgu_state_TOOLTIP_OFFSET = 15;

// ===== Functions =====

function tgu_state_updateCellStates(searchTerm = "") {
    const now = new Date();
    const todayDateKey = tgu_utils_formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);
    let foundAny = false;

    document.querySelectorAll('.tgu-cell').forEach(el => {
        const dateKey = el.dataset.date;
        const dateObj = tgu_utils_parseKeyDate(dateKey);
        const txt = tgu_store_get(dateKey, tgu_store_TYPE.TXT);
        const col = tgu_store_get(dateKey, tgu_store_TYPE.COL);

        el.classList.toggle('hc', !!txt);
        el.classList.toggle('tdy', dateKey === todayDateKey);
        el.classList.toggle('tgu-past', dateObj < todayStart);

        const isMatch = searchTerm && txt.toLowerCase().includes(searchTerm);
        el.classList.toggle('sm', !!isMatch);
        if (isMatch) foundAny = true;
        if (col) el.style.setProperty('--dot', col);
        else el.style.removeProperty('--dot');
    });
    return foundAny;
}

function tgu_state_handleSearch(query) {
    const trimmed = query.trim();
    const searchTerm = trimmed.length > tgu_state_SEARCH_MIN_LENGTH ? trimmed.toLowerCase() : "";
    const foundAny = tgu_state_updateCellStates(searchTerm);
    const clearBtn = document.getElementById('clear-search');
    const searchBar = document.getElementById('search-bar');
    if (clearBtn) clearBtn.classList.toggle('hidden', query.length === 0);
    if (searchBar) searchBar.classList.toggle('search-found', !!(searchTerm && foundAny));
    return searchTerm;
}

function tgu_state_clearSearch() {
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.value = "";
        tgu_state_handleSearch("");
    }
}

function tgu_state_showTooltip(e, dateKey, searchTerm = "") {
    const txt = tgu_store_get(dateKey, tgu_store_TYPE.TXT);
    if (!txt) return tgu_state_hideTooltip();

    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    let displayContent = txt;
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

function tgu_state_moveTooltip(e) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const offset = tgu_state_TOOLTIP_OFFSET;
    
    // Horizontal positioning
    if (e.clientX > vw / 2) {
        tooltip.style.left = 'auto';
        tooltip.style.right = (vw - e.clientX + offset) + 'px';
    } else {
        tooltip.style.right = 'auto';
        tooltip.style.left = (e.clientX + offset) + 'px';
    }
    
    // Vertical positioning
    if (e.clientY > vh / 2) {
        tooltip.style.top = 'auto';
        tooltip.style.bottom = (vh - e.clientY + offset) + 'px';
    } else {
        tooltip.style.bottom = 'auto';
        tooltip.style.top = (e.clientY + offset) + 'px';
    }
}

function tgu_state_hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}
