let suhuGlobal = 25; // Nilai default sebagai cadangan
// --- MODUL PENGINGAT (UNDO SYSTEM) ---
let riwayatDesain = []; // Gudang untuk menyimpan langkah-langkah sebelumnya
const MAX_UNDO = 20;    // Batas maksimal ingatan (agar tidak beban memori)
// --- MODUL PENGAMAN (DEBOUNCE SYSTEM) ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
// 1. DAFTAR TARGET ELEMEN (UI)
const ui = {
    h1: document.getElementById('judul-utama'),
    teksP: document.querySelector('.hero-text p'),
    wrapper: document.querySelector('.hero-image-wrapper'),
    foto: document.querySelector('.hero-image'),
    badge: document.querySelector('.floating-badge'), 
    remote: document.getElementById("remote-control"),
    inputJudul: document.getElementById('input-judul'),
    inputParagraf: document.getElementById('input-paragraf'),

    // --- TAMBAHKAN DUA BARIS INI (Kabel Warna) ---
    btn: document.querySelector('.btn-primary'), // Target untuk warna tombol
    auth: document.querySelector('.auth-box')    // Target untuk warna kotak login
};

// 2. VARIABEL GLOBAL (STATE)
let posX = 0, posY = 0; 
let bX = 0, bY = 0, bSize = 1; 
let glowColor = "#ff7f50"; 

// 3. SISTEM MEMORI (LOCAL STORAGE)

function simpanKeGudang() {
    // 1. Ambil data saat ini (sebelum diupdate)
    const dataLama = localStorage.getItem('nextora_master');
    
    // 2. Masukkan ke riwayat jika data lama ada dan berbeda
    if (dataLama) {
        riwayatDesain.push(JSON.parse(dataLama));
        // Jika sudah lebih dari 20, buang yang paling lama
        if (riwayatDesain.length > MAX_UNDO) riwayatDesain.shift();
    }
    if (!ui.h1 || !ui.teksP) return;

    const dataDesain = {
        urlFoto: ui.foto.src,
        judulBaru: document.getElementById('input-judul').value, 
        paragrafBaru: ui.teksP.innerText,
        font: document.getElementById('r-font').value,
        lebar: document.getElementById('r-lebar').value,
        rad: document.getElementById('r-rad').value,
        opac: document.getElementById('r-opac').value,
        glow: document.getElementById('r-glow').value,
        warnaGlow: glowColor,
        warnaMain: document.getElementById('r-col-main').value,
        warnaBtn: document.getElementById('r-col-btn').value,
        fotoX: posX,
        fotoY: posY,
        badgeX: bX,
        badgeY: bY,
        badgeSize: bSize,
        isDark: document.body.classList.contains('dark-theme')
    };
    
    localStorage.setItem('nextora_master', JSON.stringify(dataDesain));
    // UPDATE STATUS MEMORI SETELAH SIMPAN
    updateMemoryStatus();

// Versi hemat daya dari fungsi simpan
const simpanAman = debounce(() => {
    simpanKeGudang();
}, 500); // Menunggu 0.5 detik setelah geser terakhir

    // --- LOGIKA LAMPU MELAYANG (VERSI CLASS) ---
const status = document.getElementById('save-status');
if (status) {
    // Cukup tambah class 'active', CSS akan mengurus animasi turun & nyala
    status.classList.add('active'); 
    
    // Suara tetap dijalankan di sini
    mainkanSuaraSinyal(880, 0.1); 
    
    // Reset timer (Anti-Blinking)
    if (window.saveTimeout) clearTimeout(window.saveTimeout);
    
    window.saveTimeout = setTimeout(() => {
        // Cukup hapus class 'active', CSS akan menarik lampu ke atas & redup
        status.classList.remove('active'); 
    }, 1500);
}
}
// Update bar memori juga
    if (typeof updateMemoryStatus === "function") updateMemoryStatus();
// 2. JALUR PENGAMAN (KAPASITOR)
const simpanAman = debounce(() => {
    console.log("Menjalankan simpan aman...");
    simpanKeGudang(); 
}, 500);

function jalankanUndo() {
    if (riwayatDesain.length > 0) {
        const desainSebelumnya = riwayatDesain.pop();
        
        // Simpan data lama ke localStorage
        localStorage.setItem('nextora_master', JSON.stringify(desainSebelumnya));
        
        // PANGGIL PENYALUR VISUAL
        muatUlangTampilan(); 

        mainkanSuaraSinyal(440, 0.2); 
        
        const status = document.getElementById('save-status');
        if (status) {
            status.innerText = "↩️ UNDO BERHASIL";
            status.classList.add('active');
            setTimeout(() => { 
                status.classList.remove('active');
                status.innerText = "● DATA SYNCED TO MEMORY";
            }, 1000);
        }
    }
}

function muatUlangTampilan() {
    const data = JSON.parse(localStorage.getItem('nextora_master'));
    if (!data) return;

    // --- 1. SINKRONISASI INPUT DI MASTER CONSOLE ---
    if (ui.inputJudul) ui.inputJudul.value = data.judulBaru || "";
    if (ui.inputParagraf) ui.inputParagraf.value = data.paragrafBaru || "";
    
    // Perhatikan nama variabelnya: harus sesuai dengan simpanKeGudang (warnaMain, warnaBtn, dll)
    const inColMain = document.getElementById('r-col-main');
    const inColBtn = document.getElementById('r-col-btn');
    const inFont = document.getElementById('r-font');

    if (inColMain) inColMain.value = data.warnaMain || "#2c5850";
    if (inColBtn) inColBtn.value = data.warnaBtn || "#a78b03";
    if (inFont) inFont.value = data.font || "48";

    // --- 2. TEMBAKKAN KE VISUAL (LIVE PREVIEW) ---
    // Gunakan fungsi muatDariGudang yang sudah Bapak punya karena di sana logikanya sudah lengkap
    muatDariGudang(); 

    console.log("↩️ Undo Berhasil: Data Sinkron!");
}

function muatDariGudang() {
    const catatan = JSON.parse(localStorage.getItem('nextora_master'));
    
    // --- 1. SETINGAN DEFAULT (PENYELAMAT SAAT RESET) ---
    const teksDefault = "Mari Berkebun";
    const judulFinal = (catatan && catatan.judulBaru) ? catatan.judulBaru : teksDefault;
    const warnaDefault = (catatan && catatan.warnaBtn) ? catatan.warnaBtn : "#ff7f50";

    // --- 2. MUAT JUDUL (ANTI-HILANG & ANTI-TUMPUK) ---
    if (ui.h1) {
        ui.h1.textContent = ""; // Cuci bersih wadah h1
        ui.h1.innerHTML = `<div class="typing-container"><span class="typing-skeleton">${judulFinal}</span><span class="typing-text">${judulFinal}</span></div>`;
        
        const cat = ui.h1.querySelector('.typing-text');
        if (cat) cat.style.color = warnaDefault;
        
        ui.h1.style.fontSize = (catatan && catatan.font ? catatan.font : 48) + "px";
    }

    if (ui.inputJudul) ui.inputJudul.value = judulFinal;

    // --- SAKLAR PENGAMAN ---
    if (!catatan) return; // Jika habis reset, berhenti di sini agar tidak error

    // --- 3. MUAT DATA LAINNYA ---
    if (catatan.paragrafBaru && ui.teksP) ui.teksP.innerText = catatan.paragrafBaru;
    if (ui.inputParagraf) ui.inputParagraf.value = catatan.paragrafBaru || "";
    if (catatan.urlFoto && ui.foto) ui.foto.src = catatan.urlFoto;
    if (ui.wrapper) ui.wrapper.style.width = (catatan.lebar || 450) + "px";

    // Navigasi & Efek Foto
    posX = catatan.fotoX || 0; 
    posY = catatan.fotoY || 0;
    if (ui.foto) {
        ui.foto.style.transform = `translate(${posX}px, ${posY}px)`;
        ui.foto.style.borderRadius = (catatan.rad || 30) + "px";
        ui.foto.style.opacity = catatan.opac || 1;
        ui.foto.style.boxShadow = `0 0 ${catatan.glow || 0}px ${catatan.warnaGlow || "#ff7f50"}`;
    }

    // Warna Tema (Auth & Badge)
    if (catatan.warnaMain) {
        if (ui.auth) ui.auth.style.setProperty('background-color', catatan.warnaMain, 'important');
        if (ui.badge) ui.badge.style.setProperty('background-color', catatan.warnaMain, 'important');
        const inputColMain = document.getElementById('r-col-main');
        if (inputColMain) inputColMain.value = catatan.warnaMain;
    }

    // Sinkronkan Tombol & Slider Warna
    if (catatan.warnaBtn) {
        const inputColBtn = document.getElementById('r-col-btn');
        if (inputColBtn) inputColBtn.value = catatan.warnaBtn;
        document.documentElement.style.setProperty('--btn-color', catatan.warnaBtn);
    }

    // Dark Mode
    if (catatan.isDark) {
        document.body.classList.add('dark-theme');
        const btnDark = document.getElementById('btn-dark-mode');
        if (btnDark) btnDark.innerText = "☀️ Light Mode";
    }

    // Posisi Badge
    bX = catatan.badgeX || 0; 
    bY = catatan.badgeY || 0; 
    bSize = catatan.badgeSize || 1;
    
    if (document.getElementById('r-badge-x')) document.getElementById('r-badge-x').value = bX;
    if (document.getElementById('r-badge-y')) document.getElementById('r-badge-y').value = bY;
    if (document.getElementById('r-badge-size')) document.getElementById('r-badge-size').value = bSize;

    updateBadge();
}

function updateBadge() {
    if (!ui.badge) return; // Langsung keluar kalau badge tidak ada

    // 1. Ambil nilai angka
    const scaleVal = parseFloat(bSize) || 1;
    const xVal = parseFloat(bX) || 0;
    const yVal = parseFloat(bY) || 0;
    
    // 2. Solder Langsung ke Elemen (Metode Terkuat Bapak)
    const gayaBaru = `translate(${xVal}px, ${yVal}px) scale(${scaleVal})`;
    ui.badge.style.setProperty('transform', gayaBaru, 'important');
    
    // 3. Update Indikator Angka di Remote (Cek elemen satu-satu agar aman)
    const vX = document.getElementById('v-badge-x');
    const vY = document.getElementById('v-badge-y');
    const vS = document.getElementById('v-badge-size');

    if (vX) vX.innerText = xVal + "px";
    if (vY) vY.innerText = yVal + "px";
    if (vS) vS.innerText = scaleVal;
    
    // Debugging (Bisa dihapus kalau sudah lancar)
    console.log("Badge bergerak ke:", gayaBaru);
}

// ==========================================
// 5. EVENT LISTENERS (JANTUNG KENDALI)
// ==========================================

// --- DARK MODE SAKLAR ---
const btnDark = document.getElementById('btn-dark-mode');
if (btnDark) {
    btnDark.onclick = function() {
        document.body.classList.toggle('dark-theme');
        this.innerText = document.body.classList.contains('dark-theme') ? "☀️ Light Mode" : "🌙 Dark Mode";
        simpanAman();
    };
}

// --- LIVE TEXT EDITOR --- //
ui.inputJudul?.addEventListener('input', function() { 
    if (ui.h1) {
        const teksBaru = this.value;
        
        // 1. Sedot habis isi lama (Penting!)
        ui.h1.textContent = ""; 
        
        // 2. Pasang kabel baru
        const struktur = `<div class="typing-container">
            <span class="typing-skeleton">${teksBaru}</span>
            <span class="typing-text">${teksBaru}</span>
        </div>`;
        
        ui.h1.innerHTML = struktur;
        
        // 3. Reset Animasi agar jalan lagi
        const target = ui.h1.querySelector('.typing-text');
        if (target) {
            target.style.animation = 'none';
            void target.offsetWidth; // Trigger restart
            target.style.animation = null;
            
            // Samakan warna dengan tombol
            const warna = document.getElementById('r-col-btn').value;
            target.style.color = warna;
        }
    }
    simpanAman(); 
});

ui.inputParagraf?.addEventListener('input', function() { 
    if (ui.teksP) ui.teksP.innerText = this.value; 
    simpanAman(); 
});

// --- KENDALI TYPOGRAPHY & LAYOUT ---
document.getElementById('r-font')?.addEventListener('input', function() { 
    const nilaiBaru = this.value;

    // JALUR UTAMA: Kirim langsung ke Pusat (:root)
    // Ini akan mengubah semua elemen (skeleton & text) secara bersamaan
    document.documentElement.style.setProperty('--judul-size', nilaiBaru + "px"); 
    
    // Update angka indikator di remote
    const display = document.getElementById('v-font');
    if (display) display.innerText = nilaiBaru + "px"; 
    
    simpanAman(); 
});
document.getElementById('r-lebar')?.addEventListener('input', function() { 
    // Kita ubah maxWidth-nya, bukan width-nya
    if (ui.wrapper) ui.wrapper.style.maxWidth = this.value + "px"; 
    
    const display = document.getElementById('v-lebar');
    if (display) display.innerText = this.value + "px"; 
    simpanAman(); 
});

// --- KENDALI NAVIGASI FOTO (X) ---
document.getElementById('r-foto-x')?.addEventListener('input', function() { 
    posX = parseFloat(this.value) || 0; // Pastikan ini angka, kalau gagal jadi 0
    document.documentElement.style.setProperty('--foto-x', posX + "px"); 
    
    // Update angka indikator biar Bapak tahu JS-nya kerja
    const vX = document.getElementById('v-foto-x');
    if(vX) vX.innerText = posX + "px";
    
    simpanAman(); 
});

// --- KENDALI NAVIGASI FOTO (Y) ---
document.getElementById('r-foto-y')?.addEventListener('input', function() { 
    posY = parseFloat(this.value) || 0; 
    document.documentElement.style.setProperty('--foto-y', posY + "px"); 
    
    const vY = document.getElementById('v-foto-y');
    if(vY) vY.innerText = posY + "px";
    
    simpanAman(); 
});
// --- EFEK VISUAL FOTO (RADIUS, OPACITY, GLOW) ---
document.getElementById('r-rad')?.addEventListener('input', function() { 
    if (ui.foto) ui.foto.style.borderRadius = this.value + "px"; 
    const display = document.getElementById('v-rad');
    if (display) display.innerText = this.value + "px"; 
    simpanAman(); 
});

document.getElementById('r-opac')?.addEventListener('input', function() { 
    if (ui.foto) ui.foto.style.opacity = this.value; 
    const display = document.getElementById('v-opac');
    if (display) display.innerText = this.value; 
    simpanAman(); 
});

document.getElementById('r-glow')?.addEventListener('input', function() { 
    if (ui.foto) ui.foto.style.boxShadow = `0 0 ${this.value}px ${glowColor}`; 
    const display = document.getElementById('v-glow');
    if (display) display.innerText = this.value + "px"; 
    simpanAman(); 
});

document.getElementById('r-glow-color')?.addEventListener('input', function() { 
    glowColor = this.value; 
    const rangeGlow = document.getElementById('r-glow')?.value || 0;
    if (ui.foto) ui.foto.style.boxShadow = `0 0 ${rangeGlow}px ${glowColor}`; 
    simpanAman(); 
});

// --- KENDALI WARNA TEMA (SINKRONISASI) ---
document.getElementById('r-col-main')?.addEventListener('input', function() { 
    const warna = this.value;
    
    // Mengubah warna kotak login (auth-box)
    if (ui.auth) ui.auth.style.setProperty('background-color', warna, 'important'); 
    
    // Mengubah warna background badge
    if (ui.badge) ui.badge.style.setProperty('background-color', warna, 'important'); 
    
    simpanAman(); 
});

// --- KENDALI WARNA TOMBOL (DUAL BUTTON) ---
document.getElementById('r-col-btn')?.addEventListener('input', function() { 
    const warnaBaru = this.value;

    document.documentElement.style.setProperty('--btn-color', warnaBaru);

    simpanAman(); 
});

// --- KENDALI NAVIGASI BADGE (LENGKAP: X, Y, SIZE) ---

// Kabel untuk Geser Kiri-Kanan
document.getElementById('r-badge-x')?.addEventListener('input', function() { 
    bX = this.value; 
    updateBadge(); 
    simpanAman();
});

// Kabel untuk Geser Atas-Bawah (PASTIKAN INI ADA)
document.getElementById('r-badge-y')?.addEventListener('input', function() { 
    bY = this.value; 
    updateBadge(); 
    simpanAman();
});

// Kabel untuk Ukuran/Skala (PASTIKAN INI ADA)
document.getElementById('r-badge-size')?.addEventListener('input', function() { 
    bSize = this.value; 
    updateBadge(); 
    simpanAman();
});
// ==========================================
// 6. FITUR RESET (DENGAN AUDIO FEEDBACK)
// ==========================================
const btnReset = document.getElementById('btn-reset-layout');

if (btnReset) {
    btnReset.onclick = function() {
        // 1. Tes sinyal suara (Nada 440Hz = Nada A4, lebih ngebass)
        mainkanSuaraSinyal(440, 0.3); 
        
        console.log("Sinyal Reset Terkirim...");

        // 2. Beri jeda 300ms supaya suara "Beep" tidak terpotong oleh refresh halaman
        setTimeout(() => {
            localStorage.removeItem('nextora_master');
            location.reload();
        }, 300);
    };
}

function makeDraggable(el, handleId) {
    const handle = document.getElementById(handleId) || el;
    if (!handle) return;

    handle.onmousedown = function(e) {
        e.preventDefault();

        // Titik awal saat klik (untuk referensi pengunci)
        let startX = e.clientX;
        let startY = e.clientY;
        
        let initialLeft = el.getBoundingClientRect().left;
        let initialTop = el.getBoundingClientRect().top;

        function move(e) {
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;

            // --- FITUR PENGUNCI (SHIFT KEY) ---
            if (e.shiftKey) {
                // Jika geseran horizontal lebih besar, kunci Vertikal (begitu sebaliknya)
                if (Math.abs(dx) > Math.abs(dy)) {
                    dy = 0; // Kunci: Hanya bisa kiri-kanan
                } else {
                    dx = 0; // Kunci: Hanya bisa atas-bawah
                }
            }

            let x = initialLeft + dx;
            let y = initialTop + dy;

            // --- SNAP TO GRID 10px ---
            x = Math.round(x / 10) * 10;
            y = Math.round(y / 10) * 10;

            // --- BOUNDARY (Pembatas Layar) ---
            x = Math.max(0, Math.min(x, window.innerWidth - el.offsetWidth));
            y = Math.max(0, Math.min(y, window.innerHeight - el.offsetHeight));

            el.style.left = x + "px";
            el.style.top = y + "px";
        }

        document.onmousemove = move;
        document.onmouseup = () => { 
            document.onmousemove = null;
            simpanAman(); 
        };
    };
}

makeDraggable(ui.remote, "remote-header");
// Ganti baris paling bawah menjadi:
makeDraggable(document.querySelector(".drag-box"));


//Tangkap Elemen Input Foto
const inputFotoUrl = document.getElementById('input-foto-url');
const inputFotoFile = document.getElementById('input-foto-file');

//Logika Ganti Foto
// --- LOGIKA JALUR A: URL ---
inputFotoUrl?.addEventListener('input', function() {
    const urlBaru = this.value.trim();
    if (urlBaru !== "") {
        ui.foto.src = urlBaru;
        simpanAman();
    }
});

// --- LOGIKA JALUR B: FILE LOKAL ---
inputFotoFile?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        ui.foto.src = event.target.result; // Mengubah file jadi teks Base64
        simpanAman();
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});
// --- FITUR EXPORT (DOWNLOAD JSON) ---
document.getElementById('btn-export')?.addEventListener('click', function() {
    const data = localStorage.getItem('nextora_master');
    if (!data) return alert("Belum ada data untuk diekspor!");

    // Ubah teks menjadi file virtual
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Buat link download rahasia
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nextora-desain-ronald.json'; // Nama file hasil download
    link.click();
    
    // Bersihkan memori
    URL.revokeObjectURL(url);
    alert("Desain berhasil diekspor menjadi file JSON!");
});

// --- FITUR IMPORT (UPLOAD JSON) ---
const inputImport = document.getElementById('input-import');
document.getElementById('btn-import-trigger')?.addEventListener('click', () => inputImport.click());

inputImport?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const dataPalsu = JSON.parse(event.target.result);
            // Simpan ke localStorage
            localStorage.setItem('nextora_master', JSON.stringify(dataPalsu));
            // Refresh halaman agar perubahan terlihat
            alert("Data berhasil di-import! Memperbarui halaman...");
            location.reload();
        } catch (err) {
            alert("File tidak valid! Pastikan file adalah hasil export Nextora.");
        }
    };

    if (file) reader.readAsText(file);
});
// --- FITUR ANIMASI LANJUTAN (STAGE ENTRANCE) ---
function jalankanAnimasiMasuk() {
    // Mencari semua elemen dengan class reveal
    const targets = document.querySelectorAll('.reveal-up, .reveal-right, .reveal-pop');
    
    targets.forEach((el, index) => {
        // Berikan jeda 400ms antar elemen (Efek Domino Slow Motion)
        setTimeout(() => {
            el.classList.add('active');
        }, 400 * index); 
    });
}
// ==========================================
// 8. STARTUP & GLOBAL LISTENERS
// ==========================================

// ==========================================
// 8. STARTUP & GLOBAL LISTENERS (VERSI PERBAIKAN)
// ==========================================

window.onload = function() {
    // 1. Ambil data dari memori
    muatDariGudang(); 
    
    // 2. Jalankan API Cuaca (Panggil Langsung di Sini)
    updateNextoraWeather(); // [1] Ambil data cuaca dulu... 

    // 3. Jalankan Jam
    setTimeout(() => {
        jalankanJamOperator(); // [2] Baru jalankan jam agar salamnya sudah bawa data suhu terbaru
    }, 500);
    
    // 4. Set Timer Auto-Update (30 Menit)
    setInterval(updateNextoraWeather, 1800000); 

    // 5. Update setiap 5 menit agar tidak membebani browser
    updateRunningTextSaham(); 
    setInterval(updateRunningTextSaham, 300000); 

    // 6. Jalankan animasi masuk
    jalankanAnimasiMasuk(); 

    // 7. Jalankan reveal layout
    document.querySelectorAll('.reveal-left, .reveal-right').forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), 300 * (i + 1));
    });

    // 8. Reset Animasi Ketikan
    const teksKetikan = document.querySelector('.typing-text');
    if (teksKetikan) {
        teksKetikan.style.animation = 'none';
        void teksKetikan.offsetWidth; 
        teksKetikan.style.animation = null; 
    }

    console.log("⚡ Nextora Engine: Online & Ready");
};

// Listener untuk Sembunyikan Master Console (Tombol H)
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') {
        if (ui.remote) {
            ui.remote.style.display = ui.remote.style.display === 'none' ? 'block' : 'none';
        }
    }
});
// --- MODUL AUDIO FEEDBACK (OSILATOR) ---
function mainkanSuaraSinyal(frekuensi = 880, durasi = 0.1) {
    // 1. Inisialisasi Audio (Seperti menyalakan alat ukur)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // 2. Setelan Gelombang (Sinus agar suaranya lembut)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frekuensi, audioCtx.currentTime); 
    
    // 3. Atur Volume (Gain) agar tidak terlalu berisik
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durasi);

    // 4. Sambungkan Kabel Virtual
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // 5. Jalankan Sinyal
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + durasi);
}
// --- FITUR PRESET WARNA (RADIO MEMORY SYSTEM) ---
function setPreset(tema) {
    let warnaUtama, warnaTombol, warnaGlow;

    // Konfigurasi Frekuensi Warna
    if (tema === 'emerald') {
        warnaUtama = "#2c5850"; warnaTombol = "#a78b03"; warnaGlow = "#ff7f50";
    } else if (tema === 'ocean') {
        warnaUtama = "#005f73"; warnaTombol = "#94d2bd"; warnaGlow = "#0a9396";
    } else if (tema === 'sunset') {
        warnaUtama = "#9b2226"; warnaTombol = "#ee9b00"; warnaGlow = "#bb3e03";
    }

    // 1. Update Nilai Input di Master Console
    document.getElementById('r-col-main').value = warnaUtama;
    document.getElementById('r-col-btn').value = warnaTombol;
    document.getElementById('r-glow-color').value = warnaGlow;
    
    // Update variabel global glowColor (jika Bapak menggunakannya)
    if (typeof glowColor !== 'undefined') glowColor = warnaGlow;

    // 2. Kirim Sinyal ke Visual (Live Update)
    // Mengupdate Header & Badge
    const header = document.querySelector('.auth-box');
    const badge = document.querySelector('.floating-badge');
    if (header) header.style.backgroundColor = warnaUtama;
    if (badge) badge.style.backgroundColor = warnaUtama;

    // Mengupdate Warna Tombol Utama (CSS Variable)
    document.documentElement.style.setProperty('--btn-color', warnaTombol);

    // 3. Feedback Suara & Simpan ke Memory
    mainkanSuaraSinyal(660, 0.2); // Nada preset sedikit lebih rendah/mantap
    simpanKeGudang(); // Panggil fungsi simpan yang sudah kita rapikan tadi
    
    console.log(`Sinyal ${tema.toUpperCase()} Aktif!`);
}
// --- MODUL MONITORING MEMORI (STORAGE SCANNER) ---
function updateMemoryStatus() {
    const data = localStorage.getItem('nextora_master');
    const memBar = document.getElementById('mem-bar');
    const memPercent = document.getElementById('mem-percent');
    const memDetail = document.getElementById('mem-detail');

    if (data && memBar) {
        const sizeInBytes = data.length; // 1 karakter = 1 byte
        const limit = 5242880; // Batas LocalStorage rata-rata 5MB
        const percentage = ((sizeInBytes / 1000) * 100).toFixed(2); // Kita buat skala 0-1000 byte untuk simulasi

        // Update Tampilan Visual
        memBar.style.width = percentage + "%";
        memPercent.innerText = percentage + "%";
        memDetail.innerText = `Kapasitas Terpakai: ${sizeInBytes} Bytes`;

        // Ubah warna bar jika memori mulai penuh (Overload)
        if (percentage > 80) {
            memBar.style.background = "#f44336"; // Merah (Warning)
        } else {
            memBar.style.background = "#4caf50"; // Hijau (Aman)
        }
    }
}
document.addEventListener('keydown', function(e) {
    // Jika tekan Ctrl + Z (atau Cmd + Z di Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault(); // Mencegah fungsi default browser
        jalankanUndo();
    }
});
// Rakit Logika Jam & Greeting
function jalankanJamOperator() {
    const clockTime = document.getElementById('digital-time');
    const clockDate = document.getElementById('current-date');
    const clockGreet = document.getElementById('greeting-text');

    setInterval(() => {
        const sekarang = new Date();
        
        // 1. Format Waktu (HH:MM:SS)
        const jam = String(sekarang.getHours()).padStart(2, '0');
        const menit = String(sekarang.getMinutes()).padStart(2, '0');
        const detik = String(sekarang.getSeconds()).padStart(2, '0');
        
        if (clockTime) clockTime.innerText = `${jam}:${menit}:${detik}`;
        // Tambahkan ini untuk cek di F12
    console.log("Jam berdetak: " + jam + ":" + menit + ":" + detik);
        
        // 2. Logika Salam (Greeting) yang Pintar
let salam = "";
if (jam >= 5 && jam < 11) {
    salam = suhuGlobal > 30 ? "Pagi yang terik, Pak Ronald. Jangan lupa air putih!" : "Selamat Pagi, Pak Ronald. Semangat berkebun!";
} else if (jam >= 11 && jam < 15) {
    salam = suhuGlobal > 32 ? "Siang yang sangat panas, Pak. Medan sedang membara!" : "Selamat Siang, Pak Ronald.";
} else if (jam >= 15 && jam < 18) {
    salam = "Selamat Sore, Pak. Waktunya cek tanaman.";
} else {
    salam = "Selamat Beristirahat, Pak Ronald.";
}

if (clockGreet) clockGreet.innerText = salam;

        // 3. Format Tanggal
        const opsi = { year: 'numeric', month: 'long', day: 'numeric' };
        if (clockDate) clockDate.innerText = sekarang.toLocaleDateString('id-ID', opsi);
        
    }, 1000);
}

// Panggil fungsinya di dalam window.onload agar langsung nyala
// Tambahkan di dalam window.onload = function() { ... } yang sudah Bapak punya
jalankanJamOperator();
let startTime, elapsedTime = 0, timerInterval;

function startStopwatch() {
    if (timerInterval) return; // Anti-double click
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateStopwatchDisplay(elapsedTime);
    }, 10); // Update setiap 10 milidetik
    mainkanSuaraSinyal(880, 0.05); // Suara klik kecil
}

function stopStopwatch() {
    clearInterval(timerInterval);
    timerInterval = null;
    mainkanSuaraSinyal(440, 0.05);
}

function resetStopwatch() {
    stopStopwatch();
    elapsedTime = 0;
    updateStopwatchDisplay(0);
}

function updateStopwatchDisplay(ms) {
    let m = Math.floor(ms / 60000);
    let s = Math.floor((ms % 60000) / 1000);
    let mili = Math.floor((ms % 1000) / 10);

    let tampil = 
        String(m).padStart(2, '0') + ":" + 
        String(s).padStart(2, '0') + "." + 
        String(mili).padStart(2, '0');
    
    document.getElementById('stopwatch-display').innerText = tampil;
}

// Kita gunakan fungsi 'async' agar JavaScript tahu kita akan menunggu proses (asinkron)
// --- UPDATE MODUL CUACA (VERSI PENYEMPURNAAN) ---
async function updateNextoraWeather() {
    const weatherElement = document.getElementById('nextora-weather');
    const displaySuhu = document.getElementById('weather-display');

    if (!weatherElement && !displaySuhu) return;

    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=3.5833&longitude=98.6667&current_weather=true');
        if (!response.ok) throw new Error();

        const data = await response.json();
        const suhu = Math.round(data.current_weather.temperature);
        suhuGlobal = suhu; // Simpan ke variabel global agar bisa dipakai di fungsi Jam
        
        // --- LOGIKA WARNA DINAMIS ---
        let warnaSuhu = "#00ff00"; // Default: Hijau Neon (Adem)
        let statusPesan = "NYAMAN";

        if (suhu >= 30) {
            warnaSuhu = "#ff4500"; // Oranye Kemerahan (Panas Terik)
            statusPesan = "TERIK";
        } else if (suhu < 25) {
            warnaSuhu = "#6a898fff"; // Biru Muda (Sejuk/Hujan)
            statusPesan = "SEJUK";
        }

        // Terapkan warna ke elemen
        [weatherElement, displaySuhu].forEach(el => {
            if (el) {
                el.innerText = `${suhu}°C (${statusPesan})`;
                el.style.color = warnaSuhu;
                el.style.textShadow = `0 0 10px ${warnaSuhu}`; // Efek lampu neon sesuai warna
            }
        });

        console.log(`[Sensor] Suhu Medan: ${suhu}°C. Status: ${statusPesan}`);

    } catch (error) {
        if (weatherElement) weatherElement.innerText = "Offline";
        console.error("Gagal sinkronisasi suhu");
    }
}
// --- Update JavaScript (Pasang "Antena" Data Saham) ---
async function updateRunningTextSaham() {
    const tickerWrapper = document.getElementById('stock-data-live');
    if (!tickerWrapper) return;

    const daftarSaham = [
        { kode: 'IHSG', harga: '7.245', persen: '+0.45', status: '▲' },
        { kode: 'BBCA', harga: '10.150', persen: '+1.25', status: '▲' },
        { kode: 'DEWA', harga: '800', persen: '0.00', status: '●' },
        { kode: 'TLKM', harga: '3.850', persen: '-0.50', status: '▼' }
    ];

    try {
        // Kita coba jalur proxy satu kali lagi dengan metode yang berbeda
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://query1.finance.yahoo.com/v7/finance/quote?symbols=^JKSE,DEWA.JK')}`);
        
        if (!response.ok) throw new Error("Offline");
        
        const json = await response.json();
        const data = JSON.parse(json.contents);
        const result = data.quoteResponse.result;

        if (result && result.length > 0) {
            // JIKA BERHASIL: Rakit data dari bursa
            let liveString = "";
            result.forEach(s => {
                const nama = s.symbol === '^JKSE' ? 'IHSG' : s.symbol.replace('.JK','');
                const warna = s.regularMarketChangePercent >= 0 ? "#00ff00" : "#ff4500";
                liveString += `<span style="color:white">${nama}:</span> <span style="color:${warna}">${s.regularMarketPrice} (${s.regularMarketChangePercent.toFixed(2)}%)</span> &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;`;
            });
            tickerWrapper.innerHTML = liveString + liveString;
            return;
        }
        throw new Error("Data Kosong");

    } catch (err) {
        // JIKA GAGAL (Kena 403 atau Offline): Gunakan Data Cadangan (Genset)
        let dummyString = "";
        daftarSaham.forEach(s => {
            const warna = s.persen.includes('+') ? "#00ff00" : (s.persen.includes('-') ? "#ff4500" : "#888");
            dummyString += `<span style="color:white">${s.kode}:</span> <span style="color:${warna}">${s.harga} (${s.persen}%)</span> &nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;`;
        });
        
        // Tambahkan indikator "Offline Mode" yang keren
        tickerWrapper.innerHTML = `<span style="color:#ffcc00">[OFFLINE MODE]</span> &nbsp;&nbsp;&nbsp;` + dummyString + dummyString;
        console.log("⚡ Nextora: Menggunakan Sinyal Cadangan (Offline Data)");
    }
}

