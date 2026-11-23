import Link from "next/link";
import { prisma, ROLE_LABEL, type Role } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import LoginForm from "./login-form";
import { SchoolLogo } from "@/components/SchoolLogo";

/**
 * Halaman login (server component) bergaya neumorphism lembut seperti referensi:
 * latar biru muda dengan lingkaran dekoratif, kotak form putih di tengah layar.
 *
 * Daftar akun demo diambil langsung dari database, jadi tombol "pakai" hanya
 * muncul untuk akun yang benar-benar masih ada. Password demo hanya berlaku
 * untuk akun hasil `npm run db:seed`.
 */
const DEMO_SEED: { email: string; password: string }[] = [
  { email: "admin@sekolah.test", password: "admin123" },
  { email: "kepsek@sekolah.test", password: "kepsek123" },
  { email: "kurikulum@sekolah.test", password: "kurikulum123" },
  { email: "guru@sekolah.test", password: "guru123" },
  { email: "guru2@sekolah.test", password: "guru123" },
  { email: "siswa@sekolah.test", password: "siswa123" },
  { email: "siswa2@sekolah.test", password: "siswa123" },
  { email: "siswa3@sekolah.test", password: "siswa123" },
];

export default async function LoginPage() {
  const akun = await prisma.user
    .findMany({
      where: { email: { in: DEMO_SEED.map((d) => d.email) }, active: true },
      select: { email: true, name: true, role: true },
    })
    // Halaman login harus tetap bisa dibuka walau database bermasalah.
    .catch(() => []);

  // Satu tombol per role saja supaya daftar tidak repetitif.
  const sudahDipakai = new Set<string>();
  const demo = DEMO_SEED.map((seed) => {
    const u = akun.find((x) => x.email === seed.email);
    if (!u || sudahDipakai.has(u.role)) return null;
    sudahDipakai.add(u.role);
    return {
      email: u.email,
      name: u.name,
      role: ROLE_LABEL[u.role as Role] ?? u.role,
      password: seed.password,
    };
  }).filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 px-4 py-16">
      {/* Lingkaran dekoratif lembut di sudut-sudut, seperti referensi */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-blue-200 to-blue-100 shadow-inner" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tl from-blue-200 to-blue-50" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-1/4 h-48 w-48 rounded-full bg-white/70 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-1/4 top-10 h-32 w-32 rounded-full bg-white/60 blur-2xl" />

      {/* Tombol kembali ke landing page, pojok kanan atas */}
      <Link
        href="/"
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition hover:bg-white sm:right-8 sm:top-8"
      >
        Kembali
      </Link>

      {/* Kotak form di tengah */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl shadow-blue-200/60 backdrop-blur-xl sm:p-10">
        {/* Logo besar di atas tengah */}
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg shadow-blue-200/70 ring-1 ring-blue-100">
            <SchoolLogo size={72} priority />
          </div>
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Welcome Back
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to continue to {BRAND.short}
        </p>

        <LoginForm demo={demo} />
      </div>
    </main>
  );
}
