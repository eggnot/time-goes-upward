/**
 * @file tgu-ui.js
 * @description UI interactions and settings management.
 */

/**
 * Changes the displayed year.
 * @param {number} delta - Year offset (+1 or -1).
 * @returns {void}
 */
function tgu_ui_changeYear(delta) {
    const yearDisplay = tgu_dom_get('currentYearDisplay');
    if (!yearDisplay) return;
    const curYear = parseInt(yearDisplay.textContent);
    yearDisplay.textContent = curYear + delta;
    tgu_main_renderGrid();
}

/**
 * Opens a modal dialog.
 * @param {string} id - Modal element ID (HTML id attribute).
 * @returns {void}
 */
function tgu_ui_openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (!modal.classList.contains('open')) {
        window.lastFocus = document.activeElement;
    }
    modal.classList.add('open');
    const firstInput = modal.querySelector('button, input, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
    history.pushState({modalOpen: id}, "", "#" + id.replace('-modal', ''));
    tgu_ui_updateToggleBtnVisibility();
}

/**
 * Closes a modal dialog.
 * @param {string} id - Modal element ID (HTML id attribute).
 * @param {boolean} [goBack] - Whether to trigger history.back().
 * @returns {void}
 */
function tgu_ui_closeModal(id, goBack = true) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
    tgu_ui_updateToggleBtnVisibility();
    if (window.lastFocus) window.lastFocus.focus();
    if (goBack) history.back();
}

/**
 * Updates visibility of the nav toggle button.
 * @returns {void}
 */
function tgu_ui_updateToggleBtnVisibility() {
    const btn = tgu_dom_get('toggleNavBtn');
    if (btn) btn.classList.toggle('hidden', !!document.querySelector('.modal-window.open'));
}

/**
 * Updates the set selector dropdown with available sets.
 * @returns {void}
 */
function tgu_ui_updateSetSelector() {
    const sets = tgu_store_getSets();
    const curSet = tgu_store_getCurrentSet();
    const selectors = tgu_dom_getAll('.tgu-set-selector');
    const optionsHtml = sets.map(s => `<option value="${s}" ${s === curSet ? 'selected' : ''}>${s}</option>`).join('');
    selectors.forEach(sel => { sel.innerHTML = optionsHtml; });
    const deleteBtn = tgu_dom_get('deleteSetBtn');
    if (deleteBtn) deleteBtn.disabled = (curSet === tgu_main_DEFAULT_SET);
}

/**
 * Switches to a different set.
 * @param {string} name - Set name.
 * @returns {void}
 */
function tgu_ui_switchSet(name) {
    console.log(`[tgu_ui] switchSet: "${name}"`);
    const editor = tgu_dom_get('editor');
    const isEditorOpen = editor?.classList.contains('open');
    if (isEditorOpen) tgu_editor_saveCurrentEntry();
    tgu_store_setCurrentSet(name);
    tgu_main_applySetSettings();
    tgu_main_renderGrid();
    tgu_ui_updateSetSelector();
    const searchBar = tgu_dom_get('searchBar');
    tgu_state_handleSearch(searchBar?.value || '');
    if (isEditorOpen && window.editDate) {
        tgu_editor_openEditor(window.editDate, 
            tgu_utils_getStorageKey(window.editDate.getFullYear(), window.editDate.getMonth() + 1, window.editDate.getDate()));
    }
}

/**
 * Adds a new set.
 * @returns {void}
 */
function tgu_ui_addNewSet() {
    const nameInput = tgu_dom_get('newSetNameInput');
    if (!nameInput) return;
    const name = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!name || tgu_store_getSets().includes(name)) return alert("Invalid or duplicate name.");
    const sets = tgu_store_getSets();
    sets.push(name);
    tgu_store_saveSets(sets);
    nameInput.value = '';
    tgu_ui_switchSet(name);
}

/**
 * Deletes the current set.
 */
function tgu_ui_deleteCurrentSet() {
    const curSet = tgu_store_getCurrentSet();
    if (curSet === tgu_main_DEFAULT_SET) return alert("Cannot delete the default set.");
    if (!confirm(`Delete set "${curSet}" and ALL its data?`)) return;
    tgu_store_clearSetData(curSet);
    const sets = tgu_store_getSets().filter(s => s !== curSet);
    tgu_store_saveSets(sets);
    tgu_ui_switchSet(tgu_main_DEFAULT_SET);
}

/**
 * Toggles background animation.
 * @param {boolean} enabled
 * @param {boolean} [save] - Whether to persist the setting.
 */
function tgu_ui_toggleAnimation(enabled, save = true) {
    document.body.classList.toggle('animate-bg', enabled);
    if (save) tgu_store_saveGlobalSetting(tgu_store_KEYS.BG_ANIM, enabled);
}

/**
 * Updates the global font size.
 * @param {number} size - Font size in points.
 * @param {boolean} [save] - Whether to persist the setting.
 */
function tgu_ui_updateFontSize(size, save = true) {
    document.documentElement.style.setProperty('--font-size', size + 'pt');
    if (save) tgu_store_saveGlobalSetting(tgu_store_KEYS.FONT_SIZE, size);
}

/**
 * Updates modal opacity.
 * @param {number} val - Opacity value (0-1).
 * @param {boolean} [save] - Whether to persist the setting.
 */
function tgu_ui_updateModalOpacity(val, save = true) {
    document.documentElement.style.setProperty('--modal-opacity', val);
    if (save) tgu_store_saveGlobalSetting(tgu_store_KEYS.MODAL_OPACITY, val);
}

/**
 * Updates opacity for past dates.
 * @param {number} val - Opacity value (0-1).
 * @param {boolean} [save] - Whether to persist the setting.
 */
function tgu_ui_updatePastOpacity(val, save = true) {
    document.documentElement.style.setProperty('--op-p', val);
    if (save) tgu_store_saveGlobalSetting(tgu_store_KEYS.OPACITY_PAST, val);
}

/**
 * Updates opacity for future dates.
 * @param {number} val - Opacity value (0-1).
 * @param {boolean} [save] - Whether to persist the setting.
 */
function tgu_ui_updateFutureOpacity(val, save = true) {
    document.documentElement.style.setProperty('--op-f', val);
    if (save) tgu_store_saveGlobalSetting(tgu_store_KEYS.OPACITY_FUTURE, val);
}

/**
 * Updates a theme color.
 * @param {string} varName - CSS variable name (e.g., '--bg-content').
 * @param {string} value - Color value.
 * @param {boolean} [save] - Whether to persist the setting.
 */
function tgu_ui_updateThemeColor(varName, value, save = true) {
    document.documentElement.style.setProperty(varName, value);
    if (save) tgu_store_saveSetSetting('cfg_' + varName.replace('--', ''), value);
    if (varName === '--bg-content') {
        document.documentElement.style.setProperty('--text-on-content', tgu_utils_getContrastColor(value));
        tgu_ui_updateSetSelector();
    }
}

/**
 * Toggles navigation bar visibility.
 * @returns {void}
 */
function tgu_ui_toggleNavBar() {
    const nav = document.querySelector('nav.modal-header');
    const btn = tgu_dom_get('toggleNavBtn');
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
