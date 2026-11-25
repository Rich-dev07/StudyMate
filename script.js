// ================= AUDIO SYSTEM =================
let audioCtx = null;
let musicEnabled = false;
let musicNodes = [];

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playNotif(type = 'success') {
    if (!musicEnabled) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.1);
    } else if (type === 'error') {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.15);
    } else if (type === 'click') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    }
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function startMusic() {
    initAudio();
    if (musicNodes.length > 0) return;
    const chords = [
        [261.63, 329.63, 392.00],
        [392.00, 493.88, 587.33],
        [440.00, 523.25, 659.25],
        [349.23, 440.00, 523.25]
    ];
    let chordIndex = 0;
    function playChord() {
        if (!musicEnabled) return;
        const chord = chords[chordIndex % chords.length];
        chord.forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.5);
            gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 3.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 3.5);
            musicNodes.push(osc);
        });
        chordIndex++;
    }
    playChord();
    window.musicInterval = setInterval(playChord, 4000);
}

function stopMusic() {
    if (window.musicInterval) clearInterval(window.musicInterval);
    musicNodes.forEach(node => { try { node.stop(); } catch(e) {} });
    musicNodes = [];
}

function toggleAudio() {
    musicEnabled = !musicEnabled;
    const btn = document.getElementById('audio-btn');
    if (musicEnabled) {
        initAudio();
        startMusic();
        btn.innerText = '🔊';
        btn.classList.remove('muted');
        playNotif('success');
    } else {
        stopMusic();
        btn.innerText = '🔇';
        btn.classList.add('muted');
    }
}

// ================= DATA =================
let userProfile = {
    username: "Andi",
    nama: "Andi Pratama",
    email: "andi@student.ac.id",
    nim: "-",
    jurusan: "-",
    kelas: "-"
};

let tasks = [
    { id: 1, title: "Makalah AI", date: "2025-05-14", priority: "Tinggi", done: false },
    { id: 2, title: "Laporan Basis Data", date: "2025-05-10", priority: "Sedang", done: true },
    { id: 3, title: "Presentasi Web", date: "2025-05-18", priority: "Tinggi", done: false }
];

let schedules = [
    { id: 1, nama: "Matematika Diskrit", hari: "Senin", jamMulai: "08:00", jamSelesai: "10:00", ruang: "A1", sampai: "2025-07-31" },
    { id: 2, nama: "Basis Data", hari: "Rabu", jamMulai: "10:00", jamSelesai: "12:00", ruang: "B2", sampai: "2025-07-31" },
    { id: 3, nama: "Pemrograman Web", hari: "Jumat", jamMulai: "08:00", jamSelesai: "10:00", ruang: "C3", sampai: "2025-07-31" }
];

let currentDate = new Date(2025, 4, 1);

// ================= NAVIGASI =================
function showPage(pageId) {
    document.querySelectorAll('.phone > div').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(pageId);
    target.classList.remove('hidden');
    if (pageId !== 'page-login') target.style.display = 'flex';

    if (pageId === 'page-kalender') renderCalendar();
    if (pageId === 'page-tugas') {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn').classList.add('active');
        renderTasks('all');
    }
    if (pageId === 'page-jadwal') renderJadwal();
    if (pageId === 'page-dashboard') updateDashboard();
    if (pageId === 'page-profil') renderProfil();
    if (pageId === 'page-edit-profil') fillEditProfil();
}

// ================= LOGIN =================
function login() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (!user || !pass) {
        playNotif('error');
        alert("Username dan password wajib diisi bro!");
        return;
    }
    if (pass !== "12345") {
        playNotif('error');
        alert("Password salah!");
        return;
    }

    userProfile.username = user;
    document.getElementById('user-name-display').innerText = user;
    playNotif('success');
    showPage('page-dashboard');
}

function logout() { showPage('page-login'); }

// ================= DASHBOARD (DINAMIS) =================
function updateDashboard() {
    // Jumlah jadwal
    document.getElementById('dash-jadwal-count').innerText = schedules.length;
    // Jumlah tugas belum selesai
    document.getElementById('dash-tugas-count').innerText = tasks.filter(t => !t.done).length;
    // Deadline: tugas belum selesai yang jatuh tempo <= 3 hari dari sekarang
    const today = new Date();
    today.setHours(0,0,0,0);
    const soon = tasks.filter(t => {
        if (t.done) return false;
        const d = new Date(t.date);
        d.setHours(0,0,0,0);
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 3;
    }).length;
    document.getElementById('dash-deadline-count').innerText = soon;
}

// ================= JADWAL =================
function renderJadwal() {
    const container = document.getElementById('jadwal-list-container');
    container.innerHTML = '';

    if (schedules.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:gray; font-size:12px; margin-top:20px;">Belum ada jadwal. Klik + untuk menambah.</p>';
        return;
    }

    // Urut hari Senin-Minggu
    const order = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
    const sorted = [...schedules].sort((a,b) => order.indexOf(a.hari) - order.indexOf(b.hari));

    sorted.forEach(s => {
        const item = document.createElement('div');
        item.classList.add('list-item');
        item.innerHTML = `
            <div class="date-box">${s.hari.substring(0,3)}<span>📅</span></div>
            <div class="item-info">
                <div class="item-title">${s.nama}</div>
                <div class="item-sub">${s.jamMulai} - ${s.jamSelesai} • Ruang ${s.ruang}</div>
            </div>
            <div class="jadwal-actions">
                <button class="icon-btn delete" onclick="hapusJadwal(${s.id})" title="Hapus">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function simpanJadwal() {
    const nama = document.getElementById('input-jadwal-nama').value.trim();
    const hari = document.getElementById('input-jadwal-hari').value;
    const mulai = document.getElementById('input-jadwal-mulai').value;
    const selesai = document.getElementById('input-jadwal-selesai').value;
    const ruang = document.getElementById('input-jadwal-ruang').value.trim();
    const sampai = document.getElementById('input-jadwal-sampai').value; // 🆕

    if (!nama || !mulai || !selesai || !ruang) {
        playNotif('error');
        alert("Isi semua field dulu bro!");
        return;
    }
    if (mulai >= selesai) {
        playNotif('error');
        alert("Jam selesai harus lebih dari jam mulai!");
        return;
    }

    // Kalau "sampai" kosong, pakai 1 minggu dari hari ini sebagai default
    let sampaiFix = sampai;
    if (!sampaiFix) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        sampaiFix = d.toISOString().split('T')[0];
    }

    schedules.push({ id: Date.now(), nama, hari, jamMulai: mulai, jamSelesai: selesai, ruang, sampai: sampaiFix });
    playNotif('success');

    document.getElementById('input-jadwal-nama').value = '';
    document.getElementById('input-jadwal-mulai').value = '';
    document.getElementById('input-jadwal-selesai').value = '';
    document.getElementById('input-jadwal-ruang').value = '';
    document.getElementById('input-jadwal-sampai').value = ''; // 🆕

    showPage('page-jadwal');
}

function hapusJadwal(id) {
    if (!confirm("Hapus jadwal ini?")) return;
    schedules = schedules.filter(s => s.id !== id);
    playNotif('click');
    renderJadwal();
    updateDashboard();
}

// ================= TUGAS =================
function renderTasks(filter) {
    const container = document.getElementById('task-list-container');
    container.innerHTML = '';
    let filteredTasks = tasks;
    if (filter === 'todo') filteredTasks = tasks.filter(t => !t.done);
    if (filter === 'done') filteredTasks = tasks.filter(t => t.done);

    if (filteredTasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:gray; font-size:12px; margin-top:20px;">Tidak ada tugas.</p>';
        return;
    }
    filteredTasks.forEach(task => {
        const item = document.createElement('div');
        item.classList.add('task-item');
        const badgeClass = task.done ? 'badge-success' : 'badge-danger';
        const badgeText = task.done ? 'Selesai' : 'Belum';
        const dateColor = task.done ? 'done' : '';
        item.innerHTML = `
            <div class="task-left">
                <div class="task-checkbox ${task.done ? 'done' : ''}" onclick="toggleTask(${task.id})">
                    ${task.done ? '✓' : ''}
                </div>
                <div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-deadline ${dateColor}">📅 ${task.date}</div>
                </div>
            </div>
            <div class="badge ${badgeClass}">${badgeText}</div>
        `;
        container.appendChild(item);
    });
}

function filterTasks(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTasks(type);
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) task.done = !task.done;
    playNotif(task.done ? 'success' : 'click');
    const activeFilter = document.querySelector('.filter-btn.active').innerText;
    let filterType = 'all';
    if (activeFilter === 'Belum Selesai') filterType = 'todo';
    if (activeFilter === 'Selesai') filterType = 'done';
    renderTasks(filterType);
    updateDashboard();
}

function simpanTugas() {
    const nama = document.getElementById('input-tugas-nama').value.trim();
    const tgl = document.getElementById('input-tugas-tgl').value;
    const prio = document.getElementById('input-tugas-prioritas').value;

    if (!nama || !tgl) {
        playNotif('error');
        alert("Isi nama dan tanggal dulu bro!");
        return;
    }

    tasks.push({ id: Date.now(), title: nama, date: tgl, priority: prio, done: false });
    playNotif('success');

    document.getElementById('input-tugas-nama').value = '';
    document.getElementById('input-tugas-tgl').value = '';

    showPage('page-tugas');
}

// ================= PROFIL =================
function renderProfil() {
    document.getElementById('profile-name').innerText = userProfile.nama;
    document.getElementById('profile-email').innerText = userProfile.email;
    document.getElementById('profile-extra').innerText =
        `NIM: ${userProfile.nim || '-'} • Kelas: ${userProfile.kelas || '-'}`;
}

function fillEditProfil() {
    document.getElementById('edit-nama').value = userProfile.nama;
    document.getElementById('edit-email').value = userProfile.email;
    document.getElementById('edit-nim').value = userProfile.nim === '-' ? '' : userProfile.nim;
    document.getElementById('edit-jurusan').value = userProfile.jurusan === '-' ? '' : userProfile.jurusan;
    document.getElementById('edit-kelas').value = userProfile.kelas === '-' ? '' : userProfile.kelas;
}

function simpanProfil() {
    const nama = document.getElementById('edit-nama').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const nim = document.getElementById('edit-nim').value.trim();
    const jurusan = document.getElementById('edit-jurusan').value.trim();
    const kelas = document.getElementById('edit-kelas').value.trim();

    if (!nama || !email) {
        playNotif('error');
        alert("Nama dan email wajib diisi!");
        return;
    }

    userProfile.nama = nama;
    userProfile.email = email;
    userProfile.nim = nim || '-';
    userProfile.jurusan = jurusan || '-';
    userProfile.kelas = kelas || '-';

    playNotif('success');
    alert("Profil berhasil diperbarui!");
    showPage('page-profil');
}

    // ================= KALENDER =================
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
 "Agustus", "September", "Oktober", "November", "Desember"];

const HARI_INDEX = { "Minggu": 0, "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6 };

// 🆕 State tanggal yang dipilih
let selectedDate = null;

// Helper: Date → "YYYY-MM-DD"
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Helper: dapatkan Senin & Minggu dari minggu yang berisi tanggal tertentu
function getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day === 0) ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return { monday, sunday };
}

// Ambil event di rentang tanggal
function getEventsInRange(startDate, endDate) {
    const events = [];
    const startStr = toDateStr(startDate);
    const endStr = toDateStr(endDate);

    // TUGAS
    tasks.forEach(t => {
        if (t.date >= startStr && t.date <= endStr) {
            const day = parseInt(t.date.split('-')[2]);
            events.push({
                date: t.date, day,
                title: `📝 ${t.title}`,
                type: 'task',
                done: t.done
            });
        }
    });

    // JADWAL (BERULANG)
    schedules.forEach(s => {
        if (!HARI_INDEX.hasOwnProperty(s.hari)) return;
        const targetDay = HARI_INDEX[s.hari];
        const sampaiDate = s.sampai ? new Date(s.sampai + 'T23:59:59') : null;

        let cursor = new Date(startDate);
        while (cursor.getDay() !== targetDay) {
            cursor.setDate(cursor.getDate() + 1);
        }
        while (cursor <= endDate) {
            if (sampaiDate && cursor > sampaiDate) break;
            events.push({
                date: toDateStr(cursor),
                day: cursor.getDate(),
                title: `📅 ${s.nama} (${s.jamMulai}-${s.jamSelesai})`,
                type: 'schedule'
            });
            cursor.setDate(cursor.getDate() + 7);
        }
    });

    return events;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('cal-month-year').innerText = `${monthNames[month]} ${year}`;
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = (firstDay === 0) ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    const monthEvents = getEventsInRange(monthStart, monthEnd);
    const eventDays = new Set(monthEvents.map(e => e.day));

    const today = new Date();
    const todayStr = toDateStr(today);

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.classList.add('day-cell');
        grid.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.classList.add('day-cell');
        day.innerText = i;

        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;

        if (eventDays.has(i)) day.classList.add('has-event');
        if (dateStr === todayStr) day.classList.add('today');
        if (dateStr === selectedDate) day.classList.add('selected');

        // 🆕 BIAR BISA DIKLIK
        day.onclick = () => selectDate(dateStr);

        grid.appendChild(day);
    }

    renderWeekAgenda();
}

// 🆕 Handler klik tanggal
function selectDate(dateStr) {
    selectedDate = dateStr;

    // Sinkronkan currentDate ke bulan tanggal yang diklik
    const [y, m, d] = dateStr.split('-').map(Number);
    currentDate = new Date(y, m - 1, d);

    playNotif('click');
    renderCalendar();
}

// 🆕 GANTI BULAN (ini yang hilang!)
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    selectedDate = null;
    playNotif('click');
    renderCalendar();
}

function renderWeekAgenda() {
    const evList = document.getElementById('cal-events-list');
    evList.innerHTML = '';

    // Acuan minggu:
    // - kalau ada tanggal dipilih → minggu dari tanggal itu
    // - kalau currentDate = bulan sekarang → minggu hari ini
    // - selain itu → minggu dari tanggal 1 bulan yang dilihat
    let refDate;
    if (selectedDate) {
        const [y, m, d] = selectedDate.split('-').map(Number);
        refDate = new Date(y, m - 1, d);
    } else {
        const today = new Date();
        if (currentDate.getFullYear() === today.getFullYear() &&
            currentDate.getMonth() === today.getMonth()) {
            refDate = today;
        } else {
            refDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        }
    }

    const { monday, sunday } = getWeekRange(refDate);
    const events = getEventsInRange(monday, sunday);

    const label = `📆 ${monday.getDate()} ${monthNames[monday.getMonth()].substring(0,3)} – ${sunday.getDate()} ${monthNames[sunday.getMonth()].substring(0,3)} ${sunday.getFullYear()}`;
    evList.innerHTML = `<div style="font-size:11px; color:var(--text-light); margin-bottom:8px;">${label}</div>`;

    if (events.length === 0) {
        evList.innerHTML += '<p style="font-size:12px; color:gray;">Tidak ada agenda minggu ini.</p>';
        return;
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    const grouped = {};
    events.forEach(ev => {
        if (!grouped[ev.date]) grouped[ev.date] = [];
        grouped[ev.date].push(ev);
    });

    Object.keys(grouped).sort().forEach(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const items = grouped[dateStr];
        items.forEach(ev => {
            const isTask = ev.type === 'task';
            const color = isTask ? (ev.done ? '#9ca3af' : 'var(--danger)') : 'var(--primary)';
            evList.innerHTML += `<div class="list-item" style="padding:10px; margin-bottom:5px;">
                <div class="date-box" style="padding: 2px 8px; font-size:10px; color:${color};">
                    ${d}<span style="font-size:12px;">${monthNames[m-1].substring(0,3)}</span></div>
                <div class="item-info">
                    <div class="item-title" style="font-size:12px; ${isTask && ev.done ? 'text-decoration:line-through; color:gray;' : ''}">
                        ${ev.title}
                    </div>
                </div>
            </div>`;
        });
    });
}

// ================= INISIALISASI =================
updateDashboard();
document.getElementById('input-tugas-tgl').valueAsDate = new Date();
document.getElementById('audio-btn').classList.add('muted');
document.getElementById('audio-btn').innerText = '🔇';