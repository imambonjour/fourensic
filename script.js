let rawData = [];
let lockState = { locked: false, unlockAt: null };

// ─────────────────────────────────────────────
// 1. CONSTRAINT PARSER  (bash-style)
// ─────────────────────────────────────────────
//
// Syntax (one command per line):
//   together  <Name A>  <Name B>   — must share a desk
//   apart     <Name A>  <Name B>   — must not share a desk
//   row       <Name>    <N>        — place in row N
//   col       <Name>    <N>        — place in column N
//   pos       <Name>    <R>  <C>   — place at row R, col C
//   # any text                     — comment, ignored

/**
 * Parse a single bash-style constraint line.
 * Returns a constraint object or null if blank/comment.
 */
function parseLine(line, people) {
    const raw = line.trim();
    if (!raw || raw.startsWith('#')) return null;

    // Helper: find a person by case-insensitive full or partial name
    function findPerson(token) {
        token = (token || '').trim().toLowerCase();
        const names = people.map(p => p.nama.toLowerCase());
        let idx = names.indexOf(token);
        if (idx !== -1) return people[idx];
        idx = names.findIndex(n => n.includes(token) || token.includes(n));
        return idx !== -1 ? people[idx] : null;
    }

    // Tokenise: first word is command, rest are args
    // Names may contain spaces — we use last token(s) as numbers when needed
    const tokens = raw.split(/\s+/);
    const cmd = tokens[0].toLowerCase();

    if (cmd === 'together') {
        // together <Name A> <Name B>
        // Split remaining by trying each split point
        const rest = tokens.slice(1);
        for (let split = 1; split < rest.length; split++) {
            const a = rest.slice(0, split).join(' ');
            const b = rest.slice(split).join(' ');
            const p1 = findPerson(a);
            const p2 = findPerson(b);
            if (p1 && p2 && p1.nama !== p2.nama) {
                return { type: 'together', raw, p1, p2, name1: a, name2: b };
            }
        }
        // Could not resolve names
        return { type: 'together', raw, p1: null, p2: null,
            name1: rest.join(' '), name2: '?' };
    }

    if (cmd === 'apart') {
        const rest = tokens.slice(1);
        for (let split = 1; split < rest.length; split++) {
            const a = rest.slice(0, split).join(' ');
            const b = rest.slice(split).join(' ');
            const p1 = findPerson(a);
            const p2 = findPerson(b);
            if (p1 && p2 && p1.nama !== p2.nama) {
                return { type: 'apart', raw, p1, p2, name1: a, name2: b };
            }
        }
        return { type: 'apart', raw, p1: null, p2: null,
            name1: tokens.slice(1).join(' '), name2: '?' };
    }

    if (cmd === 'pos') {
        // pos <Name> <R> <C>  — last two tokens are numbers
        if (tokens.length < 4) return { type: 'unknown', raw };
        const col = parseInt(tokens[tokens.length - 1]);
        const row = parseInt(tokens[tokens.length - 2]);
        const nameStr = tokens.slice(1, tokens.length - 2).join(' ');
        if (isNaN(row) || isNaN(col)) return { type: 'unknown', raw };
        const p = findPerson(nameStr);
        return { type: 'fixPos', raw, p, name: nameStr, row, col };
    }

    if (cmd === 'row') {
        // row <Name> <N>  — last token is number
        if (tokens.length < 3) return { type: 'unknown', raw };
        const row = parseInt(tokens[tokens.length - 1]);
        const nameStr = tokens.slice(1, tokens.length - 1).join(' ');
        if (isNaN(row)) return { type: 'unknown', raw };
        const p = findPerson(nameStr);
        return { type: 'fixRow', raw, p, name: nameStr, row };
    }

    if (cmd === 'col') {
        // col <Name> <N>  — last token is number
        if (tokens.length < 3) return { type: 'unknown', raw };
        const col = parseInt(tokens[tokens.length - 1]);
        const nameStr = tokens.slice(1, tokens.length - 1).join(' ');
        if (isNaN(col)) return { type: 'unknown', raw };
        const p = findPerson(nameStr);
        return { type: 'fixCol', raw, p, name: nameStr, col };
    }

    return { type: 'unknown', raw };
}

/**
 * Parse all bash-style constraint lines from the textarea.
 * Returns { constraints, errors, warnings }.
 * errors = BLOCKING (reshuffle refused until fixed).
 * warnings = non-blocking (shown as yellow tags).
 */
function parseConstraints(text, people) {
    const lines = text.split('\n');
    const constraints = [];
    const errors = [];
    const warnings = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const c = parseLine(line, people);
        if (!c) continue;

        if (c.type === 'unknown') {
            warnings.push(`Tidak dikenali: "${line.trim()}"`);
            continue;
        }

        // Validate names exist
        if (c.p1 === null) {
            errors.push(`❌ Nama tidak ditemukan: "<strong>${c.name1}</strong>" dalam aturan: "${c.raw}"`);
            continue;
        }
        if (c.p2 === null && ['together', 'apart'].includes(c.type)) {
            errors.push(`❌ Nama tidak ditemukan: "<strong>${c.name2}</strong>" dalam aturan: "${c.raw}"`);
            continue;
        }
        if (c.p === null && ['fixPos', 'fixRow', 'fixCol'].includes(c.type)) {
            errors.push(`❌ Nama tidak ditemukan: "<strong>${c.name}</strong>" dalam aturan: "${c.raw}"`);
            continue;
        }

        // BLOCKING: together across genders
        if (c.type === 'together' && c.p1.gender !== c.p2.gender) {
            errors.push(`❌ Tidak bisa: "<strong>${c.p1.nama}</strong>" (${c.p1.gender === 'L' ? 'Laki-laki' : 'Perempuan'}) dan "<strong>${c.p2.nama}</strong>" (${c.p2.gender === 'L' ? 'Laki-laki' : 'Perempuan'}) berbeda jenis kelamin — tidak bisa sebangku.`);
            continue;
        }

        constraints.push(c);
    }

    return { constraints, errors, warnings };
}

// ─────────────────────────────────────────────
// 2. HELPER FUNCTIONS
// ─────────────────────────────────────────────

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ─────────────────────────────────────────────
// 3. CONSTRAINED SEATING ALGORITHM
// ─────────────────────────────────────────────

/**
 * Build seating pairs respecting constraints.
 * Returns { pairs, warnings } where pairs = [[name1, name2, gender], ...]
 */
function createSeatingPairsWithConstraints(people, constraints) {
    const warnings = [];
    const seated = new Set(); // track who is already placed
    const fixedPairs = [];    // pairs from 'together' constraints
    const apartSet = [];      // pairs that must NOT be together

    // ── Step 1: Honour 'together' constraints
    for (const c of constraints.filter(c => c.type === 'together')) {
        if (seated.has(c.p1.nama) || seated.has(c.p2.nama)) {
            warnings.push(`⚠ "${c.p1.nama}" atau "${c.p2.nama}" sudah dialokasikan ke aturan lain — aturan sebangku diabaikan.`);
            continue;
        }
        fixedPairs.push([c.p1.nama, c.p2.nama, c.p1.gender]);
        seated.add(c.p1.nama);
        seated.add(c.p2.nama);
    }

    // ── Step 2: Collect 'apart' pairs
    for (const c of constraints.filter(c => c.type === 'apart')) {
        apartSet.push([c.p1.nama, c.p2.nama]);
    }

    // ── Step 3: Shuffle remaining people by gender
    const remaining = people.filter(p => !seated.has(p.nama));
    const males = remaining.filter(p => p.gender === 'L');
    const females = remaining.filter(p => p.gender === 'P');
    const unknown = remaining.filter(p => p.gender !== 'L' && p.gender !== 'P');

    shuffle(males);
    shuffle(females);
    shuffle(unknown);

    // ── Step 4: Pair remaining by gender, respecting 'apart'
    function pairGroup(group, gender) {
        const pairs = [];
        const used = new Set();

        for (let i = 0; i < group.length; i++) {
            if (used.has(i)) continue;
            const p1 = group[i];
            // find a partner that is not 'apart' from p1
            let partnerIdx = -1;
            for (let j = i + 1; j < group.length; j++) {
                if (used.has(j)) continue;
                const p2 = group[j];
                const isApart = apartSet.some(([a, b]) =>
                    (a === p1.nama && b === p2.nama) ||
                    (b === p1.nama && a === p2.nama)
                );
                if (!isApart) { partnerIdx = j; break; }
            }
            if (partnerIdx !== -1) {
                pairs.push([p1.nama, group[partnerIdx].nama, gender]);
                used.add(i);
                used.add(partnerIdx);
            } else {
                // No valid partner found — seat alone
                pairs.push([p1.nama, '—', gender]);
                warnings.push(`⚠ "${p1.nama}" tidak memiliki pasangan yang memenuhi semua aturan — duduk sendiri.`);
                used.add(i);
            }
        }
        // Odd one left
        for (let i = 0; i < group.length; i++) {
            if (!used.has(i)) {
                pairs.push([group[i].nama, '—', gender]);
            }
        }
        return pairs;
    }

    const malePairs = pairGroup(males, 'L');
    const femalePairs = pairGroup(females, 'P');
    const unknownPairs = pairGroup(unknown, 'U');

    // ── Step 5: Merge all pairs and shuffle their order
    let allPairs = [...fixedPairs, ...malePairs, ...femalePairs, ...unknownPairs];
    shuffle(allPairs);

    // ── Step 6: Apply fixPos / fixRow / fixCol constraints
    const COLS = 4;
    const totalPairs = allPairs.length;
    const rows = Math.ceil(totalPairs / COLS);
    // Build a grid of slots: grid[row][col] = null | pair
    const grid = Array.from({ length: rows }, () => Array(COLS).fill(null));

    // Remove pairs that need fixed positions from allPairs pool first
    const fixPosConstraints = constraints.filter(c => c.type === 'fixPos');
    const fixRowConstraints = constraints.filter(c => c.type === 'fixRow');
    const fixColConstraints = constraints.filter(c => c.type === 'fixCol');

    function findPairContaining(name) {
        return allPairs.findIndex(pair => pair[0] === name || pair[1] === name);
    }

    // Place fixPos first (most specific)
    for (const c of fixPosConstraints) {
        const r = c.row - 1; const col = c.col - 1;
        if (r < 0 || r >= rows || col < 0 || col >= COLS) {
            warnings.push(`⚠ Posisi baris ${c.row} kolom ${c.col} di luar batas grid — aturan diabaikan.`);
            continue;
        }
        const idx = findPairContaining(c.p.nama);
        if (idx === -1) continue;
        if (grid[r][col]) {
            warnings.push(`⚠ Slot baris ${c.row} kolom ${c.col} sudah terisi — aturan untuk "${c.p.nama}" diabaikan.`);
            continue;
        }
        grid[r][col] = allPairs[idx];
        allPairs.splice(idx, 1);
    }

    // Place fixRow (any free column in that row)
    for (const c of fixRowConstraints) {
        const r = c.row - 1;
        if (r < 0 || r >= rows) {
            warnings.push(`⚠ Baris ${c.row} di luar batas — aturan untuk "${c.p.nama}" diabaikan.`);
            continue;
        }
        const idx = findPairContaining(c.p.nama);
        if (idx === -1) continue;
        const freeCol = grid[r].findIndex(slot => slot === null);
        if (freeCol === -1) {
            warnings.push(`⚠ Baris ${c.row} penuh — aturan untuk "${c.p.nama}" diabaikan.`);
            continue;
        }
        grid[r][freeCol] = allPairs[idx];
        allPairs.splice(idx, 1);
    }

    // Place fixCol (any free row in that column)
    for (const c of fixColConstraints) {
        const col = c.col - 1;
        if (col < 0 || col >= COLS) {
            warnings.push(`⚠ Kolom ${c.col} di luar batas — aturan untuk "${c.p.nama}" diabaikan.`);
            continue;
        }
        const idx = findPairContaining(c.p.nama);
        if (idx === -1) continue;
        let placed = false;
        for (let r = 0; r < rows; r++) {
            if (!grid[r][col]) {
                grid[r][col] = allPairs[idx];
                allPairs.splice(idx, 1);
                placed = true;
                break;
            }
        }
        if (!placed) warnings.push(`⚠ Kolom ${c.col} penuh — aturan untuk "${c.p.nama}" diabaikan.`);
    }

    // Fill remaining free slots with leftover pairs
    let poolIdx = 0;
    for (let r = 0; r < rows; r++) {
        for (let col = 0; col < COLS; col++) {
            if (!grid[r][col] && poolIdx < allPairs.length) {
                grid[r][col] = allPairs[poolIdx++];
            }
        }
    }

    // Flatten grid back to linear pairs array
    const finalPairs = [];
    for (let r = 0; r < rows; r++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[r][col]) finalPairs.push(grid[r][col]);
        }
    }

    return { pairs: finalPairs, warnings };
}

// ─────────────────────────────────────────────
// 4. RENDER  (with Imam 5-tap secret)
// ─────────────────────────────────────────────

let imamTapCount = 0;
let imamTapTimer = null;

function openSecretModal() {
    const backdrop = document.getElementById('secret-modal-backdrop');
    if (backdrop) {
        backdrop.classList.add('open');
        // Focus textarea
        const ta = document.getElementById('constraints-input');
        if (ta) setTimeout(() => ta.focus(), 50);
    }
}

function closeSecretModal() {
    const backdrop = document.getElementById('secret-modal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
}

function renderSeatingChart(pairs) {
    const chartElement = document.getElementById('seating-chart');
    if (!chartElement) return;
    chartElement.innerHTML = '';

    const totalPairs = pairs.length;
    const lastRowStartIndex = Math.floor((totalPairs - 1) / 4) * 4;
    const lastRowPairsCount = totalPairs - lastRowStartIndex;

    pairs.forEach((pair, index) => {
        const [name1, name2, gender] = pair;

        if (index === lastRowStartIndex + 1 && lastRowPairsCount === 2) {
            const spacer1 = document.createElement('div');
            spacer1.classList.add('spacer');
            const spacer2 = document.createElement('div');
            spacer2.classList.add('spacer');
            chartElement.appendChild(spacer1);
            chartElement.appendChild(spacer2);
        }

        const tableCard = document.createElement('div');
        tableCard.classList.add('table-card');

        // Check if this card contains IMAM (partial match for names like "Imam Ahmad")
        const hasImam = [name1, name2].some(n => n.toUpperCase().includes('IMAM'));
        if (hasImam) tableCard.dataset.secret = 'imam';

        const createSeat = (name, g) => {
            const seatDiv = document.createElement('div');
            const effectiveGender = (g === 'L' || g === 'P') ? g : 'L';
            seatDiv.classList.add('seat-item', effectiveGender);
            if (name === '—') seatDiv.classList.add('empty-seat');

            const label = document.createElement('span');
            label.classList.add('seat-label');
            label.textContent = g === 'L' ? 'Laki-laki' : (g === 'P' ? 'Perempuan' : '?');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;

            seatDiv.appendChild(label);
            seatDiv.appendChild(nameSpan);
            return seatDiv;
        };

        tableCard.appendChild(createSeat(name1, gender));
        tableCard.appendChild(createSeat(name2, gender));

        // Attach 5-tap secret to Imam's card
        if (hasImam) {
            tableCard.addEventListener('click', () => {
                // Clear any accidental text selection
                window.getSelection()?.removeAllRanges();

                imamTapCount++;
                clearTimeout(imamTapTimer);
                if (imamTapCount >= 5) {
                    imamTapCount = 0;
                    openSecretModal();
                } else {
                    imamTapTimer = setTimeout(() => { imamTapCount = 0; }, 1500);
                }
            });
        }

        chartElement.appendChild(tableCard);
    });
}

// ─────────────────────────────────────────────
// 5. CONSTRAINT UI + localStorage
// ─────────────────────────────────────────────

const LS_KEY = 'xi4seat_constraints';

function saveConstraintsToStorage(text) {
    try { localStorage.setItem(LS_KEY, text); } catch (_) {}
}

function loadConstraintsFromStorage() {
    try { return localStorage.getItem(LS_KEY) || ''; } catch (_) { return ''; }
}

function getConstraintText() {
    const el = document.getElementById('constraints-input');
    return el ? el.value : '';
}

function updateConstraintPreview(people) {
    const text = getConstraintText();
    const { constraints, errors, warnings } = parseConstraints(text, people);

    // Badge
    const badge = document.getElementById('constraints-badge');
    if (badge) {
        badge.textContent = `${constraints.length} aturan`;
        badge.classList.toggle('has-rules', constraints.length > 0);
    }

    // Tags
    const tagsEl = document.getElementById('constraint-tags');
    if (tagsEl) {
        tagsEl.innerHTML = '';
        for (const c of constraints) {
            const tag = document.createElement('span');
            tag.classList.add('constraint-tag', `tag-${c.type}`);
            const icons = { together: '🤝', apart: '↔️', fixPos: '📍', fixRow: '📍', fixCol: '📍' };
            tag.textContent = `${icons[c.type] || ''} ${c.raw}`;
            tagsEl.appendChild(tag);
        }
        for (const w of warnings) {
            const tag = document.createElement('span');
            tag.classList.add('constraint-tag', 'tag-warning');
            tag.textContent = w;
            tagsEl.appendChild(tag);
        }
    }

    // Errors
    const errorsEl = document.getElementById('constraint-errors');
    if (errorsEl) {
        errorsEl.innerHTML = '';
        for (const e of errors) {
            const div = document.createElement('div');
            div.classList.add('constraint-error-item');
            div.innerHTML = e;
            errorsEl.appendChild(div);
        }
    }

    return { constraints, errors };
}

// ─────────────────────────────────────────────
// 6. PERSISTENCE
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
    const reshuffleBtn = document.getElementById('reshuffle-btn');
    if (!lockBtn) return;
    if (lockState.locked) {
        const remainingTime = lockState.unlockAt - Date.now();
        const days = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
        lockBtn.textContent = `🔒 Terkunci (${days} hari lagi)`;
        lockBtn.classList.add('locked');
        if (reshuffleBtn) { reshuffleBtn.disabled = true; reshuffleBtn.title = "Konfigurasi sedang dikunci."; }
    } else {
        lockBtn.textContent = `🔓 Kunci`;
        lockBtn.classList.remove('locked');
        if (reshuffleBtn) { reshuffleBtn.disabled = false; reshuffleBtn.title = ""; }
    }
}

// ─────────────────────────────────────────────
// 7. INIT
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

        // Parse and validate constraints BEFORE shuffling
        const constraintText = getConstraintText();
        const { constraints, errors } = parseConstraints(constraintText, rawData);

        if (errors.length > 0) {
            // Show errors in modal and open it
            const errorsEl = document.getElementById('constraint-errors');
            if (errorsEl) {
                errorsEl.innerHTML = '';
                for (const e of errors) {
                    const div = document.createElement('div');
                    div.classList.add('constraint-error-item');
                    div.innerHTML = e;
                    errorsEl.appendChild(div);
                }
            }
            openSecretModal();
            alert(`⚠ Tidak bisa mengacak: ada ${errors.length} aturan yang tidak valid. Periksa panel aturan.`);
            return;
        }

        const { pairs, warnings } = createSeatingPairsWithConstraints(rawData, constraints);

        // Show non-blocking warnings in tags area
        if (warnings.length > 0) {
            const tagsEl = document.getElementById('constraint-tags');
            if (tagsEl) {
                for (const w of warnings) {
                    const tag = document.createElement('span');
                    tag.classList.add('constraint-tag', 'tag-warning');
                    tag.textContent = w;
                    tagsEl.appendChild(tag);
                }
            }
        }

        seatingPairs = pairs;
        await saveSeatingPairs(seatingPairs);
    } else {
        console.log("Loading seating arrangement from server.");
    }

    renderSeatingChart(seatingPairs);
}

// ─────────────────────────────────────────────
// 8. EVENT LISTENERS
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    // Load saved constraints from localStorage into textarea
    const textarea = document.getElementById('constraints-input');
    if (textarea) {
        textarea.value = loadConstraintsFromStorage();
    }

    rawData = await loadNames();
    // Run live preview with saved constraints
    if (rawData.length > 0) updateConstraintPreview(rawData);
    initSeating();

    // Reshuffle button
    const reshuffleBtn = document.getElementById('reshuffle-btn');
    if (reshuffleBtn) {
        reshuffleBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin mengacak ulang tempat duduk?')) {
                initSeating(true);
            }
        });
    }

    // Download button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadAsImage);

    // Lock button
    const lockBtn = document.getElementById('lock-btn');
    if (lockBtn) lockBtn.addEventListener('click', toggleLock);

    // Secret modal — close button
    const closeBtn = document.getElementById('secret-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSecretModal);

    // Secret modal — close on backdrop click
    const backdrop = document.getElementById('secret-modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeSecretModal();
        });
    }

    // Secret modal — Save & Close button
    const saveBtn = document.getElementById('save-constraints-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const text = getConstraintText();
            const { errors } = updateConstraintPreview(rawData);
            if (errors.length > 0) {
                // Keep modal open, show errors
                return;
            }
            saveConstraintsToStorage(text);
            closeSecretModal();
        });
    }

    // Help toggle inside modal
    const helpToggle = document.getElementById('help-toggle');
    const helpPanel = document.getElementById('constraints-help');
    if (helpToggle && helpPanel) {
        helpToggle.addEventListener('click', () => helpPanel.classList.toggle('open'));
    }

    // Live parse preview on textarea input
    if (textarea) {
        textarea.addEventListener('input', () => updateConstraintPreview(rawData));
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSecretModal();
    });
});
