// --- General UI Logic ---

function changeYear(delta) {
    curYear += delta;
    // if (typeof resetZoom === 'function') resetZoom();
    renderGrid();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal.classList.contains('open')) lastFocus = document.activeElement;
    modal.classList.add('open');
    const firstInput = modal.querySelector('button, input, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
    const hash = "#" + id.replace('-modal', '');
    history.pushState({modalOpen: id}, "", hash);
    updateToggleBtnVisibility();
}

function closeModal(id, goBack = true) {
    document.getElementById(id).classList.remove('open');
    updateToggleBtnVisibility();
    if (lastFocus) lastFocus.focus();
    if (goBack) history.back();
}

function updateToggleBtnVisibility() {
    const btn = document.getElementById('toggle-nav-btn');
    if (!btn) return;
    const anyOpen = !!document.querySelector('.modal-window.open');
    btn.classList.toggle('hidden', anyOpen);
}

function updateSetSelector() {
    const selectors = document.querySelectorAll('.set-selector-ui');
    if (selectors.length === 0) return;

    const optionsHtml = sets.map(s => {
        return `<option value="${s}" ${s === curSet ? 'selected' : ''}>${s}</option>`;
    }).join('');

    selectors.forEach(sel => {
        sel.innerHTML = optionsHtml;
    });

    const display = document.getElementById('current-set-display');
    if (display) display.textContent = curSet;
    const deleteBtn = document.getElementById('delete-set-btn');
    if (deleteBtn) deleteBtn.disabled = (curSet === DEFAULT_SET);
}

function switchSet(name) {
    const isEditorOpen = editor.classList.contains('open');
    if (isEditorOpen) saveCurrentEntry();

    curSet = name;
    localStorage.setItem(STORAGE_KEY_CURRENT_SET, name);
    applySetSettings();
    renderGrid();
    updateSetSelector();
    handleSearch(searchBar.value);

    if (isEditorOpen && editDate) {
        openEditor(editDate, getStorageKey(editDate.getFullYear(), editDate.getMonth() + 1, editDate.getDate()));
    }
}

function addNewSet() {
    const nameInput = document.getElementById('new-set-name');
    const name = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!name || sets.includes(name)) return alert("Invalid or duplicate name.");
    
    sets.push(name);
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
    nameInput.value = '';
    switchSet(name);
}

function deleteCurrentSet() {
    if (curSet === DEFAULT_SET) return alert("Cannot delete the default set.");
    if (!confirm(`Delete set "${curSet}" and ALL its data?`)) return;

    const prefix = `${KEY_PREFIX_SET}${curSet}${KEY_PREFIX_SEP}`;
    Object.keys(localStorage).forEach(k => { if (k.startsWith(prefix)) localStorage.removeItem(k); });

    sets = sets.filter(s => s !== curSet);
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
    switchSet(DEFAULT_SET);
}

function toggleAnimation(enabled, save = true) {
    document.body.classList.toggle('animate-bg', enabled);
    if (save) localStorage.setItem(STORAGE_KEY_BG_ANIM, enabled);
}

function updateFontSize(size, save = true) {
    document.documentElement.style.setProperty('--font-size', size + 'pt');
    if (save) localStorage.setItem(STORAGE_KEY_FONT_SIZE, size);
}

function updateModalOpacity(val, save = true) {
    document.documentElement.style.setProperty('--modal-opacity', val);
    if (save) localStorage.setItem(STORAGE_KEY_MODAL_OPACITY, val);
}

function updatePastOpacity(val, save = true) {
    document.documentElement.style.setProperty('--op-p', val);
    if (save) localStorage.setItem(STORAGE_KEY_OPACITY_PAST, val);
}

function updateFutureOpacity(val, save = true) {
    document.documentElement.style.setProperty('--op-f', val);
    if (save) localStorage.setItem(STORAGE_KEY_OPACITY_FUTURE, val);
}

function updateThemeColor(varName, value) {
    document.documentElement.style.setProperty(varName, value);
    localStorage.setItem(getSetKey('cfg_' + varName.replace('--', '')), value);
    if (varName === '--bg-content') {
        const contrast = getContrastColor(value);
        document.documentElement.style.setProperty('--text-on-content', contrast);
        updateSetSelector();
    }
}

function toggleNavBar() {
    const nav = document.querySelector('nav.modal-header');
    const btn = document.getElementById('toggle-nav-btn');
    if (!nav || !btn) return;

    const isHidden = nav.classList.toggle('nav-minimized');
    const toHide = nav.querySelectorAll('.header-nav, .header-center, .header-right');

    toHide.forEach(el => el.style.display = isHidden ? 'none' : '');

    if (isHidden) {
        nav.style.background = 'transparent';
        nav.style.border = 'none';
        nav.style.boxShadow = 'none';
        nav.style.position = 'absolute';
        nav.style.zIndex = '1000';
        btn.title = 'show navigation';
    } else {
        nav.style.background = '';
        nav.style.border = '';
        nav.style.boxShadow = '';
        nav.style.position = '';
        nav.style.zIndex = '';
        btn.title = 'hide navigation';
    }
}