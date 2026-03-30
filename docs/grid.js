// Layout Constants
const MAX_CELLS_PER_MONTH = 37; // 31 days + max 6 days offset
const HEADER_OFFSET = 2; // Room for headers on both sides

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEK_LABELS = ['S','M','T','W','T','F','S'];

// --- Grid Structure Generation ---
function fullRebuild(isPortrait) {
    app.innerHTML = '';
    document.getElementById('current-year-display').textContent = curYear;

    const now = new Date();
    const todayKey = getStorageKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);

    const cols = isPortrait ? (MONTHS_COUNT + HEADER_OFFSET) : (MAX_CELLS_PER_MONTH + HEADER_OFFSET);
    const rows = isPortrait ? (MAX_CELLS_PER_MONTH + HEADER_OFFSET) : (MONTHS_COUNT + HEADER_OFFSET);
    const mainCols = isPortrait ? MONTHS_COUNT : MAX_CELLS_PER_MONTH;
    const mainRows = isPortrait ? MAX_CELLS_PER_MONTH : MONTHS_COUNT;

    app.style.gridTemplateColumns = `auto repeat(${mainCols}, 1fr) auto`;
    app.style.gridTemplateRows =    `auto repeat(${mainRows}, 1fr) auto`;

    // Corner headers
    const corners = [[1, 1], [1, cols], [rows, 1], [rows, cols]];
    corners.forEach(([r, c]) => createHeader('', r, c));

    // Axis Headers
    const xMax = isPortrait ? MONTHS_COUNT : MAX_CELLS_PER_MONTH;
    for (let i = 1; i <= xMax; i++) {
        const label = isPortrait ? MONTH_LABELS[i - 1] : WEEK_LABELS[(i - 1) % 7];
        const isSun = !isPortrait && (i - 1) % 7 === 0;
        createHeader(label, 1, i + 1, isSun);
        createHeader(label, rows, i + 1, isSun);
    }

    const yMax = isPortrait ? MAX_CELLS_PER_MONTH : MONTHS_COUNT;
    for (let i = 1; i <= yMax; i++) {
        const label = isPortrait ? WEEK_LABELS[(i - 1) % 7] : MONTH_LABELS[i - 1];
        const isSun = isPortrait && (i - 1) % 7 === 0;
        const rowPos = rows - i;
        createHeader(label, rowPos, 1, isSun);
        createHeader(label, rowPos, cols, isSun);
    }

    // Grid Cells
    for (let m = 0; m < MONTHS_COUNT; m++) {
        const firstDay = new Date(curYear, m, 1).getDay();
        const monthRow = rows - 1 - m;
        const monthCol = m + 2;

        for (let i = 0; i < MAX_CELLS_PER_MONTH; i++) {
            const dayNum = i - firstDay + 1;
            const dateObj = new Date(curYear, m, dayNum);
            const isResidue = dateObj.getMonth() !== m || dateObj.getFullYear() !== curYear;
            const storageKey = getStorageKey(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
            const content = localStorage.getItem(storageKey) || "";
            const color = localStorage.getItem(storageKey.replace(KEY_PREFIX_CONTENT, KEY_PREFIX_COLOR));

            const el = document.createElement('div');
            el.className = 'gc';
            if (isResidue) el.classList.add('res');

            const row = isPortrait ? (rows - 1 - i) : monthRow;
            const col = isPortrait ? monthCol : (i + 2);
            el.style.gridRow = row;
            el.style.gridColumn = col;
            el.dataset.r = row;
            el.dataset.c = col;
            el.tabIndex = isResidue ? -1 : 0;
            el.dataset.k = storageKey;
            el.textContent = dateObj.getDate();

            if (dateObj.getDay() === 0) el.classList.add('sun');
            if (dateObj < todayStart) el.classList.add('pst');
            if (content) el.classList.add('hc');
            if (searchTerm && content.toLowerCase().includes(searchTerm)) el.classList.add('sm');
            if (storageKey === todayKey) el.classList.add('tdy');
            if (color) el.style.setProperty('--dot', color);

            if (!isResidue) {
                el.onclick = () => { hideTooltip(); openEditor(dateObj, storageKey); };
                el.onmouseenter = (e) => showTooltip(e, storageKey);
                el.onmousemove = (e) => moveTooltip(e);
                el.onmouseleave = hideTooltip;
            }
            app.appendChild(el);
        }
    }
}

function createHeader(txt, r, c, sun) {
    const h = document.createElement('div');
    h.className = 'gh';
    if (sun) h.classList.add('s');
    h.textContent = txt;
    h.style.gridRow = r;
    h.style.gridColumn = c;
    app.appendChild(h);
}