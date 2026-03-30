// --- Local Updates & Interaction Logic ---
const TOOLTIP_MAX_LEN = 600;

function updateCellStates() {
    const now = new Date();
    const todayKey = getStorageKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);
    let foundAny = false;

    document.querySelectorAll('.gc').forEach(el => {
        const key = el.dataset.k;
        const dateObj = parseKeyDate(key);
        const content = localStorage.getItem(key) || "";
        const color = localStorage.getItem(key.replace(KEY_PREFIX_CONTENT, KEY_PREFIX_COLOR));

        el.classList.toggle('hc', !!content);
        el.classList.toggle('tdy', key === todayKey);
        el.classList.toggle('pst', dateObj < todayStart);

        const isMatch = searchTerm && content.toLowerCase().includes(searchTerm);
        el.classList.toggle('sm', !!isMatch);
        if (isMatch) foundAny = true;
        if (color) el.style.setProperty('--dot', color);
        else el.style.removeProperty('--dot');
    });
    return foundAny;
}

function handleSearch(query) {
    const trimmed = query.trim();
    searchTerm = trimmed.length > 2 ? trimmed.toLowerCase() : "";
    const foundAny = updateCellStates();
    clearBtn.classList.toggle('hidden', query.length === 0);
    searchBar.classList.toggle('search-found', !!(searchTerm && foundAny));
}

function clearSearch() {
    searchBar.value = "";
    handleSearch("");
}

function showTooltip(e, key) {
    let content = localStorage.getItem(key);
    if (!content) return hideTooltip();

    if (content.length > TOOLTIP_MAX_LEN) content = content.substring(0, TOOLTIP_MAX_LEN) + '...';

    if (searchTerm) {
        const escaped = content.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        tooltip.innerHTML = escaped.replace(regex, '<mark>$1</mark>');
    } else {
        tooltip.textContent = content;
    }

    tooltip.classList.remove('hidden');
    moveTooltip(e);
}

function moveTooltip(e) {
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

function hideTooltip() {
    tooltip.classList.add('hidden');
}