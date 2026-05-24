# Implementasi Foto Wajah & Nama di Setiap Kursi

Menambahkan foto wajah (avatar) dan nama di setiap kursi pada layout tempat duduk. Foto didapat dari `assets/faces/` yang sudah tersedia.

## Arsitektur Perubahan

Layout kursi saat ini hanya menampilkan:
- Label gender (Laki-laki / Perempuan)
- Nama lengkap (desktop) / Nama pendek (mobile)

Layout baru akan menampilkan:
- **Foto wajah** (avatar bulat)
- **Nama pendek** di bawah foto
- Label gender tetap ada tapi lebih subtle

```
┌─────────────────────────────┐
│  ┌──────────┐ ┌──────────┐  │
│  │  (foto)   │ │  (foto)  │  │
│  │   ○ ○     │ │   ○ ○    │  │
│  │  Hamzah   │ │  Imam    │  │
│  │ Laki-laki │ │ Laki-laki│  │
│  └──────────┘ └──────────┘  │
└─────────────────────────────┘
```

## Mapping Foto

Berikut mapping nama file foto ke nama pendek siswa. Perlu dibuatkan lookup di server/client:

| Short Name | Face File | Catatan |
|---|---|---|
| ADILAH | adilah.jpg | ✅ |
| ARI | ari.jpg | ✅ |
| FATHIYA | fathiya.jpg | ✅ |
| HABIBI | habibi.jpg | ✅ |
| HALIMATUN | halimatun.jpg | ✅ |
| HUMAIRA | humaira.jpg | ✅ |
| IMAM | imam.jpg | ✅ |
| INAYA | inaya.jpg | ✅ |
| INAYAH | inayah.jpg | ✅ |
| KAFFAH | kaffah.jpg | ✅ |
| KAILA | kaila.jpg | ✅ |
| KANIA | kania.jpg | ✅ |
| MAHIA | narasakhi.jpg | File pakai nama belakang |
| MIEZA | mieza.jpg | ✅ |
| FADLI | fadli.jpg | ✅ |
| RAJIB | rajib.jpg | ✅ |
| ALYAFI | alyafi.JPG | Ekstensi .JPG |
| DZIKRIE | dzikrie.jpg | ✅ |
| HAMZAH | hamzah.jpg | ✅ |
| TEGAR | tegar.jpg | ✅ |
| NABIL | nabil.jpeg | Ekstensi .jpeg |
| NADIRA | nadira.jpg | ✅ |
| NAHDAH | nahdah.jpg | ✅ |
| NAILAH | nailah.jpg | ✅ |
| NARESWARI | nares.jpg | File pakai singkatan |
| BOIM | boim.jpg | ✅ (Naufal Ibrahim) |
| MZ | mz.jpg | ✅ (Naufal Muhammad Zaki) |
| RAFIFAYDIN | rafif.jpg | File pakai singkatan |
| NAURA | naura.jpg / naura.JPG | Ada 2 file, pakai .jpg |
| NOVAL | tanjung.jpg | File pakai nama belakang |
| NURUL | nurul.jpg | ✅ |
| REGITHA | regita.jpg | Typo: file tanpa 'h' |
| SHAFFIRA | saffira.jpg | File tanpa 'h' |
| SYAFIQ | syafiq.jpg | ✅ |
| ZAHIRAH | zahirah.jpg | ✅ |
| FIRJATULLAH | firja.jpg | File pakai singkatan |

## Open Questions

> [!IMPORTANT]
> **Mapping foto**: Apakah mapping di atas sudah benar? Beberapa nama file foto tidak match langsung dengan short name (misalnya `tanjung.jpg` untuk NOVAL, `narasakhi.jpg` untuk MAHIA, `mz.jpg` untuk MZ/Naufal Muhammad Zaki).

> [!IMPORTANT]
> **Mobile layout**: Di mobile, apakah foto tetap ditampilkan (ukuran lebih kecil) atau dihilangkan untuk hemat space?

## Proposed Changes

### Server — Menambahkan data face di API

#### [MODIFY] [server.js](file:///home/normies/Projects/fourensic/server.js)

Tambahkan face image mapping di endpoint `/api/names`. Server akan mengembalikan field `face` untuk setiap siswa sehingga client tahu file foto mana yang harus di-load.

Pendekatan: hardcode mapping di server karena nama file tidak konsisten dengan short name.

---

### Client Script — Render foto di seat

#### [MODIFY] [script.js](file:///home/normies/Projects/fourensic/script.js)

Update `renderSeatingChart()` function:
1. Di fungsi `createSeat()`, tambahkan elemen `<img>` untuk foto wajah sebelum nama
2. Gunakan data `face` dari `rawData` untuk lookup URL foto
3. Tambahkan fallback ke default avatar jika foto tidak ditemukan
4. Foto ditampilkan sebagai lingkaran (circular avatar)

---

### Styling — Desain kursi baru dengan foto

#### [MODIFY] [style.css](file:///home/normies/Projects/fourensic/style.css)

Perubahan style:
1. `.seat-item` — ubah layout menjadi vertical stack (foto atas, nama bawah)
2. `.seat-avatar` — class baru untuk foto bulat (circular, `border-radius: 50%`, `object-fit: cover`)
3. Border color avatar mengikuti gender (biru untuk L, ungu untuk P)
4. Hover effect: subtle scale pada avatar
5. Responsive: foto lebih kecil di mobile, tetap ditampilkan
6. `.table-card` — sedikit perbesar padding untuk menampung foto

## Verification Plan

### Manual Verification
- Jalankan `npm run dev` / `node server.js`
- Buka halaman shuffler.html di browser
- Verifikasi setiap kursi menampilkan foto yang benar
- Test responsive di mobile viewport
- Verifikasi hover effects dan animasi
