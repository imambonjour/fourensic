# Xi4Seat • Modern Seating Chart System

Xi4Seat adalah sistem manajemen peta tempat duduk modern untuk kelas XI-4, dibangun dengan Node.js untuk memberikan pengalaman yang mulus, dinamis, dan terorganisir.

## ✨ Fitur Utama

-   **Reshuffle Cerdas**: Mengacak tempat duduk secara otomatis dengan tetap mempertahankan pasangan berdasarkan jenis kelamin (Pria dengan Pria, Wanita dengan Wanita).
-   **Penyimpanan Server-Side**: Konfigurasi tempat duduk disimpan secara permanen di server dalam format JSON yang dapat dibaca dan diedit secara manual.
-   **Riwayat Konfigurasi**: Halaman khusus untuk melihat riwayat pengacakan sebelumnya lengkap dengan pratinjau layout.
-   **Sistem Log**: Mencatat setiap aktivitas pengacakan untuk transparansi dan audit.
-   **Desain Modern & Responsif**: Antarmuka berbasis Glassmorphism yang indah dan optimal untuk berbagai ukuran perangkat.

## 🚀 Teknologi yang Digunakan

-   **Backend**: Node.js & Express.js
-   **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+)
-   **Persistence**: File-based storage (JSON) menggunakan `fs-extra`
-   **Styling**: Modern CSS Features (Gradients, Glassmorphism, Animations)

## 🛠️ Instalasi & Penggunaan

### Prasyarat
-   [Node.js](https://nodejs.org/) (Versi terbaru direkomendasikan)

### Langkah-langkah
1.  **Clone Repository**
    ```bash
    git clone https://github.com/shortmemor/xi4seat.git
    cd xi4seat
    ```

2.  **Instal Dependensi**
    ```bash
    npm install
    ```

3.  **Jalankan Server**
    ```bash
    npm start
    ```

4.  **Akses Aplikasi**
    Buka browser dan navigasi ke `http://localhost:3000`.

## 📂 Struktur Proyek

-   `server.js`: Logika server Express dan API.
-   `cache/`: (Automated) Menyimpan file konfigurasi JSON.
-   `logs/`: (Automated) Menyimpan catatan aktivitas pengacakan.
-   `index.html`: Halaman utama peta tempat duduk.
-   `history.html`: Halaman riwayat konfigurasi.
-   `script.js` & `history.js`: Logika frontend.
-   `style.css`: Desain dan animasi global.

## 📝 Catatan Konfigurasi
Aplikasi ini secara otomatis menangani zona waktu `Asia/Jakarta` untuk pencatatan log dan penamaan file guna memastikan konsistensi waktu lokal.

---
Dikembangkan dengan ❤️ untuk XI-4
