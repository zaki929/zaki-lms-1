import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRED_TONE, predikat } from "@/lib/grading";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/guard";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";
import { KepsekDashboard } from "./kepsek-dashboard";

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"]);

  if (user.role === "ADMIN") return <AdminDashboard user={user} />;
  if (user.role === "KEPSEK") return <KepsekDashboard user={user} />;
  if (user.role === "KURIKULUM") redirect("/kurikulum");


  const isGuru = user.role === "GURU";
  const isSiswa = user.role === "SISWA";

  const [
    totalUser,
    totalKelas,
    totalMapel,
    totalSiswa,
    pengumuman,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.kelas.count(),
    prisma.mapel.count(),
    prisma.user.count({ where: { role: "SISWA" } }),
    prisma.pengumuman.findMany({
      where: { target: "SEMUA" },
      orderBy: { dibuatPada: "desc" },
      take: 5,
    }),
  ]);

  // Tugas relevan per role — satu bentuk include untuk semua role agar tipe menyatu
  const tugas = isSiswa
    ? await prisma.tugas.findMany({
        where: { kelas: { siswa: { some: { id: user.id } } } },
        include: { mapel: true, kelas: true, pengumpulan: { where: { siswaId: user.id } } },
        orderBy: { deadline: "asc" },
        take: 6,
      })
    : await prisma.tugas.findMany({
        where: isGuru ? { guruId: user.id } : {},
        include: {
          mapel: true,
          kelas: true,
          pengumpulan: { where: { siswaId: user.id } },
          _count: { select: { pengumpulan: true } },
        },
        orderBy: { deadline: "asc" },
        take: 6,
      });

  const sudahDikumpulkan = (t: (typeof tugas)[number]) => t.pengumpulan.length > 0;

  // Nilai siswa sendiri
  let nilaiSaya: Awaited<ReturnType<typeof getNilaiSiswa>> = [];
  if (isSiswa) nilaiSaya = await getNilaiSiswa(user.id);

  const absensi = isSiswa
    ? await prisma.absensi.findMany({
      where: { siswaId: user.id },
      orderBy: { tanggal: "desc" },
      take: 5,
    })
    : [];

  const rata = nilaiSaya.length
    ? (nilaiSaya.reduce((a, b) => a + b.nilai, 0) / nilaiSaya.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${user.name.split(",")[0]}`}
        desc={
          isSiswa
            ? "Pantau tugas, nilai, dan kehadiran Anda di satu tempat."
            : "Ringkasan tugas dan aktivitas mengajar Anda."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isSiswa ? (
          <>
            <StatCard label="Tugas Assigned" value={tugas.length} accent="bg-blue-500" />
            <StatCard label="Sudah Dikumpulkan" value={tugas.filter(sudahDikumpulkan).length} accent="bg-emerald-500" />
            <StatCard label="Rata-rata Nilai" value={rata} accent="bg-amber-500" />
            <StatCard label="Hadir (10 hari)" value={absensi.filter((a) => a.status === "HADIR").length} accent="bg-sky-500" />
          </>
        ) : (
          <>
            <StatCard label="Total Pengguna" value={totalUser} accent="bg-blue-500" hint="semua role" />
            <StatCard label="Total Siswa" value={totalSiswa} accent="bg-emerald-500" />
            <StatCard label="Kelas" value={totalKelas} accent="bg-amber-500" />
            <StatCard label="Mata Pelajaran" value={totalMapel} accent="bg-slate-500" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={isGuru ? "Tugas yang Saya Buat" : isSiswa ? "Tugas Saya" : "Tugas Terakhir"}
            action={
              <Link href="/tugas" className="text-xs font-semibold text-blue-600 hover:underline">
                Kelola tugas
              </Link>
            }
          >
            {tugas.length === 0 ? (
              <EmptyState message="Belum ada tugas." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {tugas.map((t) => {
                  const done = sudahDikumpulkan(t);
                  const overdue = t.deadline < new Date();
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{t.judul}</p>
                        <p className="text-xs text-slate-500">
                          {t.kelas.nama} &bull; {t.mapel.nama} &bull; deadline {fmt(t.deadline)}
                        </p>
                      </div>
                      {done ? (
                        <Badge tone="green">Dikumpulkan</Badge>
                      ) : overdue ? (
                        <Badge tone="red">Terlambat</Badge>
                      ) : (
                        <Badge tone="blue">Belum</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {isSiswa && (
            <Card title="Nilai Saya">
              {nilaiSaya.length === 0 ? (
                <EmptyState message="Belum ada nilai." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="py-2">Jenis</th>
                      <th className="py-2">Semester</th>
                      <th className="py-2 text-right">Nilai</th>
                      <th className="py-2 text-right">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {nilaiSaya.map((n) => (
<tr key={n.id}>
                      <td className="py-2">{n.tipe}</td>
                      <td className="py-2">{n.semester}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{n.nilai}</td>
                      <td className="py-2 pr-3 text-right">
                        <Badge tone={PRED_TONE[predikat(n.nilai)]}>
                          {predikat(n.nilai)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {nilaiSaya.some((n) => n.catatan) && (
                    <tr>
                      <td colSpan={4} className="py-2 pr-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Catatan dari guru
                        </p>
                        <ul className="mt-1 space-y-1">
                          {nilaiSaya
                            .filter((n) => n.catatan)
                            .map((n) => (
                              <li key={n.id} className="truncate text-xs text-slate-600" title={n.catatan ?? undefined}>
                                <span className="font-medium">{n.tipe}</span>: {n.catatan}
                              </li>
                            ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Pengumuman">
            {pengumuman.length === 0 ? (
              <EmptyState message="Belum ada pengumuman." />
            ) : (
              <ul className="space-y-3">
                {pengumuman.map((p) => (
                  <li key={p.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{p.judul}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-slate-500">{p.isi}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{fmt(p.dibuatPada)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {isSiswa && (
            <Card title="Absensi Terakhir">
              {absensi.length === 0 ? (
                <EmptyState message="Belum ada data absensi." />
              ) : (
                <ul className="space-y-2">
                  {absensi.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{fmt(a.tanggal)}</span>
                      <Badge
                        tone={
                          a.status === "HADIR"
                            ? "green"
                            : a.status === "SAKIT"
                              ? "amber"
                              : a.status === "IZIN"
                                ? "blue"
                                : "red"
                        }
                      >
                        {a.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}

async function getNilaiSiswa(siswaId: string) {
  return prisma.nilai.findMany({
    where: { siswaId },
    orderBy: { id: "asc" },
  });
}
