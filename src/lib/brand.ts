/**
 * Satu-satunya sumber nama produk & aset sekolah supaya landing page, AppShell,
 * halaman login, dan metadata tidak pernah berbeda julukan.
 *
 * Warna logo sekolah adalah kuning (#FFF212) dengan aksen emas gelap (#908818).
 * UI tetap memakai indigo sebagai warna utama — kuning murni tidak aman untuk
 * teks atau tombol — dan emas dipakai sebagai aksen kecil agar menyambung dengan
 * logo tanpa membuat tampilan norak.
 */
export const BRAND = {
  name: "Citra Negara Zaki LMS",
  short: "Citra Negara Zaki",
  initials: "CNZ",
  tagline: "Sistem manajemen belajar sekolah",
  slogan: "Sekolah yang tertata, dimulai dari data yang tertata.",
  description:
    "Citra Negara Zaki LMS adalah platform manajemen belajar sekolah untuk Administrator, Guru, Siswa, Kepala Sekolah, dan Kurikulum. Satu alur untuk jadwal, tugas, penilaian, absensi, dan laporan tanpa data yang tercecer atau perlu disalin ulang.",

  /** Nama resmi sekolah — dipakai untuk alt text logo dan tautan. */
  schoolName: "SMK Citra Negara",
  schoolUrl: "https://smk.citranegara.sch.id/",

  /** Aset di /public, diambil dari website sekolah resmi. */
  logo: "/logo-sekolah.png",
  hero: "/landing.jpg",

  /** Aksen emas yang diambil dari warna logo (dipakai hemat, bukan sebagai warna UI utama). */
  accent: "text-amber-300",
  accentBg: "bg-amber-400",
} as const;