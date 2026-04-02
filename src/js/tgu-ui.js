function tgu_ui_changeYear(delta) {
    const yearDisplay = document.getElementById('current-year-display');
    if (!yearDisplay) return;
    const curYear = parseInt(yearDisplay.textContent);
    yearDisplay.textContent = curYear + delta;
    tgu_main_renderGrid();
}

function tgu_ui_openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (!modal.classList.contains('open')) {
        window.lastFocus = document.activeElement;
    }
    modal.classList.add('open');
    const firstInput = modal.querySelector('button, input, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), tgu_main_FOCUS_DELAY_MS);
    history.pushState({modalOpen: id}, "", "#" + id.replace('-modal', ''));
    tgu_ui_updateToggleBtnVisibility();
}

function tgu_ui_closeModal(id, goBack = true) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
    tgu_ui_updateToggleBtnVisibility();
    if (window.lastFocus) window.lastFocus.focus();
    if (goBack) history.back();
}

function tgu_ui_updateToggleBtnVisibility() {
    const btn = document.getElementById('toggle-nav-btn');
    if (btn) btn.classList.toggle('hidden', !!document.querySelector('.modal-window.open'));
}

function tgu_ui_updateSetSelector() {
    const sets = tgu_store_getSets();
    const curSet = tgu_store_getCurrentSet();
    const selectors = document.querySelectorAll('.tgu-set-selector');
    const optionsHtml = sets.map(s => `<option value="${s}" ${s === curSet ? 'selected' : ''}>${s}</option>`).join('');
    selectors.forEach(sel => { sel.innerHTML = optionsHtml; });
    const deleteBtn = document.getElementById('delete-set-btn');
    if (deleteBtn) deleteBtn.disabled = (curSet === tgu_main_DEFAULT_SET);
}

function tgu_ui_switchSet(name) {
    console.log(`[tgu_ui] switchSet: "${name}"`);
    const editor = document.getElementById('editor');
    const isEditorOpen = editor?.classList.contains('open');
    if (isEditorOpen) tgu_editor_saveCurrentEntry();
    tgu_store_setCurrentSet(name);
    tgu_main_applySetSettings();
    tgu_main_renderGrid();
    tgu_ui_updateSetSelector();
    const searchBar = document.getElementById('search-bar');
    tgu_state_handleSearch(searchBar?.value || '');
    if (isEditorOpen && window.editDate) {
        tgu_editor_openEditor(window.editDate, 
            tgu_utils_getStorageKey(window.editDate.getFullYear(), window.editDate.getMonth() + 1, window.editDate.getDate()));
    }
}

function tgu_ui_addNewSet() {
    const nameInput = document.getElementById('new-set-name');
    if (!nameInput) return;
    const name = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!name || tgu_store_getSets().includes(name)) return alert("Invalid or duplicate name.");
    const sets = tgu_store_getSets();
    sets.push(name);
    tgu_store_saveSets(sets);
    nameInput.value = '';
    tgu_ui_switchSet(name);
}

function tgu_ui_deleteCurrentSet() {
    const curSet = tgu_store_getCurrentSet();
    if (curSet === tgu_main_DEFAULT_SET) return alert("Cannot delete the default set.");
    if (!confirm(`Delete set "${curSet}" and ALL its data?`)) return;
    tgu_store_clearSetData(curSet);
    const sets = tgu_store_getSets().filter(s => s !== curSet);
    tgu_store_saveSets(sets);
    tgu_ui_switchSet(tgu_main_DEFAULT_SET);
}

function tgu_ui_toggleAnimation(enabled) {
    document.body.classList.toggle('animate-bg', enabled);
    tgu_store_saveGlobalSetting(tgu_store_KEYS.BG_ANIM, enabled);
}

function tgu_ui_updateFontSize(size) {
    document.documentElement.style.setProperty('--font-size', size + 'pt');
    tgu_store_saveGlobalSetting(tgu_store_KEYS.FONT_SIZE, size);
}

function tgu_ui_updateModalOpacity(val) {
    document.documentElement.style.setProperty('--modal-opacity', val);
    tgu_store_saveGlobalSetting(tgu_store_KEYS.MODAL_OPACITY, val);
}

function tgu_ui_updatePastOpacity(val) {
    document.documentElement.style.setProperty('--op-p', val);
    tgu_store_saveGlobalSetting(tgu_store_KEYS.OPACITY_PAST, val);
}

function tgu_ui_updateFutureOpacity(val) {
    document.documentElement.style.setProperty('--op-f', val);
    tgu_store_saveGlobalSetting(tgu_store_KEYS.OPACITY_FUTURE, val);
}

function tgu_ui_updateThemeColor(varName, value) {
    document.documentElement.style.setProperty(varName, value);
    tgu_store_saveSetSetting('cfg_' + varName.replace('--', ''), value);
    if (varName === '--bg-content') {
        document.documentElement.style.setProperty('--text-on-content', tgu_utils_getContrastColor(value));
        tgu_ui_updateSetSelector();
    }
}

function tgu_ui_toggleNavBar() {
    const nav = document.querySelector('nav.modal-header');
    const btn = document.getElementById('toggle-nav-btn');
    if (!nav || !btn) return;
    const isHidden = nav.classList.toggle('nav-minimized');
    nav.querySelectorAll('.header-nav, .header-center, .header-right').forEach(el => el.classList.toggle('hidden', isHidden));
    if (isHidden) {
        Object.assign(nav.style, { background: 'transparent', border: 'none', boxShadow: 'none', position: 'absolute', zIndex: '10' });
        btn.title = 'show navigation';
    } else {
        Object.assign(nav.style, { background: '', border: '', boxShadow: '', position: '', zIndex: '' });
        btn.title = 'hide navigation';
    }
}
