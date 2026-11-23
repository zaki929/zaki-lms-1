import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";

const JENIS_TONE: Record<string, "blue" | "red" | "amber" | "green"> = {
  UJIAN: "red",
  LIBUR: "green",
  RAPAT: "amber",
  KEGIATAN: "blue",
};

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export async function KurikulumDashboard({ user }: { user: SessionUser }) {
  const [totalGuru, totalMapel, totalKelas, totalModul, totalJadwal, modulTerbaru, pengumuman, kalender, guruList] =
    await Promise.all([
      prisma.user.count({ where: { role: "GURU" } }),
      prisma.mapel.count(),
      prisma.kelas.count(),
      prisma.modulAjar.count(),
      prisma.jadwal.count(),
      prisma.modulAjar.findMany({
        include: { guru: { select: { name: true } }, mapel: { select: { nama: true } } },
        orderBy: { dibuatPada: "desc" },
        take: 5,
      }),
      prisma.pengumuman.findMany({
        where: { target: { in: ["SEMUA", "GURU", "KEPSEK", "KURIKULUM"] } },
        orderBy: { dibuatPada: "desc" },
        take: 4,
      }),
      prisma.kalenderAkademik.findMany({ orderBy: { mulai: "asc" } }),
      prisma.user.findMany({
        where: { role: "GURU" },
        select: { id: true, name: true, modulAjar: { select: { status: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

  const guruLengkap = guruList.filter((g) => g.modulAjar.some((m) => m.status === "SELESAI"));
  const guruBelum = guruList.filter((g) => !g.modulAjar.some((m) => m.status === "SELESAI"));
  const persenLengkap = totalGuru ? Math.round((guruLengkap.length / totalGuru) * 100) : 0;

  const agendaMendatang = kalender
    .filter((k) => (k.selesai ?? k.mulai).getTime() >= Date.now() - 86400000)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${user.name.split(",")[0]}`}
        desc="Kelola kurikulum, perangkat ajar, dan kalender akademik."
      />

      {/* === Ringkasan statistik === */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Guru" value={totalGuru} accent="bg-blue-500" />
        <StatCard label="Total Mata Pelajaran" value={totalMapel} accent="bg-sky-500" />
        <StatCard label="Total Kelas" value={totalKelas} accent="bg-emerald-500" />
        <StatCard label="Total Modul Ajar" value={totalModul} accent="bg-amber-500" />
        <StatCard label="Total Jadwal Pelajaran" value={totalJadwal} accent="bg-violet-500" />
        <StatCard
          label="Kelengkapan Administrasi Guru"
          value={`${persenLengkap}%`}
          accent={persenLengkap >= 80 ? "bg-emerald-500" : persenLengkap >= 50 ? "bg-amber-500" : "bg-red-500"}
          hint={`${guruLengkap.length}/${totalGuru} guru lengkap`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* === Aktivitas kurikulum terbaru === */}
          <Card
            title="Aktivitas Kurikulum Terbaru"
            action={
              <Link href="/kurikulum/modul-ajar" className="text-xs font-semibold text-blue-600 hover:underline">
                Lihat semua modul
              </Link>
            }
          >
            {modulTerbaru.length === 0 ? (
              <EmptyState message="Belum ada modul ajar." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {modulTerbaru.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{m.judul}</p>
                      <p className="truncate text-xs text-slate-500">
                        {m.mapel.nama} &bull; {m.guru.name} &bull; {fmt(m.dibuatPada)}
                      </p>
                    </div>
                    <Badge
                      tone={m.status === "SELESAI" ? "green" : m.status === "REVIEW" ? "amber" : "slate"}
                    >
                      {m.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* === Pengumuman akademik === */}
          <Card
            title="Pengumuman Akademik"
            action={
              <Link href="/pengumuman" className="text-xs font-semibold text-blue-600 hover:underline">
                Semua pengumuman
              </Link>
            }
          >
            {pengumuman.length === 0 ? (
              <EmptyState message="Belum ada pengumuman." />
            ) : (
              <ul className="space-y-3">
                {pengumuman.map((p) => (
                  <li key={p.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{p.judul}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.isi}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{fmt(p.dibuatPada)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* === Kalender akademik / jadwal kegiatan === */}
          <Card
            title="Kalender Akademik"
            action={
              <Link href="/kurikulum/kalender" className="text-xs font-semibold text-blue-600 hover:underline">
                Kelola
              </Link>
            }
          >
            {agendaMendatang.length === 0 ? (
              <EmptyState message="Belum ada agenda mendatang." />
            ) : (
              <ul className="space-y-3">
                {agendaMendatang.map((k) => (
                  <li key={k.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{k.judul}</p>
                      <p className="text-xs text-slate-500">
                        {fmt(k.mulai)}
                        {k.selesai ? ` – ${fmt(k.selesai)}` : ""}
                      </p>
                    </div>
                    <Badge tone={JENIS_TONE[k.jenis] ?? "slate"}>{k.jenis}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* === Guru yang belum melengkapi perangkat pembelajaran === */}
          <Card
            title="Guru Belum Melengkapi Perangkat"
            action={
              <Link href="/kurikulum/monitoring" className="text-xs font-semibold text-blue-600 hover:underline">
                Monitoring
              </Link>
            }
          >
            {guruBelum.length === 0 ? (
              <EmptyState message="Semua guru sudah melengkapi perangkat pembelajaran. 🎉" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {guruBelum.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 truncate text-sm text-slate-800">{g.name}</span>
                    <Badge tone="red">Belum lengkap</Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${persenLengkap}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {persenLengkap}% guru sudah lengkap ({guruLengkap.length}/{totalGuru})
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
