function tgu_events_bindNavigationEvents() {
    document.getElementById('prev-year-btn')?.addEventListener('click', () => tgu_ui_changeYear(-1));
    document.getElementById('next-year-btn')?.addEventListener('click', () => tgu_ui_changeYear(1));
    document.getElementById('toggle-nav-btn')?.addEventListener('click', () => tgu_ui_toggleNavBar());
    document.getElementById('open-help-btn')?.addEventListener('click', () => tgu_ui_openModal('help-modal'));
    document.getElementById('open-settings-btn')?.addEventListener('click', () => tgu_ui_openModal('settings-modal'));
    document.getElementById('editor-settings-btn')?.addEventListener('click', () => tgu_ui_openModal('settings-modal'));
    document.getElementById('reset-zoom-btn')?.addEventListener('click', () => tgu_zoom_resetZoom());
}

function tgu_events_bindSearchEvents() {
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => tgu_state_handleSearch(e.target.value));
        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                const firstCell = document.getElementById('app')?.querySelector('.tgu-cell');
                if (firstCell) { firstCell.focus(); e.preventDefault(); }
            }
        });
    }
    document.getElementById('clear-search')?.addEventListener('click', () => tgu_state_clearSearch());
}

function tgu_events_bindSettingsEvents() {
    document.getElementById('bg-animation-toggle')?.addEventListener('change', (e) => tgu_ui_toggleAnimation(e.target.checked));
    document.getElementById('cfg-zoom-enabled')?.addEventListener('change', (e) => tgu_zoom_toggleZoom(e.target.checked));
    document.getElementById('cfg-opacity-past')?.addEventListener('input', (e) => tgu_ui_updatePastOpacity(e.target.value));
    document.getElementById('cfg-opacity-future')?.addEventListener('input', (e) => tgu_ui_updateFutureOpacity(e.target.value));
    document.getElementById('cfg-font-size')?.addEventListener('input', (e) => tgu_ui_updateFontSize(e.target.value));
    document.getElementById('cfg-modal-opacity')?.addEventListener('input', (e) => tgu_ui_updateModalOpacity(e.target.value));
    document.getElementById('cfg-bg-content')?.addEventListener('change', (e) => tgu_ui_updateThemeColor('--bg-content', e.target.value));
    document.getElementById('cfg-primary')?.addEventListener('change', (e) => tgu_ui_updateThemeColor('--primary', e.target.value));
    document.getElementById('cfg-bg-tooltip')?.addEventListener('change', (e) => tgu_ui_updateThemeColor('--bg-tooltip', e.target.value));
}

function tgu_events_bindSetManagementEvents() {
    document.getElementById('add-set-btn')?.addEventListener('click', () => tgu_ui_addNewSet());
    document.getElementById('delete-set-btn')?.addEventListener('click', () => tgu_ui_deleteCurrentSet());
    document.querySelectorAll('.tgu-set-selector').forEach(sel => {
        sel.addEventListener('change', (e) => tgu_ui_switchSet(e.target.value));
    });
}

function tgu_events_bindDataEvents() {
    document.getElementById('export-btn')?.addEventListener('click', () => tgu_data_exportCSV());
    document.getElementById('import-trigger-btn')?.addEventListener('click', () => document.getElementById('import-file')?.click());
    document.getElementById('import-file')?.addEventListener('change', (e) => tgu_data_importCSV(e.target));
    document.getElementById('danger-wipe-btn')?.addEventListener('click', () => tgu_data_clearAllData());
}

function tgu_events_bindModalActions() {
    document.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'close-editor') tgu_editor_closeEditor();
        if (action === 'nav-day-prev') tgu_editor_navigateDay(-1);
        if (action === 'nav-day-next') tgu_editor_navigateDay(1);
        if (action === 'nav-entry-prev') tgu_editor_navigateEntry(-1);
        if (action === 'nav-entry-next') tgu_editor_navigateEntry(1);

        const closeId = e.target.closest('[data-close]')?.dataset.close;
        if (closeId) tgu_ui_closeModal(closeId);
    });
}

function tgu_events_getSearchTerm() {
    const searchBar = document.getElementById('search-bar');
    return (searchBar?.value || '').trim().length > tgu_state_SEARCH_MIN_LENGTH ? searchBar.value.trim().toLowerCase() : "";
}

function tgu_events_bindGridCellEvents() {
    const app = document.getElementById('app');
    if (!app) return;

    app.addEventListener('click', (e) => {
        const cell = e.target.closest('.tgu-cell');
        if (cell) {
            tgu_state_hideTooltip();
            tgu_editor_openEditor(tgu_utils_parseKeyDate(cell.dataset.k), cell.dataset.k);
        }
    });

    app.addEventListener('mouseover', (e) => {
        const cell = e.target.closest('.tgu-cell');
        if (cell) {
            const searchTerm = tgu_events_getSearchTerm();
            tgu_state_showTooltip(e, cell.dataset.k, searchTerm);
        }
    });

    app.addEventListener('mousemove', (e) => tgu_state_moveTooltip(e));

    app.addEventListener('mouseout', (e) => {
        if (e.target.closest('.tgu-cell')) tgu_state_hideTooltip();
    });

    app.addEventListener('keydown', tgu_main_handleGridKeyDown);
}

function tgu_events_bindHistoryEvents() {
    window.addEventListener('popstate', (e) => {
        if (window.isZoomedInHistory && (!e.state || !e.state.zoom)) {
            tgu_zoom_resetZoom();
        }
        const editor = document.getElementById('editor');
        if (editor?.classList.contains('open')) tgu_editor_closeEditor();
        const modal = document.querySelector('.modal-window.open:not(#editor)');
        if (modal) tgu_ui_closeModal(modal.id);
    });
}

function tgu_events_bindGlobalShortcuts() {
    window.addEventListener('keydown', tgu_main_handleGlobalKey);
}

function tgu_events_bindAll() {
    tgu_events_bindNavigationEvents();
    tgu_events_bindSearchEvents();
    tgu_events_bindSettingsEvents();
    tgu_events_bindSetManagementEvents();
    tgu_events_bindDataEvents();
    tgu_events_bindModalActions();
    tgu_events_bindGridCellEvents();
    tgu_events_bindHistoryEvents();
    tgu_events_bindGlobalShortcuts();
}
