# Rumah Sakit ANAVERSE — Website & Platform Kesehatan Digital

Platform website rumah sakit digital yang dirancang untuk menyediakan informasi kesehatan dan meningkatkan pengalaman digital pasien.

**Status: Prototipe frontend.** Supabase belum dikonfigurasi. Seluruh data akun, janji temu, konsultasi, dan konten menggunakan data demo yang disimpan di `localStorage` browser. Tidak ada email, pembayaran, atau transaksi nyata.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Framer Motion
- React Router
- Supabase (rencana integrasi backend dan database)

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

Untuk build produksi:

```bash
npm run build
```

## Akun Demo

Semua akun demo menggunakan kata sandi: `Demo12345`.

| Peran | Email |
|---|---|
| Pasien | pasien@anaverse.id |
| Dokter | dokter@anaverse.id |
| Admin | admin@anaverse.id |

Buka dua tab (pasien dan dokter) untuk melihat chat konsultasi tersinkron antar-tab.

## Fitur Utama

### 1. Website Publik
- Beranda dengan informasi rumah sakit.
- Informasi layanan dan fasilitas.
- Daftar dan profil dokter.
- Artikel kesehatan.
- FAQ dan formulir kontak.

### 2. Autentikasi
- Registrasi dan login.
- Logout.
- Lupa dan reset kata sandi.
- Akses berdasarkan peran pasien, dokter, dan admin.

### 3. Portal Pasien
- Dashboard pasien.
- Konsultasi online.
- Pembuatan janji temu offline.
- Riwayat janji temu dan konsultasi.
- Profil dan pengaturan akun.

### 4. Portal Dokter
- Agenda praktik.
- Menerima atau menolak permintaan konsultasi.
- Mengelola sesi konsultasi.
- Mengelola jadwal praktik.
- Daftar dan riwayat pasien.

### 5. Dashboard Admin
- Ringkasan aktivitas.
- Manajemen dokter dan pasien.
- Manajemen janji temu.
- Pengelolaan layanan, fasilitas, artikel, testimoni, dan FAQ.
- Laporan administrasi.

## Struktur Project

```text
src/
├── lib/
├── data/
├── components/
├── pages/
└── services/

supabase/
└── schema.sql
```

## Rencana Integrasi Supabase

1. Membuat project Supabase dan menjalankan `supabase/schema.sql`.
2. Mengonfigurasi environment variables melalui `.env`.
3. Mengintegrasikan Supabase Auth dan database.
4. Mengimplementasikan Realtime untuk konsultasi.
5. Mengamankan role pengguna dan kebijakan Row Level Security (RLS).

## Catatan

- Project saat ini merupakan prototipe untuk demonstrasi dan portofolio.
- Password demo disimpan di `localStorage` dan tidak ditujukan untuk penggunaan produksi.
- Foto menggunakan Unsplash melalui hotlink.
- Informasi rumah sakit, statistik, kontak, dan akun media sosial merupakan data contoh.
- Konsultasi video belum diimplementasikan; baru tersedia struktur integrasinya.

## Disclaimer

ANAVERSE merupakan proyek demonstrasi dan portofolio pribadi, bukan platform layanan kesehatan operasional. Seluruh akun dan data yang tersedia hanya untuk keperluan simulasi.
