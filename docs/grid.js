// Layout Constants
const MAX_CELLS_PER_MONTH = 37; // 31 days + max 6 days offset

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEK_LABELS = ['S','M','T','W','T','F','S'];

// --- Grid Structure Generation ---
function fullRebuild() {
    const fragment = document.createDocumentFragment();
    app.textContent = '';
    document.getElementById('current-year-display').textContent = curYear;

    const now = new Date();
    const todayKey = getStorageKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);

    app.style.gridTemplateColumns = `repeat(${MAX_CELLS_PER_MONTH}, 1fr)`;
    app.style.gridTemplateRows =    `repeat(${MONTHS_COUNT}, 1fr auto)`;

    // Grid Cells
    for (let m = 0; m < MONTHS_COUNT; m++) {
        const firstDayOffset = new Date(curYear, m, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(curYear, m + 1, 0).getDate();
        const dataRow = (MONTHS_COUNT - 1 - m) * 2 + 1;
        const labelRow = dataRow + 1;
        const monthLabel = MONTH_LABELS[m];

        const leftGap = firstDayOffset;
        const rightGap = MAX_CELLS_PER_MONTH - (firstDayOffset + daysInMonth);

        if (leftGap >= rightGap && leftGap > 0) {
            createHeader(monthLabel, dataRow, labelRow + 1, 1, leftGap + 1, false, fragment, 'gm left');
        } else if (rightGap > 0) {
            createHeader(monthLabel, dataRow, labelRow + 1, firstDayOffset + daysInMonth + 1, MAX_CELLS_PER_MONTH + 1, false, fragment, 'gm right');
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(curYear, m, d);
            const storageKey = getStorageKey(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
            const content = localStorage.getItem(storageKey) || "";
            const color = localStorage.getItem(storageKey.replace(KEY_PREFIX_CONTENT, KEY_PREFIX_COLOR));

            const el = document.createElement('div');
            el.className = 'gc';

            const col = firstDayOffset + d;

            el.style.gridRow = dataRow;
            el.style.gridColumn = col;
            el.dataset.r = dataRow;
            el.dataset.c = col;            
            el.tabIndex = 0;
            el.dataset.k = storageKey;
            el.textContent = String(dateObj.getDate());

            // Add week label underneath
            createHeader(WEEK_LABELS[(col - 1) % 7], labelRow, labelRow + 1, col, col + 1, (col - 1) % 7 === 0, fragment, 'gh');

            if (dateObj.getDay() === 0) el.classList.add('sun');
            if (dateObj > todayStart) el.classList.add('fut');
            if (content) el.classList.add('hc');
            if (searchTerm && content.toLowerCase().includes(searchTerm)) el.classList.add('sm');
            if (storageKey === todayKey) el.classList.add('tdy');
            if (color) el.style.setProperty('--dot', color);

            el.onclick = () => { hideTooltip(); openEditor(dateObj, storageKey); };
            el.onmouseenter = (e) => showTooltip(e, storageKey);
            el.onmousemove = (e) => moveTooltip(e);
            el.onmouseleave = hideTooltip;
            
            fragment.appendChild(el);
        }
    }
    app.appendChild(fragment);
}

function createHeader(txt, rStart, rEnd, cStart, cEnd, isSun = false, target = app, className = 'gh') {
    const h = document.createElement('div');
    h.className = className;
    if (isSun) h.classList.add('s');
    
    if (className.includes('gm')) {
        const s = document.createElement('span');
        s.textContent = String(txt);
        h.appendChild(s);
    } else {
        h.textContent = String(txt);
    }

    h.style.gridRowStart = rStart;
    h.style.gridRowEnd = rEnd;
    h.style.gridColumnStart = cStart;
    h.style.gridColumnEnd = cEnd;
    target.appendChild(h);
}