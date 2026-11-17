# Rumah Sakit Anaverse — Website & Platform Kesehatan Digital

React + TypeScript + Vite, Tailwind CSS, Lucide React, Framer Motion, React Router.

> **Status: prototipe frontend.** Supabase belum dikonfigurasi, jadi seluruh data (akun, janji, konsultasi, konten) adalah **data demo yang disimpan di localStorage browser**. Tidak ada email, pembayaran, atau transaksi nyata. Banner "Mode prototipe" tampil di setiap dashboard.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build produksi
```

## Akun demo (kata sandi: `Demo12345`)

| Peran | Email |
|---|---|
| Pasien | pasien@anaverse.id |
| Dokter (dr. Andika, Sp.JP) | dokter@anaverse.id |
| Admin | admin@anaverse.id |

Buka dua tab (pasien dan dokter) untuk melihat chat konsultasi tersinkron antar tab. "Reset data demo" ada di banner dashboard.

## Fitur utama

- **Situs publik**: beranda lengkap sesuai referensi (hero, statistik, tentang, layanan, dokter + carousel, promo konsultasi, fasilitas, testimoni + carousel, artikel, FAQ accordion, kontak + formulir, CTA, footer), halaman detail layanan, daftar & profil dokter (cari/filter), artikel (cari/kategori).
- **Autentikasi**: daftar, masuk, keluar, lupa/atur ulang kata sandi, akses berbasis peran (pasien/dokter/admin) dengan validasi dan status loading.
- **Portal pasien**: dashboard, konsultasi online (7 langkah sampai ruang chat), janji offline (8 langkah, nomor referensi, cegah double booking), riwayat janji (batal sesuai kebijakan ≥24 jam), riwayat konsultasi, profil & pengaturan.
- **Portal dokter**: agenda hari ini, terima/tolak permintaan, mulai/akhiri sesi chat, kelola jadwal praktik, daftar pasien, riwayat.
- **Admin**: ringkasan, CRUD dokter + akun + jadwal + spesialisasi, manajemen pasien (nonaktifkan akun), janji temu (filter tanggal/dokter/status, ubah status), CMS (layanan, fasilitas, artikel, testimoni, FAQ, pesan kontak), laporan.

## Arsitektur

```
src/
  lib/store.tsx      lapisan data prototipe (localStorage) — kontrak yang diganti Supabase
  lib/supabase.ts    klien Supabase (aktif bila .env terisi)
  data/              mock data, gambar, info rumah sakit
  components/        UI kit, layout, SlotPicker, ConsultationRoom, ContentManager, ...
  pages/             public / auth / patient / doctor / admin
  services/video.ts  titik integrasi konsultasi video
supabase/schema.sql  tabel, relasi, indeks anti-double-booking, RLS
```

### Migrasi ke Supabase
1. Buat proyek Supabase, jalankan `supabase/schema.sql`, isi `.env` dari `.env.example`.
2. Ganti isi fungsi di `StoreProvider` (`login`, `createAppointment`, `sendMessage`, dst.) dengan query `supabase.from(...)` dan `supabase.auth`; chat memakai Realtime pada `consultation_messages`.
3. Pindahkan pembuatan akun dokter ke Edge Function (butuh service role); peran **tidak boleh** ditentukan klien.
4. Double booking dijamin di database lewat unique index parsial, bukan hanya UI.

## Hal yang perlu diketahui

- Kata sandi prototipe disimpan apa adanya di localStorage — **hanya untuk demo**; produksi memakai Supabase Auth.
- Gambar adalah foto stok Unsplash yang di-hotlink (`src/data/images.ts`); ganti dengan foto berlisensi rumah sakit. Komponen `<Img>` menampilkan placeholder bila gagal dimuat.
- Konten, statistik, nomor telepon, alamat, dan akun media sosial adalah contoh.
- Konsultasi video belum ada; hanya struktur integrasinya yang disiapkan.
- Kode belum dijalankan di browser pada sesi pembuatan ini (lihat catatan serah terima).
