import Image from "next/image";
import Link from "next/link";
import { prisma, ROLE_LABEL, ROLES } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { SchoolLogo } from "@/components/SchoolLogo";

/**
 * Statistik landing page.
 *
 * Halaman ini publik, jadi query dibungkus try/catch: kalau database belum
 * di-seed atau file .db belum ada, landing page tetap harus render (dengan
 * angka 0), bukan meledak jadi 500.
 */
async function loadStats() {
  const kosong = {
    siswa: 0,
    guru: 0,
    kelas: 0,
    mapel: 0,
    tugas: 0,
    pengumpulan: 0,
    pengumuman: [] as { id: string; judul: string; dibuatPada: Date }[],
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
        select: { id: true, judul: true, dibuatPada: true },
      }),
    ]);
    return { siswa, guru, kelas, mapel, tugas, pengumpulan, pengumuman };
  } catch {
    return kosong;
  }
}

const FITUR = [
  {
    icon: "M3 12l9-8 9 8M5 10v10h14V10",
    title: "Manajemen Kelas & Mata Pelajaran",
    desc: "Kelola rombel, wali kelas, guru pengampu, dan penempatan mapel per kelas.",
    href: "/kelas",
  },
  {
    icon: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
    title: "Jadwal Mengajar",
    desc: "Susun jadwal mingguan per hari, jam, dan ruangan tanpa bentrok.",
    href: "/jadwal",
  },
  {
    icon: "M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5",
    title: "Tugas & Pengumpulan",
    desc: "Guru buat tugas dengan deadline; siswa kumpulkan file dan catatan.",
    href: "/tugas",
  },
  {
    icon: "M12 4l10 5-10 5L2 9zM6 11v5c0 1 3 2 6 2s6-1 6-2v-5",
    title: "Penilaian & Rapor",
    desc: "Input nilai harian, UTS, UAS, dan tugas lengkap dengan predikat.",
    href: "/nilai",
  },
  {
    icon: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4m-4 4l2 2 4-4",
    title: "Absensi Digital",
    desc: "Catat kehadiran siswa per tanggal: hadir, izin, sakit, atau alfa.",
    href: "/absensi",
  },
  {
    icon: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    title: "Laporan & Statistik",
    desc: "Rekap nilai, kehadiran, dan performa siswa maupun kelas.",
    href: "/laporan",
  },
  {
    icon: "M16 19v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8",
    title: "Manajemen Pengguna",
    desc: "Satu akun per guru, siswa, kepsek, dan kurikulum dengan hak akses berbeda.",
    href: "/pengguna",
  },
  {
    icon: "M3 11v3a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM17 8a5 5 0 010 8",
    title: "Pengumuman Sekolah",
    desc: "Broadcast info terarah ke seluruh sekolah atau hanya ke role tertentu.",
    href: "/pengumuman",
  },
];

const DETAIL_ROLE: Record<string, string> = {
  ADMIN: "Kelola seluruh data sekolah: pengguna, kelas, mapel, dan pengumuman.",
  GURU: "Buat tugas, nilai pengumpulan, catat absensi, dan pantau kiriman siswa.",
  SISWA: "Kerjakan tugas, kumpulkan jawaban, dan pantau nilai serta absensi pribadi.",
  KEPSEK: "Pantau laporan sekolah, kehadiran, dan performa akademik secara menyeluruh.",
  KURIKULUM: "Susun mata pelajaran, KKTP, dan jadwal pembelajaran semester berjalan.",
};

function fmtTanggal(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Statistik di bawah dibaca dari database, jadi halaman harus dirender per
 * request. Tanpa ini Next akan meng-cache-nya sebagai konten statis dan angka
 * yang tampilbeku pada saat build.
 */
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const s = await loadStats();

  const statCards = [
    { label: "Siswa", value: s.siswa },
    { label: "Guru", value: s.guru },
    { label: "Kelas", value: s.kelas },
    { label: "Mata Pelajaran", value: s.mapel },
    { label: "Tugas", value: s.tugas },
    { label: "Pengumpulan", value: s.pengumpulan },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <SchoolLogo size={40} priority />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-800 sm:text-base">
                {BRAND.short}
              </span>
              <span className="block truncate text-[11px] text-slate-400">{BRAND.tagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navigasi utama">
            <a href="#fitur" className="text-sm text-slate-600 transition hover:text-indigo-600">
              Fitur
            </a>
            <a href="#peran" className="text-sm text-slate-600 transition hover:text-indigo-600">
              Peran Pengguna
            </a>
            <a href="#informasi" className="text-sm text-slate-600 transition hover:text-indigo-600">
              Informasi
            </a>
            <a
              href={BRAND.schoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 transition hover:text-indigo-600"
            >
              Website Sekolah
            </a>
          </nav>

          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Masuk
          </Link>
        </div>
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section className="relative isolate overflow-hidden bg-slate-950">
          {/*
            Foto sekolah sebagai latar. `isolate` membuat semua layer di bawah
            membentuk stacking context sendiri, sehingga `-z-10` tidak hilang di
            balik background section.
          */}
          <Image
            src={BRAND.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-center [mask-image:radial-gradient(circle_60%_at_50%_40%,#fff_70%,transparent)]"
          />
          {/*
            Lapisan gelap elemen. Teks putih tetap kontras di atas foto apapun
            (gelap di kiri untuk teks, lebih redup di kanan agar foto tetap
            terlihat). Di mobile seluruhnya rata gelap.
          */}
          <div className="absolute inset-0 -z-10 bg-slate-950/85 sm:hidden" aria-hidden="true" />
          <div
            className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-slate-950/98 via-slate-950/85 to-slate-950/40 sm:block"
            aria-hidden="true"
          />
          {/*
            Vignette halus di sudut-sudut agar foto tidak terasa menempel tepi
            layar dan tetap fokus ke konten di tengah.
          */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-32 right-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Terhubung langsung ke database sekolah
              </span>

              <div className="mt-6 flex items-center gap-4">
                <SchoolLogo size={64} priority />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-300">
                    {BRAND.schoolName}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-4xl">
                    {BRAND.name}
                  </h1>
                </div>
              </div>

              {/* Slogan utama: satu kalimat yang jadi identitas produk. */}
              <p className="mt-6 text-2xl font-semibold leading-snug tracking-tight text-white sm:text-[2rem] sm:leading-[1.15]">
                Sekolah yang tertata, dimulai dari{" "}
                <span className={BRAND.accent}>data yang tertata.</span>
              </p>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                Satu alur untuk jadwal, tugas, penilaian, hingga laporan — tanpa data
                yang tercecer atau perlu disalin dari satu tempat ke tempat lain.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Masuk ke Dashboard
                </Link>
                <a
                  href="#fitur"
                  className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Lihat Fitur
                </a>
                <a
                  href={BRAND.schoolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Website Sekolah
                </a>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                {statCards.slice(0, 3).map((c) => (
                  <div
                    key={c.label}
                    className="rounded-xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur"
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {c.label}
                    </dt>
                    <dd className="mt-1 text-2xl font-bold text-white">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ================= FITUR ================= */}
        <section id="fitur" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Fitur Lengkap
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                Setiap kebutuhan sekolah, dalam satu alur
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Setiap modul terhubung ke database yang sama, jadi data yang diinput guru langsung
                terlihat oleh siswa, kepala sekolah, dan kurikulum tanpa perlu impor ulang.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FITUR.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {f.icon.split("M").filter(Boolean).map((d, i) => (
                        <path key={i} d={`M${d}`} />
                      ))}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= PERAN ================= */}
        <section id="peran" className="scroll-mt-20 border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Hak Akses
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                Lima role, satu sumber data
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Menu dan akses setiap pengguna otomatis menyesuaikan role-nya. Siswa tidak bisa
                menginput nilai, guru hanya bisa menilai kelas yang ia ampu, dan administrator
                memegang kendali penuh atas data sekolah.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ROLES.map((role, i) => (
                <article
                  key={role}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 text-[11px] font-bold text-indigo-700">
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800">{ROLE_LABEL[role]}</h3>
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{DETAIL_ROLE[role]}</p>
                </article>
              ))}

              <article className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5">
                <h3 className="text-sm font-semibold text-indigo-900">Masuk sekarang</h3>
                <p className="mt-3 text-sm leading-relaxed text-indigo-800/80">
                  Gunakan akun sekolah yang sudah terdaftar. Akun demo tersedia di halaman login
                  untuk mencoba tiap role.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline"
                >
                  Ke halaman login
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ================= INFORMASI / STATS LIVE ================= */}
        <section id="informasi" className="scroll-mt-20 bg-slate-900 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                  Data Sekolah
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Angka langsung dari database
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Statistik di bawah dibaca langsung dari basis data {BRAND.short}, sehingga selalu
                  mencerminkan data sekolah terbaru tanpa perlu dihitung manual.
                </p>

                <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {statCards.map((c) => (
                    <div
                      key={c.label}
                      className="rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3.5"
                    >
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {c.label}
                      </dt>
                      <dd className="mt-1 text-xl font-bold text-white">{c.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6">
                <h3 className="text-sm font-semibold text-white">Pengumuman terbaru</h3>
                {s.pengumuman.length === 0 ? (
                  <p className="mt-4 rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
                    Belum ada pengumuman. Jalankan <code className="text-indigo-300">npm run db:seed</code>{" "}
                    untuk mengisi data contoh.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {s.pengumuman.map((p) => (
                      <li key={p.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                        <p className="text-sm font-medium text-white">{p.judul}</p>
                        <p className="mt-1 text-xs text-slate-400">{fmtTanggal(p.dibuatPada)}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href="/pengumuman"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Lihat semua pengumuman
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="bg-indigo-600 py-14">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Kelola sekolah tanpa berkas, tanpa pusing
              </h2>
              <p className="mt-1.5 text-sm text-indigo-100">
                Masuk dengan akun sekolah Anda dan langsung kelola seluruh data akademik.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Masuk ke Aplikasi
            </Link>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 sm:flex-row sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SchoolLogo size={36} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-700">{BRAND.name}</p>
              <p className="truncate text-[11px] text-slate-400">
                &copy; {new Date().getFullYear()} {BRAND.schoolName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="text-xs text-slate-500 transition hover:text-indigo-600">
              Login
            </Link>
            <a href="#fitur" className="text-xs text-slate-500 transition hover:text-indigo-600">
              Fitur
            </a>
            <a href="#peran" className="text-xs text-slate-500 transition hover:text-indigo-600">
              Peran
            </a>
            <a
              href={BRAND.schoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 transition hover:text-indigo-600"
            >
              Website Sekolah
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}