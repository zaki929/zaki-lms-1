import Link from "next/link";
import { prisma, ROLE_LABEL, ROLES } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { SchoolLogo } from "@/components/SchoolLogo";

/**
 * Landing page tanpa foto: bersih, biru navy sebagai warna utama.
 *
 * Halaman ini publik, jadi query dibungkus try/catch: kalau database belum
 * di-seed, landing page tetap harus render (dengan angka 0), bukan meledak.
 */
async function loadStats() {
  const kosong = {
    siswa: 0,
    guru: 0,
    kelas: 0,
    mapel: 0,
    tugas: 0,
    pengumpulan: 0,
    pengumuman: [] as { id: string; judul: string; isi: string; dibuatPada: Date; author: { name: string } }[],
  };

  try {
    const [siswa, guru, kelas, mapel, tugas, pengumpulan, pengumuman] = await Promise.all([
      prisma.user.count({ where: { role: "SISWA" } }),
      prisma.user.count({ where: { role: "GURU" } }),
      prisma.kelas.count(),
      prisma.mapel.count(),
      prisma.tugas.count(),
      prisma.pengumpulan.count(),
      prisma.pengumuman.findMany({
        orderBy: { dibuatPada: "desc" },
        take: 3,
        include: { author: { select: { name: true } } },
      }),
    ]);
    return { siswa, guru, kelas, mapel, tugas, pengumpulan, pengumuman };
  } catch {
    return kosong;
  }
}

const MENU_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  GURU: "Guru & Staf",
  SISWA: "Siswa",
  KEPSEK: "Kepala Sekolah",
  KURIKULUM: "Kurikulum",
};

const DESKRIPSI_PERAN: Record<string, string> = {
  ADMIN: "Kelola seluruh data sekolah: pengguna, kelas, mapel, dan pengumuman.",
  GURU: "Buat tugas, nilai pengumpulan, catat absensi, dan pantau kiriman siswa.",
  SISWA: "Kerjakan tugas, kumpulkan jawaban, dan pantau nilai serta absensi pribadi.",
  KEPSEK: "Pantau laporan sekolah, kehadiran, dan performa akademik menyeluruh.",
  KURIKULUM: "Susun CP/TP/ATP, modul ajar, kalender akademik, dan monitoring guru.",
};

const FITUR: { judul: string; isi: string; ikon: string }[] = [
  {
    judul: "Jadwal Terpadu",
    isi: "Jadwal pelajaran tiap kelas dan guru selalu sinkron dengan data sekolah.",
    ikon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    judul: "Tugas & Pengumpulan",
    isi: "Guru membuat tugas, siswa mengumpulkan jawaban, semuanya tercatat rapi.",
    ikon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    judul: "Penilaian Cepat",
    isi: "Input nilai, kurva penilaian, dan laporan akademik otomatis dalam satu klik.",
    ikon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z",
  },
  {
    judul: "Absensi Digital",
    isi: "Rekap kehadiran harian dan per mata pelajaran tanpa buku absen manual.",
    ikon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    judul: "Kurikulum Merdeka",
    isi: "Susun CP/TP/ATP, modul ajar, dan kalender akademik dalam satu modul.",
    ikon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    judul: "Laporan Real-time",
    isi: "Kepala sekolah dan kurikulum memantau performa akademik secara langsung.",
    ikon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

function Ikon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function fmtTanggal(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Statistik di bawah dibaca dari database, jadi halaman harus dirender per
 * request. Tanpa ini Next akan meng-cache-nya sebagai konten statis dan angka
 * yang tampil bekumu pada saat build.
 */
export const dynamic = "force-dynamic";

const NAV = [
  { label: "Fitur", href: "#fitur" },
  { label: "Peran", href: "#peran" },
  { label: "Berita", href: "#berita" },
  { label: "Tentang", href: "#tentang" },
];

export default async function LandingPage() {
  const s = await loadStats();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <SchoolLogo size={44} priority />
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold tracking-tight text-slate-900">
                {BRAND.short.split(" ").slice(0, 2).join(" ")}
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                {BRAND.schoolName}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm font-medium text-slate-600 transition hover:text-blue-800"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-blue-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Masuk
          </Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white">
        {/* aksen dekoratif tanpa foto */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-700/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-300" aria-hidden="true" />
              Pendaftaran siswa baru {new Date().getFullYear()} telah dibuka
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {BRAND.slogan.replace(".", "")} bersama{" "}
              <span className="bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                {BRAND.short}
              </span>
              !
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {BRAND.tagline} — jadwal, tugas, penilaian, absensi, dan laporan dalam satu
              platform terpadu untuk seluruh warga sekolah.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-900 shadow-lg transition hover:bg-blue-50"
              >
                Masuk Sekarang
              </Link>
              <a
                href="#fitur"
                className="rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Pelajari Sistem
              </a>
            </div>
          </div>

          {/* Kartu statistik */}
          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Siswa", value: s.siswa },
              { label: "Guru", value: s.guru },
              { label: "Kelas", value: s.kelas },
              { label: "Mapel", value: s.mapel },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"
              >
                <dd className="text-2xl font-bold text-white sm:text-3xl">{c.value}</dd>
                <dt className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-300">
                  {c.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= FITUR ================= */}
      <section id="fitur" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-800">
              Fitur
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Satu platform untuk seluruh peran sekolah
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Setiap modul terhubung ke database yang sama, jadi data yang diinput guru langsung
              terlihat oleh siswa, kepala sekolah, dan kurikulum.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FITUR.map((f) => (
              <article
                key={f.judul}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-white transition group-hover:bg-blue-900">
                  <Ikon path={f.ikon} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.isi}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PERAN ================= */}
      <section id="peran" className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-800">
              Peran
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Dashboard khusus untuk setiap peran
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((role) => (
              <article
                key={role}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-slate-900">{MENU_LABEL[role] ?? role}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-blue-800">
                  {ROLE_LABEL[role]}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{DESKRIPSI_PERAN[role]}</p>
              </article>
            ))}
            <article className="rounded-2xl bg-blue-800 p-6 text-white shadow-md transition hover:bg-blue-900">
              <h3 className="text-lg font-semibold">Masuk Sekarang</h3>
              <p className="mt-2 text-sm text-blue-100">
                Gunakan akun sekolah Anda. Akun demo tiap peran tersedia di halaman login.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                Ke halaman login &rarr;
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ================= BERITA ================= */}
      <section id="berita" className="scroll-mt-20 border-t border-slate-200 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-800">
                Berita
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Berita &amp; Pengumuman
              </h2>
            </div>
            <Link
              href="/login"
              className="rounded-full bg-blue-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-900"
            >
              Lihat semua &rarr;
            </Link>
          </div>

          {s.pengumuman.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              Belum ada pengumuman. Jalankan <code className="font-mono">npm run db:seed</code> untuk mengisi contoh data.
            </p>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {s.pengumuman.map((p) => (
                <article
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-800">
                    Pengumuman
                  </p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug text-slate-900">
                    {p.judul}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.isi}</p>
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    {p.author.name} &mdash; {fmtTanggal(p.dibuatPada)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= TENTANG ================= */}
      <section id="tentang" className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-800">
              Tentang
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Selamat Datang di {BRAND.short}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {BRAND.description}
            </p>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Tugas dibuat", value: s.tugas },
              { label: "Pengumpulan", value: s.pengumpulan },
              { label: "Kelas aktif", value: s.kelas },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {c.label}
                </dt>
                <dd className="mt-1 text-3xl font-bold text-blue-800">{c.value}</dd>
              </div>
            ))}
          </dl>

          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-blue-800 px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Masuk ke Aplikasi
          </Link>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-blue-800 py-20 text-center text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Siap membuat belajar lebih {BRAND.short.split(" ").pop()}?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-blue-100 sm:text-base">
            Masuk dengan akun sekolah Anda dan mulai kelola pembelajaran hari ini.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-blue-900 shadow-lg transition hover:bg-blue-50"
          >
            Masuk ke {BRAND.short}
          </Link>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SchoolLogo size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{BRAND.short}</p>
              <p className="truncate text-[11px] text-slate-400">
                &copy; {new Date().getFullYear()} {BRAND.schoolName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-xs font-medium uppercase tracking-wider text-slate-400 transition hover:text-white"
              >
                {n.label}
              </a>
            ))}
            <Link
              href="/login"
              className="text-xs font-medium uppercase tracking-wider text-slate-400 transition hover:text-white"
            >
              Login
            </Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
