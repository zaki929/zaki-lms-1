# Citra Negara MANTAP LMS

Learning Management System untuk SMK Citra Negara dengan 5 role: **Administrator**, **Guru**,
**Siswa**, **Kepala Sekolah**, dan **Kurikulum**. Semua modul memakai satu database
SQLite yang sama lewat Prisma, jadi data yang diinput satu role langsung terlihat
role lain tanpa impor ulang.

## Fitur

| Modul | Rute | Siapa yang bisa |
| --- | --- | --- |
| Dashboard | `/dashboard` | Semua role |
| Tugas & Pengumpulan | `/tugas` | Semua role (guru membuat, siswa mengumpulkan) |
| Penilaian | `/nilai` | Semua role (hanya Admin & Guru yang boleh mengubah) |
| Absensi | `/absensi` | Admin, Kepala Sekolah, Kurikulum |
| Jadwal Mengajar | `/jadwal` | Semua role |
| Data Kelas | `/kelas` | Semua role (hanya Admin yang boleh menambah) |
| Mata Pelajaran | `/mapel` | Admin, Guru, Kepala Sekolah, Kurikulum |
| Manajemen Pengguna | `/pengguna` | Admin, Kepala Sekolah |
| Laporan | `/laporan` | Admin, Kepala Sekolah, Kurikulum |
| Pengumuman | `/pengumuman` | Semua role |
| Profil Saya | `/profil` | Semua role |

Siswa tetap melihat kehadiran dan rapor pribadinya di `/profil`.

Halaman `/` adalah landing page publik yang menampilkan statistik langsung dari
database.

Halaman juga punya `loading` (skeleton), `error` (error boundary), dan
`not-found` (404) sehingga tidak pernah menampilkan halaman error mentah Next.js.

## Hak akses

| Aksi | Siapa |
| --- | --- |
| Catat & rekap absensi | Admin, Kepala Sekolah, Kurikulum |
| Lihat/input/hapus nilai | Admin, Guru |
| Guru hanya untuk **siswa kelas yang ia ampu** | Guru |
| Buat kelas, kelola pengguna | Admin |
| Buat mapel, jadwal | Admin, Kurikulum, Kepala Sekolah |

Aturan di atas ditegakkan di server (`src/app/actions.ts` via `requireRole`),
bukan hanya disembunyikan lewat menu — jadi mengirim request langsung ke URL
atau memalsukan ID siswa tetap ditolak.

## Menjalankan

```bash
npm install
npm run setup     # prisma generate + db push + seed
npm run dev
```

Buka http://localhost:3000.

Untuk isi ulang database dari awal:

```bash
npm run db:reset
```

## Akun demo

Halaman login menampilkan tombol isi-otomatis yang **diambil langsung dari
database** — hanya untuk akun yang benar-benar masih ada. Kalau sebuah akun demo
dihapus lewat Manajemen Pengguna, tombolnya ikut hilang (tidak lagi menampilkan
email yang pasti gagal login).

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@sekolah.test` | `admin123` |
| Kepala Sekolah | `kepsek@sekolah.test` | `kepsek123` |
| Kurikulum | `kurikulum@sekolah.test` | `kurikulum123` |
| Guru | `guru@sekolah.test` | `guru123` |
| Siswa | `siswa2@sekolah.test` | `siswa123` |

`prisma/seed.ts` juga membuat akun tambahan (`guru2@`, `siswa@`, `siswa3@`)
dengan pola password yang sama.

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run db:push` | Sinkronkan schema ke database |
| `npm run db:seed` | Isi data contoh |
| `npm run db:reset` | Hapus lalu isi ulang database |

## Verifikasi

```bash
npm run lint     # 0 error, 0 warning
npx tsc --noEmit # 0 error
npm run build    # harus lolos tanpa error
.\smoke.ps1      # butuh dev server aktif di port 3000
```

`smoke.ps1` login sebagai kelima role, memuat sebelas halaman, memastikan tidak
ada halaman error, dan memeriksa middleware tetap melindungi route privat.
Keluarannya `SEMUA LULUS` kalau semuanya sehat.

## Troubleshooting

**Halaman error / tidak bisa login setelah menyalakan ulang**

Hanya boleh ada **satu** proses Next.js yang berjalan. Kalau `npm run dev`
dijalankan dua kali atau bersamaan dengan `npm run start`, keduanya menulis ke
folder `.next` yang sama dan saling menimpa cache — gejalanya `Cannot find
module './xxx.js'` dan seluruh halaman balas 500.

Perbaikannya:

```powershell
# 1. Matikan semua proses Node milik project ini
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match "lms|mantap" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# 2. Bersihkan cache build
Remove-Item -Recurse -Force .next

# 3. Jalankan ulang HANYA SATU server
npm run dev
```

Kalau `Port 3000 is in use`, berarti masih ada server lama yang belum mati —
ulangi langkah 1.

**Port 3000 dipakai proses lain**

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

Untuk menjalankannya di port lain: `npx next dev -p 3100`.

## Konfigurasi

`.env`:

- `DATABASE_URL` — lokasi file SQLite (default `file:./dev.db`)
- `SESSION_SECRET` — kunci penandatangan JWT sesi

Ganti `SESSION_SECRET` sebelum deploy ke produksi. Mengganti nilainya akan
memaksa semua pengguna login ulang.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 ·
SQLite · JWT (`jose`) · bcrypt