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

    app.style.gridTemplateColumns = `repeat(${MAX_CELLS_PER_MONTH}, ${(100/MAX_CELLS_PER_MONTH).toFixed(4)}%)`;
    app.style.gridTemplateRows =    `repeat(${MONTHS_COUNT}, ${(100/MONTHS_COUNT).toFixed(4)}%)`;

    // Grid Cells
    for (let m = 0; m < MONTHS_COUNT; m++) {
        const firstDayOffset = new Date(curYear, m, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(curYear, m + 1, 0).getDate();
        const dataRow = MONTHS_COUNT - m;
        const monthLabel = MONTH_LABELS[m];

        const leftGap = firstDayOffset;
        const rightGap = MAX_CELLS_PER_MONTH - (firstDayOffset + daysInMonth);

        if (leftGap >= rightGap && leftGap > 0) {
            createHeader(monthLabel, dataRow, dataRow + 1, 1, leftGap + 1, false, fragment, 'gm left');
        } else if (rightGap > 0) {
            createHeader(monthLabel, dataRow, dataRow + 1, firstDayOffset + daysInMonth + 1, MAX_CELLS_PER_MONTH + 1, false, fragment, 'gm right');
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
            
            const span = document.createElement('span');
            span.textContent = d;
            
            const small = document.createElement('small');
            const dayOfWeek = WEEK_LABELS[(col - 1) % 7];
            small.textContent = dayOfWeek;

            el.append(span, small);

            if (dateObj.getDay() === 0) el.classList.add('sun');
            el.classList.add((dateObj > todayStart) ? 'f' : 'p');
            if (content) el.classList.add('hc');
            if (searchTerm && content.toLowerCase().includes(searchTerm)) el.classList.add('sm');
            if (storageKey === todayKey) el.classList.add('tdy');
            if (color) el.style.setProperty('--dot', color);

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