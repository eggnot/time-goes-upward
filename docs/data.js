// --- Data Management (CSV Import/Export) ---

function exportCSV() {
    let csv = "Set,Date,Color,Content\n";
    const entries = [];

    Object.keys(localStorage).forEach(k => {
        let set = 'def', key = k;
        if (k.startsWith(KEY_PREFIX_SET)) {
            const parts = k.split(KEY_PREFIX_SEP);
            set = parts[1];
            key = parts.slice(2).join(KEY_PREFIX_SEP);
        }
        
        if (key.startsWith(KEY_PREFIX_CONTENT)) {
            const date = key.substring(2);
            const color = localStorage.getItem(k.replace(KEY_PREFIX_CONTENT, KEY_PREFIX_COLOR)) || "";
            const content = (localStorage.getItem(k) || "").replace(/"/g, '""');
            entries.push({ set, date, color, content });
        }
    });

    entries.sort((a,b) => (a.set + a.date).localeCompare(b.set + a.date)).forEach(e => {
        csv += `${e.set},${e.date},${e.color},"${e.content}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time_goes_upward_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const regex = /^([^,\r\n]+),([^,\r\n]+),([^,\r\n]*),"((?:[^"]|"")*)"(?:\r?\n|$)/gm;
        let match;
        let count = 0;

        while ((match = regex.exec(text)) !== null) {
            const space = match[1].trim();
            const date = match[2].trim();
            const color = match[3].trim();
            const content = match[4].replace(/""/g, '"');

            if (space === "Set" || space === "Space") continue;

            if (space && date) {
                if (!sets.includes(space)) {
                    sets.push(space);
                    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
                }
                const prefix = space === 'def' ? '' : `${KEY_PREFIX_SET}${space}${KEY_PREFIX_SEP}`;
                
                const dKey = `${prefix}${KEY_PREFIX_CONTENT}${date}`;
                const cKey = `${prefix}${KEY_PREFIX_COLOR}${date}`;

                if (content) localStorage.setItem(dKey, content);
                else localStorage.removeItem(dKey);

                if (color) localStorage.setItem(cKey, color);
                else localStorage.removeItem(cKey);
                
                count++;
            }
        }
        renderGrid();
        alert(`Import complete: ${count} entries processed.`);
        input.value = '';
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm("Are you sure you want to delete ALL your diary entries, colors, and spaces? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
}

function fillRandomData() {
    const lorem = "you are beautiful beast and i love you even if we don't know each other it's just feeling before thoughts".split(' ');

    const numValues = 5;

    const allDays = [];
    for (let m = 0; m < MONTHS_COUNT; m++) {
        const days = new Date(curYear, m + 1, 0).getDate();
        for (let d = 1; d <= days; d++) {
            allDays.push({ m: m + 1, d });
        }
    }


    for (let i = 0; i < numValues; i++) {
        if (allDays.length === 0) break;
        const idx = Math.floor(Math.random() * allDays.length);
        const day = allDays.splice(idx, 1)[0];
        
        const count = Math.floor(Math.random() * (100 - 5 + 1)) + 5;
        const words = [];
        for (let j = 0; j < count; j++) {
            words.push(lorem[Math.floor(Math.random() * lorem.length)]);
        }
        
        localStorage.setItem(getStorageKey(curYear, day.m, day.d), words.join(' '));
    }
    renderGrid();
    alert(`Debug: ${numValues} random entries added to ${curYear}.`);
}