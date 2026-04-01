/**
 * @file tgu_events.js
 * @description Centralized event binding. Uses addEventListener() for composability
 * and removes tight coupling between DOM and business logic.
 */

/**
 * Binds all application event listeners. Called once during app initialization.
 * Keeps event binding separate from orchestration logic.
 */
function tgu_events_bindAll() {
    // ===== Navigation Events =====
    tgu_dom_get('prevYearBtn')?.addEventListener('click', () => tgu_ui_changeYear(-1));
    tgu_dom_get('nextYearBtn')?.addEventListener('click', () => tgu_ui_changeYear(1));
    tgu_dom_get('toggleNavBtn')?.addEventListener('click', () => tgu_ui_toggleNavBar());
    tgu_dom_get('openHelpBtn')?.addEventListener('click', () => tgu_ui_openModal('help-modal'));
    tgu_dom_get('openSettingsBtn')?.addEventListener('click', () => tgu_ui_openModal('settings-modal'));
    tgu_dom_get('editorSettingsBtn')?.addEventListener('click', () => tgu_ui_openModal('settings-modal'));
    tgu_dom_get('resetZoomBtn')?.addEventListener('click', () => tgu_zoom_resetZoom());

    // ===== Search Bar Events =====
    const searchBar = tgu_dom_get('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => tgu_state_handleSearch(e.target.value));
        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                const firstCell = tgu_dom_get('app')?.querySelector('.tgu-cell');
                if (firstCell) { firstCell.focus(); e.preventDefault(); }
            }
        });
    }
    tgu_dom_get('clearSearchBtn')?.addEventListener('click', () => tgu_state_clearSearch());

    // ===== Settings Panel Events =====
    tgu_dom_get('bgAnimationToggle')?.addEventListener('change', (e) => tgu_ui_toggleAnimation(e.target.checked));
    tgu_dom_get('cfgZoomEnabled')?.addEventListener('change', (e) => tgu_zoom_toggleZoom(e.target.checked));
    tgu_dom_get('cfgOpacityPast')?.addEventListener('input', (e) => tgu_ui_updatePastOpacity(e.target.value, true));
    tgu_dom_get('cfgOpacityFuture')?.addEventListener('input', (e) => tgu_ui_updateFutureOpacity(e.target.value, true));
    tgu_dom_get('cfgFontSize')?.addEventListener('input', (e) => tgu_ui_updateFontSize(e.target.value, true));
    tgu_dom_get('cfgModalOpacity')?.addEventListener('input', (e) => tgu_ui_updateModalOpacity(e.target.value, true));
    tgu_dom_get('cfgBgContent')?.addEventListener('change', (e) => tgu_ui_updateThemeColor('--bg-content', e.target.value, true));
    tgu_dom_get('cfgPrimary')?.addEventListener('change', (e) => tgu_ui_updateThemeColor('--primary', e.target.value, true));
    tgu_dom_get('cfgBgTooltip')?.addEventListener('change', (e) => tgu_ui_updateThemeColor('--bg-tooltip', e.target.value, true));

    // ===== Set Management Events =====
    tgu_dom_get('addSetBtn')?.addEventListener('click', () => tgu_ui_addNewSet());
    tgu_dom_get('deleteSetBtn')?.addEventListener('click', () => tgu_ui_deleteCurrentSet());
    tgu_dom_getAll('.tgu-set-selector').forEach(sel => {
        sel.addEventListener('change', (e) => tgu_ui_switchSet(e.target.value));
    });

    // ===== Data Import/Export Events =====
    tgu_dom_get('exportBtn')?.addEventListener('click', () => tgu_data_exportCSV());
    tgu_dom_get('importTriggerBtn')?.addEventListener('click', () => tgu_dom_get('importFile')?.click());
    tgu_dom_get('importFile')?.addEventListener('change', (e) => tgu_data_importCSV(e.target));
    tgu_dom_get('debugLuckyBtn')?.addEventListener('click', () => tgu_data_fillRandomData());
    tgu_dom_get('dangerWipeBtn')?.addEventListener('click', () => tgu_data_clearAllData());

    // ===== Modal Close Events (Data Attributes) =====
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

    // ===== Grid Cell Events (Delegation) =====
    const app = tgu_dom_get('app');
    if (app) {
        // Cell click: open editor
        app.addEventListener('click', (e) => {
            const cell = e.target.closest('.tgu-cell');
            if (cell) {
                tgu_state_hideTooltip();
                tgu_editor_openEditor(tgu_utils_parseKeyDate(cell.dataset.k), cell.dataset.k);
            }
        });

        // Cell hover: show tooltip
        app.addEventListener('mouseover', (e) => {
            const cell = e.target.closest('.tgu-cell');
            if (cell) {
                const searchBar = tgu_dom_get('searchBar');
                const searchTerm = (searchBar?.value || '').trim().length > 2 ? searchBar.value.trim().toLowerCase() : "";
                tgu_state_showTooltip(e, cell.dataset.k, searchTerm);
            }
        });

        // Cell hover: move tooltip
        app.addEventListener('mousemove', (e) => tgu_state_moveTooltip(e));

        // Cell leave: hide tooltip
        app.addEventListener('mouseout', (e) => {
            if (e.target.closest('.tgu-cell')) tgu_state_hideTooltip();
        });

        // Grid keyboard navigation
        app.addEventListener('keydown', tgu_main_handleGridKeyDown);
    }

    // ===== Global History API (Back Button) =====
    window.addEventListener('popstate', (e) => {
        if (window.isZoomedInHistory && (!e.state || !e.state.zoom)) {
            tgu_zoom_resetZoom(false);
        }
        const editor = tgu_dom_get('editor');
        if (editor?.classList.contains('open')) tgu_editor_closeEditor(false);
        const modal = document.querySelector('.modal-window.open:not(#editor)');
        if (modal) tgu_ui_closeModal(modal.id, false);
    });

    // ===== Global Keyboard Shortcuts =====
    window.addEventListener('keydown', tgu_main_handleGlobalKey);
}
