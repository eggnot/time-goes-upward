function tgu_data_exportCSV() {
    let csv = "Set,Date,Color,Content\n";
    const entries = tgu_store_getAllDataForExport();

    entries.forEach(e => {
        const content = (e.content || "").replace(/"/g, '""');
        csv += `${e.set},${e.date},${e.color},"${content}"\n`;
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
        tgu_store_importData(dataToImport);
        tgu_main_renderGrid();
        
        alert(`Import complete: ${count} entries processed.`);
        input.value = '';
    };
    reader.readAsText(file);
}

function tgu_data_clearAllData() {
    if (confirm("Are you sure you want to delete ALL your diary entries, colors, and sets? This cannot be undone.")) {
        tgu_store_clearLocalStorage();
        location.reload();
    }
}

