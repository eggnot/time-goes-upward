function tgu_data_exportCSV() {
    let csv = "Set,Date,Color,Content\n";
    const keys = Object.keys(localStorage).filter(k => k.includes(`:${tgu_store_TYPE.TXT}:`));
    
    keys.forEach(k => {
        const [date, , set] = k.split(':');
        const color = tgu_store_get(date, tgu_store_TYPE.COL, set);
        const text = tgu_store_get(date, tgu_store_TYPE.TXT, set);

        if (text || color) {
            const cleanText = text.replace(/"/g, '""');
            csv += `${set},${date},${color},"${cleanText}"\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time_goes_upward_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), tgu_main_FOCUS_DELAY_MS);
}

function tgu_data_importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const regex = /^([^,\r\n]+),([^,\r\n]+),([^,\r\n]*),"((?:[^"]|"")*)"(?:\r?\n|$)/gm;
        let match;
        let count = 0;
        const dataToImport = [];

        while ((match = regex.exec(text)) !== null) {
            const space = match[1].trim();
            const date = match[2].trim();
            const color = match[3].trim();
            const content = match[4].replace(/""/g, '"');

            if (space === "Set" || space === "Space") continue;

            if (space && date) {
                dataToImport.push({ set: space, date, color, content });
                count++;
            }
        }
        
        const sets = tgu_store_getSets();
        dataToImport.forEach(d => {
            if (!sets.includes(d.set)) sets.push(d.set);
            tgu_store_set(d.date, tgu_store_TYPE.TXT, d.content, d.set);
            tgu_store_set(d.date, tgu_store_TYPE.COL, d.color, d.set);
        });
        tgu_store_saveSets(sets);
        tgu_main_renderGrid();
        
        alert(`Import complete: ${count} entries processed.`);
        input.value = '';
    };
    reader.readAsText(file);
}

function tgu_data_clearAllData() {
    if (confirm("Are you sure you want to delete ALL your diary entries, colors, and sets? This cannot be undone.")) {
        tgu_store_clearAll();
        location.reload();
    }
}
