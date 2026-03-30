// --- General UI Logic ---

function changeYear(delta) {
    curYear += delta;
    if (typeof resetZoom === 'function') resetZoom();
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
}

function closeModal(id, goBack = true) {
    document.getElementById(id).classList.remove('open');
    if (lastFocus) lastFocus.focus();
    if (goBack) history.back();
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
    if (deleteBtn) deleteBtn.disabled = (curSet === 'def');
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
    if (curSet === 'def') return alert("Cannot delete the default set.");
    if (!confirm(`Delete set "${curSet}" and ALL its data?`)) return;

    const prefix = `${KEY_PREFIX_SET}${curSet}${KEY_PREFIX_SEP}`;
    Object.keys(localStorage).forEach(k => { if (k.startsWith(prefix)) localStorage.removeItem(k); });

    sets = sets.filter(s => s !== curSet);
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
    switchSet('def');
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

function updateGridOrientation(val, save = true) {
    gridOrientation = val;
    if (save) localStorage.setItem(STORAGE_KEY_GRID_ORIENTATION, val);
    renderGrid();
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