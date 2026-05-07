# COMMAND.md — Xi4Seat Constraint Commands

Daftar perintah untuk panel **⚙️ Pengaturan Aturan Duduk** di halaman Shuffler.

---

## Cara Pakai

Buka panel pengaturan, lalu ketik satu perintah per baris. Setelah mengetik, pratinjau tag muncul otomatis di bawah kotak. Klik **Reshuffle** untuk menerapkan.

---

## Sintaks: `perintah nama [angka]`

### `together <Nama A> <Nama B>`
Paksa dua orang duduk di **meja yang sama**.

> **Error** jika keduanya berbeda jenis kelamin — reshuffle diblokir.

```
together Ari Habibi
together Adilah Humaira
together Naufal Ibrahim Naufal MZ
```

---

### `apart <Nama A> <Nama B>`
Pastikan dua orang **tidak sebangku**.

```
apart Nabil Tegar
apart Dzikrie Rajib
apart Hamzah Mahia
```

---

### `row <Nama> <N>`
Tempatkan seseorang di **baris N** (kolom bebas/acak).
Baris 1 = paling depan.

```
row Adilah 1
row Kaffah 2
row Noval Tanjung 3
```

---

### `col <Nama> <N>`
Tempatkan seseorang di **kolom N** (baris bebas/acak).
Kolom 1 = paling kiri. Grid = 4 kolom.

```
col Mieza 4
col Regitha 1
```

---

### `pos <Nama> <Baris> <Kolom>`
Tempatkan seseorang di **posisi tepat** (baris & kolom spesifik).

```
pos Humaira 1 2
pos Imam 2 3
pos Adilah 1 1
```

---

### `# komentar`
Baris yang diawali `#` diabaikan sepenuhnya.

```
# aturan untuk ujian semester
together Ari Habibi
# Nabil dan Tegar suka ribut
apart Nabil Tegar
```

---

## Catatan

| Hal | Keterangan |
|---|---|
| **Case-insensitive** | `ari`, `ARI`, `Ari` semua valid |
| **Nama multi-kata** | `Naufal Ibrahim`, `Noval Tanjung` didukung |
| **Gender error** | `together` beda gender → **error merah**, reshuffle ditolak |
| **Konflik aturan** | Seseorang di dua aturan `together` → peringatan kuning, aturan kedua diabaikan |
| **Out of bounds** | Baris/kolom melebihi ukuran grid → peringatan kuning, aturan diabaikan |
| **Nama tak ditemukan** | Error merah, reshuffle ditolak hingga diperbaiki |

---

## Contoh Lengkap

```
# Pasangan tetap
together Ari Habibi
together Adilah Humaira

# Yang harus dipisah
apart Nabil Tegar
apart Dzikrie Rajib

# Posisi khusus
pos Imam 1 1
row Kaffah 1
col Mieza 4
```
