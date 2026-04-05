function tgu_editor_getElements() {
    return {
        editor: document.getElementById('editor'),
        textArea: document.getElementById('diary-text'),
        colorPicker: document.getElementById('cell-color-picker'),
        dateLabel: document.getElementById('editor-date-label'),
        prevBtn: document.getElementById('prev-entry-btn'),
        nextBtn: document.getElementById('next-entry-btn')
    };
}

function tgu_editor_populateData(dateObj, key) {
    const el = tgu_editor_getElements();
    if (!el.textArea || !el.colorPicker || !el.dateLabel) return;
    
    const dateKey = tgu_utils_formatDateKey(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
    el.textArea.value = tgu_store_get(dateKey, tgu_store_TYPE.TXT);
    el.colorPicker.value = tgu_store_get(dateKey, tgu_store_TYPE.COL) || "#ffffff";
    
    const fullDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const shortDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    el.dateLabel.innerHTML = `<span class="full-date">${fullDate}</span><span class="short-date">${shortDate}</span>`;
}

function tgu_editor_updateNavigation(key) {
    const el = tgu_editor_getElements();
    if (!el.prevBtn || !el.nextBtn) return;
    
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
    
    tgu_editor_updateNavButton(el.prevBtn, pk, true);
    tgu_editor_updateNavButton(el.nextBtn, nk, false);
}

function tgu_editor_openEditor(dateObj, key) {
    const el = tgu_editor_getElements();
    if (!el.editor || !el.textArea) return;
    
    if (!el.editor.classList.contains('open')) {
        window.lastFocus = document.activeElement;
    }
    window.editKey = key;
    window.editDate = dateObj;
    
    tgu_editor_populateData(dateObj, key);
    tgu_editor_updateNavigation(key);
    
    el.editor.classList.add('open');
    setTimeout(() => el.textArea.focus(), tgu_main_FOCUS_DELAY_MS);
    history.pushState({editorOpen: true}, "", "#editor");
    tgu_ui_updateToggleBtnVisibility();
}

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

function tgu_editor_saveCurrentEntry() {
    const textArea = document.getElementById('diary-text');
    const colorPicker = document.getElementById('cell-color-picker');
    if (!textArea || !colorPicker) return;
    if (!window.editKey) return;
    const dateKey = tgu_utils_formatDateKey(window.editDate.getFullYear(), window.editDate.getMonth() + 1, window.editDate.getDate());
    tgu_store_set(dateKey, tgu_store_TYPE.TXT, textArea.value);
    tgu_store_set(dateKey, tgu_store_TYPE.COL, colorPicker.value);
}

function tgu_editor_closeEditor(goBack = true) {
    const editor = document.getElementById('editor');
    const textArea = document.getElementById('diary-text');
    if (!editor || !textArea) return;
    tgu_editor_saveCurrentEntry();
    editor.classList.remove('open');
    textArea.blur();
    tgu_main_renderGrid();
    if (window.lastFocus) window.lastFocus.focus();
    if (goBack) history.back();
    tgu_ui_updateToggleBtnVisibility();
}

function tgu_editor_navigateDay(delta) {
    tgu_editor_saveCurrentEntry();
    window.editDate.setDate(window.editDate.getDate() + delta);
    tgu_editor_openEditor(window.editDate, 
        tgu_utils_getStorageKey(window.editDate.getFullYear(), window.editDate.getMonth() + 1, window.editDate.getDate()));
}

function tgu_editor_navigateEntry(delta) {
    tgu_editor_saveCurrentEntry();
    const keys = tgu_utils_getSetDataKeys();
    const idx = keys.indexOf(window.editKey);
    const targetKey = idx !== -1 ? keys[idx + delta] : null;
    if (targetKey) {
        tgu_editor_openEditor(tgu_utils_parseKeyDate(targetKey), targetKey);
    }
}
