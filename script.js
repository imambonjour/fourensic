let rawData = [];
let lockState = { locked: false, unlockAt: null };

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createSeatingPairs(people) {
    const males = people.filter(p => p.gender === 'L');
    const females = people.filter(p => p.gender === 'P');

    shuffle(males);
    shuffle(females);

    function pairGroup(group, gender) {
        const pairs = [];
        for (let i = 0; i < group.length; i += 2) {
            const name1 = group[i].nama;
            const name2 = i + 1 < group.length ? group[i + 1].nama : '—';
            pairs.push([name1, name2, gender]);
        }
        return pairs;
    }

    const allPairs = [...pairGroup(males, 'L'), ...pairGroup(females, 'P')];
    shuffle(allPairs);

    const singletonIdx = allPairs.findIndex(p => p[1] === '—');
    if (singletonIdx !== -1) {
        const singleton = allPairs.splice(singletonIdx, 1)[0];
        const total = allPairs.length + 1;
        const lastRowStart = Math.floor((total - 1) / 4) * 4;
        allPairs.splice(lastRowStart + 1, 0, singleton);
    }

    return allPairs;
}

function renderSeatingChart(pairs) {
    const chartElement = document.getElementById('seating-chart');
    if (!chartElement) return;
    chartElement.innerHTML = '';

    pairs.forEach((pair) => {
        const [name1, name2, gender] = pair;

        const tableCard = document.createElement('div');
        tableCard.classList.add('table-card');

        const createSeat = (name, g) => {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat-item', g);
            if (name === '—') seatDiv.classList.add('empty-seat');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('seat-name');
            nameSpan.textContent = name;

            const label = document.createElement('span');
            label.classList.add('seat-label');
            label.textContent = g === 'L' ? 'Laki-laki' : (g === 'P' ? 'Perempuan' : '?');

            seatDiv.appendChild(nameSpan);
            seatDiv.appendChild(label);
            return seatDiv;
        };

        tableCard.appendChild(createSeat(name1, gender));
        tableCard.appendChild(createSeat(name2, gender));

        chartElement.appendChild(tableCard);
    });
}

// ─────────────────────────────────────────────
// 5. PERSISTENCE
// ─────────────────────────────────────────────

function downloadAsImage() {
    const seatingChart = document.getElementById('seating-chart');
    if (!seatingChart) return;
    html2canvas(seatingChart, {
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        scale: 2, logging: false, useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `denah-duduk-xi4-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

async function saveSeatingPairs(pairs) {
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pairs)
        });
        if (!response.ok) throw new Error('Failed to save configuration to server');
        console.log("Config saved to server.");
        location.reload();
    } catch (error) {
        console.error("Error saving seating arrangement:", error);
    }
}

async function loadSeatingPairs() {
    try {
        const response = await fetch('/api/config/latest');
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Error loading seating arrangement:", error);
        return null;
    }
}

async function loadNames() {
    try {
        const response = await fetch('/api/names');
        if (!response.ok) throw new Error('Failed to load names from server');
        return await response.json();
    } catch (error) {
        console.error("Error loading names:", error);
        return [];
    }
}

async function getLockStatus() {
    try {
        const response = await fetch('/api/lock');
        if (response.ok) {
            lockState = await response.json();
            updateLockUI();
        }
    } catch (error) {
        console.error("Error fetching lock status:", error);
    }
}

async function toggleLock() {
    const action = lockState.locked ? 'unlock' : 'lock';
    const password = prompt(`Masukkan password untuk ${action === 'lock' ? 'mengunci' : 'membuka kunci'}:`);
    if (password === null) return;
    try {
        const response = await fetch('/api/lock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, password })
        });
        const result = await response.json();
        if (response.ok) {
            lockState = result;
            alert(result.message);
            updateLockUI();
        } else {
            alert(result.error || 'Terjadi kesalahan saat memproses kunci.');
        }
    } catch (error) {
        console.error("Error toggling lock:", error);
        alert('Gagal menghubungi server.');
    }
}

function updateLockUI() {
    const lockBtn = document.getElementById('lock-btn');
    const lockIcon = document.getElementById('lock-icon');
    const lockText = document.getElementById('lock-text');
    const reshuffleBtn = document.getElementById('reshuffle-btn');
    if (!lockBtn) return;

    if (lockState.locked) {
        const remainingTime = lockState.unlockAt - Date.now();
        const days = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
        if (lockText) lockText.textContent = `Terkunci (${days} hari lagi)`;
        if (lockIcon) {
            lockIcon.className = 'fa-solid fa-lock';
        }
        lockBtn.classList.add('locked');
        if (reshuffleBtn) { reshuffleBtn.disabled = true; reshuffleBtn.title = "Konfigurasi sedang dikunci."; }
    } else {
        if (lockText) lockText.textContent = `Kunci`;
        if (lockIcon) {
            lockIcon.className = 'fa-solid fa-unlock';
        }
        lockBtn.classList.remove('locked');
        if (reshuffleBtn) { reshuffleBtn.disabled = false; reshuffleBtn.title = ""; }
    }
}

// ─────────────────────────────────────────────
// 6. INIT
// ─────────────────────────────────────────────

async function initSeating(forceReshuffle = false) {
    await getLockStatus();

    let seatingPairs;
    if (!forceReshuffle) {
        seatingPairs = await loadSeatingPairs();
    }

    if (!seatingPairs || forceReshuffle) {
        if (lockState.locked) {
            alert("Konfigurasi sedang dikunci. Tidak bisa mengacak ulang.");
            return;
        }

        rawData = await loadNames();
        if (rawData.length === 0) { console.error("No names found."); return; }

        seatingPairs = createSeatingPairs(rawData);
        await saveSeatingPairs(seatingPairs);
    } else {
        rawData = await loadNames();
    }

    renderSeatingChart(seatingPairs);
}

// ─────────────────────────────────────────────
// 7. EVENT LISTENERS
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await initSeating();

    const reshuffleBtn = document.getElementById('reshuffle-btn');
    if (reshuffleBtn) {
        reshuffleBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin mengacak ulang tempat duduk?')) {
                initSeating(true);
            }
        });
    }

    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadAsImage);

    const lockBtn = document.getElementById('lock-btn');
    if (lockBtn) lockBtn.addEventListener('click', toggleLock);
});
