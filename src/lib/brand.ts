/**
 * Satu-satunya sumber nama produk & aset sekolah supaya landing page, AppShell,
 * halaman login, dan metadata tidak pernah berbeda julukan.
 *
 * Warna logo sekolah adalah kuning (#FFF212) dengan aksen emas gelap (#908818).
 * UI memakai biru navy/slate sebagai warna utama — kuning murni tidak aman untuk
 * teks atau tombol — dan emas dipakai sebagai aksen kecil agar menyambung dengan
 * logo tanpa membuat tampilan norak.
 */
export const BRAND = {
  name: "Citra Negara MANTAP LMS",
  short: "Citra Negara MANTAP",
  initials: "CNM",
  tagline: "Sistem manajemen belajar sekolah yang MANTAP",
  slogan: "Pilihan tepat untuk sekolah yang tertata dan MANTAP.",
  description:
    "Citra Negara MANTAP LMS adalah platform manajemen belajar SMK Citra Negara untuk Administrator, Guru, Siswa, Kepala Sekolah, dan Kurikulum. Satu alur terpadu untuk jadwal, tugas, penilaian, absensi, dan laporan — tanpa data tercecer.",

  /** Nama resmi sekolah — dipakai untuk alt text logo. */
  schoolName: "SMK Citra Negara",

  /** Aset di /public. */
  logo: "/logo-sekolah.png",
  hero: "/landing.jpg",

  /** Aksen emas yang diambil dari warna logo (dipakai hemat, bukan sebagai warna UI utama). */
  accent: "text-amber-300",
  accentBg: "bg-amber-400",
} as const;