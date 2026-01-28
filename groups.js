
// --- 1. State ---
let students = [];

// --- 2. Helper Functions ---

// Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
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

// --- 3. Core Logic ---

function createGroups(people, count) {
    if (count <= 0) return [];

    // Shuffle the names first
    const shuffled = [...people];
    shuffle(shuffled);

    const groups = Array.from({ length: count }, () => []);

    // Distribute names into groups
    shuffled.forEach((person, index) => {
        groups[index % count].push(person);
    });

    return groups;
}

function renderGroups(groups) {
    const container = document.getElementById('groups-container');
    if (!container) return;

    container.innerHTML = '';

    if (groups.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Gagal membuat kelompok.</p></div>';
        return;
    }

    groups.forEach((group, index) => {
        const groupCard = document.createElement('div');
        groupCard.classList.add('group-card');

        const groupHeader = document.createElement('div');
        groupHeader.classList.add('group-header');
        groupHeader.innerHTML = `<h3>Kelompok ${index + 1}</h3><span class="member-count">${group.length} Orang</span>`;

        const memberList = document.createElement('ul');
        memberList.classList.add('member-list');

        group.forEach(person => {
            const li = document.createElement('li');
            li.classList.add('member-item', person.gender);
            li.innerHTML = `
                <span class="member-name">${person.nama}</span>
                <span class="gender-pill">${person.gender}</span>
            `;
            memberList.appendChild(li);
        });

        groupCard.appendChild(groupHeader);
        groupCard.appendChild(memberList);
        container.appendChild(groupCard);
    });
}

// --- 4. Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
    students = await loadNames();

    const generateBtn = document.getElementById('generate-groups-btn');
    const groupInput = document.getElementById('group-count');

    if (generateBtn && groupInput) {
        generateBtn.addEventListener('click', () => {
            const count = parseInt(groupInput.value);
            if (isNaN(count) || count < 1) {
                alert('Silakan masukkan jumlah kelompok yang valid.');
                return;
            }
            if (count > students.length) {
                alert('Jumlah kelompok tidak boleh lebih banyak dari jumlah siswa.');
                return;
            }

            const groups = createGroups(students, count);
            renderGroups(groups);
        });
    }
});
