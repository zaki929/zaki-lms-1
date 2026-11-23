import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { prisma, ROLE_LABEL, type Role } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";

const ROLE_TONE: Record<Role, "red" | "blue" | "green" | "amber" | "violet"> = {
  ADMIN: "red",
  GURU: "blue",
  SISWA: "green",
  KEPSEK: "amber",
  KURIKULUM: "violet",
};

const QUICK_LINKS = [
  { href: "/pengguna", label: "Manajemen Pengguna" },
  { href: "/kelas", label: "Manajemen Kelas" },
  { href: "/pengumuman", label: "Kirim Pengumuman" },
];

function fmtTanggal(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtWaktu(d: Date) {
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Aktivitas = {
  id: string;
  teks: string;
  waktu: Date;
  tone: "blue" | "green" | "amber" | "slate";
};

export async function AdminDashboard({ user }: { user: SessionUser }) {
  const [
    totalUser,
    totalSiswa,
    totalGuru,
    totalKelas,
    totalMapel,
    penggunaTerbaru,
    pengumumanSekolah,
    kelasSiswa,
    tugasTerbaru,
    pengumumanTerbaru,
    pengumpulanTerbaru,
    pengumumanAdmin,
    penggunaAdmin,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SISWA" } }),
    prisma.user.count({ where: { role: "GURU" } }),
    prisma.kelas.count(),
    prisma.mapel.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.pengumuman.findMany({
      where: { target: "SEMUA" },
      orderBy: { dibuatPada: "desc" },
      take: 4,
    }),
    prisma.kelas.findMany({
      select: { id: true, nama: true, _count: { select: { siswa: true } } },
      orderBy: { nama: "asc" },
    }),
    prisma.tugas.findMany({
      orderBy: { dibuatPada: "desc" },
      take: 8,
      include: { guru: true, kelas: true },
    }),
    prisma.pengumuman.findMany({
      orderBy: { dibuatPada: "desc" },
      take: 8,
      include: { author: true },
    }),
    prisma.pengumpulan.findMany({
      orderBy: { submitPada: "desc" },
      take: 8,
      include: { siswa: true, tugas: true },
    }),
    prisma.pengumuman.findMany({
      where: { author: { role: "ADMIN" } },
      orderBy: { dibuatPada: "desc" },
      take: 8,
      include: { author: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, role: true, createdAt: true },
    }),
  ]);

  const aktivitasSistem: Aktivitas[] = [
    ...tugasTerbaru.map((t) => ({
      id: `tugas-${t.id}`,
      teks: `${t.guru.name} membuat tugas "${t.judul}" untuk ${t.kelas.nama}`,
      waktu: t.dibuatPada,
      tone: "blue" as const,
    })),
    ...pengumumanTerbaru.map((p) => ({
      id: `pengumuman-${p.id}`,
      teks: `${p.author.name} mengirim pengumuman "${p.judul}"`,
      waktu: p.dibuatPada,
      tone: "amber" as const,
    })),
    ...pengumpulanTerbaru.map((p) => ({
      id: `pengumpulan-${p.id}`,
      teks: `${p.siswa.name} mengumpulkan tugas "${p.tugas.judul}"`,
      waktu: p.submitPada,
      tone: "green" as const,
    })),
  ]
    .sort((a, b) => b.waktu.getTime() - a.waktu.getTime())
    .slice(0, 8);

  const riwayatAdmin: Aktivitas[] = [
    ...pengumumanAdmin.map((p) => ({
      id: `admin-pengumuman-${p.id}`,
      teks: `${p.author.name} membuat pengumuman "${p.judul}"`,
      waktu: p.dibuatPada,
      tone: "amber" as const,
    })),
    ...penggunaAdmin.map((u) => ({
      id: `admin-user-${u.id}`,
      teks: `Menambahkan pengguna ${u.name} (${ROLE_LABEL[u.role as Role] ?? u.role})`,
      waktu: u.createdAt,
      tone: "blue" as const,
    })),
  ]
    .sort((a, b) => b.waktu.getTime() - a.waktu.getTime())
    .slice(0, 8);

  const maksSiswa = Math.max(1, ...kelasSiswa.map((k) => k._count.siswa));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${user.name.split(",")[0]}`}
        desc={`Ringkasan aktivitas sekolah — Anda login sebagai ${ROLE_LABEL[user.role]}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Pengguna" value={totalUser} accent="bg-blue-500" hint="semua role" />
        <StatCard label="Total Siswa" value={totalSiswa} accent="bg-emerald-500" />
        <StatCard label="Total Guru" value={totalGuru} accent="bg-sky-500" />
        <StatCard label="Total Kelas" value={totalKelas} accent="bg-amber-500" />
        <StatCard label="Total Mata Pelajaran" value={totalMapel} accent="bg-slate-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Grafik Jumlah Siswa"
            action={
              <Link href="/kelas" className="text-xs font-semibold text-blue-600 hover:underline">
                Kelola kelas
              </Link>
            }
          >
            {kelasSiswa.length === 0 ? (
              <EmptyState message="Belum ada kelas." />
            ) : (
              <ul className="space-y-3">
                {kelasSiswa.map((k) => (
                  <li key={k.id}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-slate-700">{k.nama}</span>
                      <span className="shrink-0 tabular-nums text-slate-500">
                        {k._count.siswa} siswa
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(k._count.siswa / maksSiswa) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Aktivitas Sistem">
            {aktivitasSistem.length === 0 ? (
              <EmptyState message="Belum ada aktivitas." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {aktivitasSistem.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          a.tone === "blue"
                            ? "bg-blue-500"
                            : a.tone === "green"
                              ? "bg-emerald-500"
                              : a.tone === "amber"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                        }`}
                        aria-hidden="true"
                      />
                      <p className="min-w-0 text-sm text-slate-700">{a.teks}</p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                      {fmtWaktu(a.waktu)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Riwayat Aktivitas Admin">
            {riwayatAdmin.length === 0 ? (
              <EmptyState message="Belum ada aktivitas admin." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {riwayatAdmin.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          a.tone === "amber" ? "bg-amber-500" : "bg-blue-500"
                        }`}
                        aria-hidden="true"
                      />
                      <p className="min-w-0 text-sm text-slate-700">{a.teks}</p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                      {fmtWaktu(a.waktu)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Pengguna Terbaru"
            action={
              <Link href="/pengguna" className="text-xs font-semibold text-blue-600 hover:underline">
                Semua pengguna
              </Link>
            }
          >
            {penggunaTerbaru.length === 0 ? (
              <EmptyState message="Belum ada pengguna." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {penggunaTerbaru.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {u.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{u.name}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={ROLE_TONE[u.role as Role] ?? "slate"}>
                        {ROLE_LABEL[u.role as Role] ?? u.role}
                      </Badge>
                      <p className="mt-1 text-[11px] text-slate-400">{fmtTanggal(u.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Pengumuman Sekolah"
            action={
              <Link href="/pengumuman" className="text-xs font-semibold text-blue-600 hover:underline">
                Kelola
              </Link>
            }
          >
            {pengumumanSekolah.length === 0 ? (
              <EmptyState message="Belum ada pengumuman." />
            ) : (
              <ul className="space-y-3">
                {pengumumanSekolah.map((p) => (
                  <li key={p.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{p.judul}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-slate-500">{p.isi}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{fmtTanggal(p.dibuatPada)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Akses Cepat">
            <ul className="space-y-2 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5 font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
                  >
                    {l.label}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
