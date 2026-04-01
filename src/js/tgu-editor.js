/**
 * @file tgu-editor.js
 * @description Diary entry editor modal and navigation.
 */

/**
 * Opens the editor for a specific date.
 * @param {Date} dateObj - Date object to edit.
 * @param {string} key - Storage key for the date.
 * @returns {void}
 */
function tgu_editor_openEditor(dateObj, key) {
    const editor = tgu_dom_get('editor');
    const textArea = tgu_dom_get('diaryText');
    const colorPicker = tgu_dom_get('cellColorPicker');
    const dateLabel = tgu_dom_get('editorDateLabel');
    const prevBtn = tgu_dom_get('prevEntryBtn');
    const nextBtn = tgu_dom_get('nextEntryBtn');
    
    if (!editor || !textArea || !colorPicker || !dateLabel) return;
    
    if (!editor.classList.contains('open')) {
        window.lastFocus = document.activeElement;
    }
    window.editKey = key;
    window.editDate = dateObj;
    
    const dateKey = tgu_utils_formatDateKey(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
    const entry = tgu_store_getEntry(dateKey);
    textArea.value = entry.text;
    colorPicker.value = entry.color || "#ffffff";
    
    const fullDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const shortDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dateLabel.innerHTML = `<span class="full-date">${fullDate}</span><span class="short-date">${shortDate}</span>`;
    
    const keys = tgu_utils_getSetDataKeys();
    const idx = keys.indexOf(key);
    let pk, nk;
    if (idx !== -1) {
        pk = keys[idx - 1];
        nk = keys[idx + 1];
    } else {
        const ni = keys.findIndex(k => k > key);
        nk = keys[ni];
        pk = ni === -1 ? keys[keys.length - 1] : keys[ni - 1];
    }
    
    tgu_editor_updateNavButton(prevBtn, pk, true);
    tgu_editor_updateNavButton(nextBtn, nk, false);
    editor.classList.add('open');
    setTimeout(() => textArea.focus(), 100);
    history.pushState({editorOpen: true}, "", "#editor");
    tgu_ui_updateToggleBtnVisibility();
}

/**
 * Updates a navigation button with date info or "no entries".
 * @param {HTMLElement} btn - Button element.
 * @param {string} targetKey - Storage key for the target date.
 * @param {boolean} isPrev - Whether this is the previous button.
 * @returns {void}
 */
function tgu_editor_updateNavButton(btn, targetKey, isPrev) {
    if (targetKey) {
        const d = tgu_utils_parseKeyDate(targetKey);
        btn.innerText = (isPrev ? `« ` : ``) + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (isPrev ? `` : ` »`);
        btn.disabled = false;
    } else {
        btn.innerText = isPrev ? `« no entries` : `no entries »`;
        btn.disabled = true;
    }
}

/**
 * Saves the current diary entry.
 * @returns {void}
 */
function tgu_editor_saveCurrentEntry() {
    const textArea = tgu_dom_get('diaryText');
    const colorPicker = tgu_dom_get('cellColorPicker');
    if (!textArea || !colorPicker) return;
    if (!window.editKey) return;
    const dateKey = tgu_utils_formatDateKey(window.editDate.getFullYear(), window.editDate.getMonth() + 1, window.editDate.getDate());
    tgu_store_saveEntry(dateKey, { text: textArea.value.trim(), color: colorPicker.value });
}

/**
 * Closes the editor.
 * @param {boolean} [goBack] - Whether to trigger history.back().
 * @returns {void}
 */
function tgu_editor_closeEditor(goBack = true) {
    const editor = tgu_dom_get('editor');
    const textArea = tgu_dom_get('diaryText');
    if (!editor || !textArea) return;
    tgu_editor_saveCurrentEntry();
    editor.classList.remove('open');
    textArea.blur();
    tgu_main_renderGrid();
    if (window.lastFocus) window.lastFocus.focus();
    if (goBack) history.back();
    tgu_ui_updateToggleBtnVisibility();
}

/**
 * Navigates to a nearby date (day before/after).
 * @param {number} delta - Day offset (+1 or -1).
 * @returns {void}
 */
function tgu_editor_navigateDay(delta) {
    tgu_editor_saveCurrentEntry();
    window.editDate.setDate(window.editDate.getDate() + delta);
    tgu_editor_openEditor(window.editDate, 
        tgu_utils_getStorageKey(window.editDate.getFullYear(), window.editDate.getMonth() + 1, window.editDate.getDate()));
}

/**
 * Navigates to the next/previous diary entry.
 * @param {number} delta - Entry offset (+1 or -1).
 * @returns {void}
 */
function tgu_editor_navigateEntry(delta) {
    tgu_editor_saveCurrentEntry();
    const keys = tgu_utils_getSetDataKeys();
    const idx = keys.indexOf(window.editKey);
    const targetKey = idx !== -1 ? keys[idx + delta] : null;
    if (targetKey) {
        tgu_editor_openEditor(tgu_utils_parseKeyDate(targetKey), targetKey);
    }
}
