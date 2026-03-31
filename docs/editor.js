// --- Editor Logic & Navigation ---
const TOOLTIP_FOCUS_DELAY_MS = 100;

function openEditor(dateObj, key) {
    if (!editor.classList.contains('open')) lastFocus = document.activeElement;
    editKey = key;
    editDate = new Date(dateObj);
    const content = localStorage.getItem(key) || "";
    const color = localStorage.getItem(key.replace(KEY_PREFIX_CONTENT, KEY_PREFIX_COLOR)) || "#ffffff";
    
    textArea.value = content;
    colorPicker.value = color;
    const fullDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const shortDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dateLabel.innerHTML = `<span class="full-date">${fullDate}</span><span class="short-date">${shortDate}</span>`;
    
    const keys = getSetDataKeys();
    const currentIndex = keys.indexOf(key);
    let prevKey, nextKey;

    if (currentIndex !== -1) {
        prevKey = keys[currentIndex - 1];
        nextKey = keys[currentIndex + 1];
    } else {
        const nextIdx = keys.findIndex(k => k > key);
        nextKey = keys[nextIdx];
        prevKey = nextIdx === -1 ? keys[keys.length - 1] : keys[nextIdx - 1];
    }

    updateNavButton(prevBtn, prevKey, true);
    updateNavButton(nextBtn, nextKey, false);

    editor.classList.add('open');
    setTimeout(() => textArea.focus(), TOOLTIP_FOCUS_DELAY_MS);
    history.pushState({editorOpen: true}, "", "#editor");
    if (typeof updateToggleBtnVisibility === 'function') updateToggleBtnVisibility();
}

function updateNavButton(btn, targetKey, isPrev) {
    if (targetKey) {
        const d = parseKeyDate(targetKey);
        const shortDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        btn.innerText = isPrev ? `« ${shortDate}` : `${shortDate} »`;
        btn.disabled = false;
    } else {
        btn.innerText = isPrev ? `« no entries` : `no entries »`;
        btn.disabled = true;
    }
}

function saveCurrentEntry() {
    if (!editKey) return;
    const val = textArea.value.trim();
    const color = colorPicker.value;
    const colorKey = editKey.replace(KEY_PREFIX_CONTENT, KEY_PREFIX_COLOR);

    if (val) {
        localStorage.setItem(editKey, textArea.value);
    } else {
        localStorage.removeItem(editKey);
    }

    if (color && !isColorNearWhite(color)) {
        localStorage.setItem(colorKey, color);
    } else {
        localStorage.removeItem(colorKey);
    }
}

function closeEditor(goBack = true) {
    saveCurrentEntry();
    editor.classList.remove('open');
    textArea.blur();
    renderGrid();
    if (lastFocus) lastFocus.focus();
    if (goBack) history.back();
    if (typeof updateToggleBtnVisibility === 'function') updateToggleBtnVisibility();
}

function navigateDay(delta) {
    saveCurrentEntry();
    editDate.setDate(editDate.getDate() + delta);
    const newKey = getStorageKey(editDate.getFullYear(), editDate.getMonth()+1, editDate.getDate());
    openEditor(editDate, newKey);
}

function navigateEntry(delta) {
    saveCurrentEntry();
    const keys = getSetDataKeys();
    const currentIndex = keys.indexOf(editKey);
    let targetKey = null;
    
    if (currentIndex !== -1) {
        targetKey = keys[currentIndex + delta];
    } else {
        const nextIdx = keys.findIndex(k => k > editKey);
        if (delta > 0) {
            targetKey = nextIdx === -1 ? null : keys[nextIdx];
        } else {
            targetKey = nextIdx === 0 ? keys[keys.length - 1] : (nextIdx === -1 ? keys[keys.length - 1] : keys[nextIdx - 1]);
        }
    }

    if (targetKey) {
        const nextDate = parseKeyDate(targetKey);
        openEditor(nextDate, targetKey);
    }
}