import Link from "next/link";
import { prisma, ROLE_LABEL, type Role } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import LoginForm from "./login-form";
import { SchoolLogo } from "@/components/SchoolLogo";

/**
 * Halaman login (server component).
 *
 * Daftar akun demo diambil langsung dari database, jadi tombol "pakai" hanya
 * muncul untuk akun yang benar-benar masih ada. Sebelumnya email-nya ditulis
 * manual di komponen client: begitu sebuah akun demo dihapus lewat Manajemen
 * Pengguna, tombolnya tetap tampil dan pasti gagal login.
 *
 * Password demo hanya berlaku untuk akun hasil `npm run db:seed`, jadi emailnya
 * dicocokkan ke daftar seed. Akun yang dibuat manual tidak pernah ikut
 * ditampilkan, karena password aslinya tidak bisa dibaca dari hash bcrypt.
 */
const DEMO_SEED: { email: string; password: string; tone: string }[] = [
  { email: "admin@sekolah.test", password: "admin123", tone: "bg-slate-800" },
  { email: "kepsek@sekolah.test", password: "kepsek123", tone: "bg-rose-600" },
  { email: "kurikulum@sekolah.test", password: "kurikulum123", tone: "bg-amber-500" },
  { email: "guru@sekolah.test", password: "guru123", tone: "bg-indigo-600" },
  { email: "guru2@sekolah.test", password: "guru123", tone: "bg-indigo-600" },
  { email: "siswa@sekolah.test", password: "siswa123", tone: "bg-emerald-600" },
  { email: "siswa2@sekolah.test", password: "siswa123", tone: "bg-emerald-600" },
  { email: "siswa3@sekolah.test", password: "siswa123", tone: "bg-emerald-600" },
];

export default async function LoginPage() {
  const akun = await prisma.user
    .findMany({
      where: { email: { in: DEMO_SEED.map((d) => d.email) }, active: true },
      select: { email: true, name: true, role: true },
    })
    // Halaman login harus tetap bisa dibuka walau database bermasalah.
    .catch(() => []);

  // Satu tombol per role saja supaya daftar tidak repetitif, dan urutannya
  // mengikuti daftar seed (bukan urutan acak dari database).
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
      tone: seed.tone,
    };
  }).filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid md:grid-cols-2">
        <div className="bg-indigo-700 p-8 text-white sm:p-10">
          <Link href="/" className="text-xs font-medium text-indigo-200 hover:text-white">
            &larr; Kembali ke beranda
          </Link>
          <SchoolLogo size={72} priority className="mt-5" />
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-amber-300">
            {BRAND.schoolName}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Citra Negara Zaki</h1>
          <p className="mt-2 text-indigo-100">
            Learning Management System sekolah dengan 5 role terintegrasi.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-indigo-50">
            <li>• Administrator — kelola user, kelas, dan seluruh sistem</li>
            <li>• Guru — buat tugas &amp; nilai siswa kelasnya sendiri</li>
            <li>• Siswa — kerjakan tugas, lihat nilai dan absensi pribadi</li>
            <li>• Kepala Sekolah — catatan absensi, laporan &amp; performance</li>
            <li>• Kurikulum — mapel, jadwal, dan pencatatan absensi</li>
          </ul>
        </div>

        <LoginForm demo={demo} />
      </div>
    </main>
  );
}