import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui";

export default async function MonitoringPerangkatPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  const [guru, mapel, totalMapel] = await Promise.all([
    prisma.user.findMany({
      where: { role: "GURU" },
      select: {
        id: true,
        name: true,
        modulAjar: { select: { status: true, mapelId: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.mapel.findMany({
      select: {
        id: true,
        nama: true,
        kode: true,
        modulAjar: { select: { guruId: true, status: true } },
        _count: { select: { capaian: true } },
      },
      orderBy: { nama: "asc" },
    }),
    prisma.mapel.count(),
  ]);

  const baris = guru.map((g) => {
    const selesai = g.modulAjar.filter((m) => m.status === "SELESAI").length;
    const review = g.modulAjar.filter((m) => m.status === "REVIEW").length;
    const draft = g.modulAjar.filter((m) => m.status === "DRAFT").length;
    return {
      id: g.id,
      nama: g.name,
      total: g.modulAjar.length,
      selesai,
      review,
      draft,
      mapel: new Set(g.modulAjar.map((m) => m.mapelId)).size,
      lengkap: selesai > 0,
    };
  });

  const totalGuru = baris.length;
  const lengkap = baris.filter((b) => b.lengkap).length;
  const persen = totalGuru ? (lengkap / totalGuru) * 100 : 0;
  const modulSelesai = baris.reduce((a, b) => a + b.selesai, 0);

  return (
    <div>
      <PageHeader
        title="Monitoring Perangkat Pembelajaran"
        desc="Pemantauan modul ajar guru dan laporan kelengkapan administrasi pembelajaran."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Guru" value={totalGuru} accent="bg-blue-500" />
        <StatCard label="Guru Lengkap" value={lengkap} accent="bg-emerald-500" />
        <StatCard label="Belum Lengkap" value={totalGuru - lengkap} accent="bg-amber-500" />
        <StatCard
          label="Kelengkapan"
          value={`${persen.toFixed(0)}%`}
          accent="bg-sky-500"
          hint={`${modulSelesai} modul selesai`}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Card title="Perangkat Pembelajaran per Guru">
          {baris.length === 0 ? (
            <EmptyState message="Belum ada guru." />
          ) : (
            <DataTable
              minWidth={680}
              caption="Perangkat pembelajaran per guru"
              head={
                <>
                  <th scope="col" className="w-[34%]">Guru</th>
                  <th scope="col" className="w-[10%] text-right">Modul</th>
                  <th scope="col" className="w-[10%] text-right">Selesai</th>
                  <th scope="col" className="w-[10%] text-right">Review</th>
                  <th scope="col" className="w-[10%] text-right">Draft</th>
                  <th scope="col" className="w-[12%] text-right">Mapel</th>
                  <th scope="col" className="w-[14%]">Status</th>
                </>
              }
            >
              {baris.map((b) => (
                <tr key={b.id} className="transition hover:bg-slate-50">
                  <td className="truncate font-medium text-slate-800">{b.nama}</td>
                  <td className="text-right tabular-nums text-slate-600">{b.total}</td>
                  <td className="text-right tabular-nums text-emerald-700">{b.selesai}</td>
                  <td className="text-right tabular-nums text-amber-700">{b.review}</td>
                  <td className="text-right tabular-nums text-slate-500">{b.draft}</td>
                  <td className="text-right tabular-nums text-slate-600">{b.mapel}</td>
                  <td>
                    <Badge tone={b.lengkap ? "green" : b.total ? "amber" : "red"}>
                      {b.lengkap ? "Lengkap" : b.total ? "Belum lengkap" : "Belum ada"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        <Card title="Laporan Kelengkapan Administrasi Pembelajaran">
          <p className="mb-3 text-xs text-slate-500">
            Kelengkapan dihitung dari guru yang memiliki minimal satu modul ajar berstatus SELESAI.
            Saat ini {lengkap} dari {totalGuru} guru memenuhi kriteria ({persen.toFixed(1)}%).
          </p>
          {guru.filter((g) => !baris.find((b) => b.id === g.id)?.lengkap).length > 0 && (
            <ul className="mb-4 space-y-1 text-sm text-amber-700">
              {guru
                .filter((g) => !baris.find((b) => b.id === g.id)?.lengkap)
                .map((g) => (
                  <li key={g.id} className="truncate">
                    &bull; {g.name} — belum memiliki modul ajar selesai
                  </li>
                ))}
            </ul>
          )}
          {mapel.length === 0 ? (
            <EmptyState message="Belum ada mata pelajaran." />
          ) : (
            <DataTable
              minWidth={420}
              caption="Kelengkapan per mata pelajaran"
              head={
                <>
                  <th scope="col" className="w-[44%]">Mata Pelajaran</th>
                  <th scope="col" className="w-[18%] text-right">CP</th>
                  <th scope="col" className="w-[19%] text-right">Modul</th>
                  <th scope="col" className="w-[19%] text-right">Guru</th>
                </>
              }
            >
              {mapel.map((m) => (
                <tr key={m.id} className="transition hover:bg-slate-50">
                  <td className="truncate font-medium text-slate-800">
                    {m.nama} <span className="font-normal text-slate-400">({m.kode})</span>
                  </td>
                  <td className="text-right tabular-nums text-slate-600">{m._count.capaian}</td>
                  <td className="text-right tabular-nums text-slate-600">{m.modulAjar.length}</td>
                  <td className="text-right tabular-nums text-slate-600">
                    {new Set(m.modulAjar.map((x) => x.guruId)).size}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          <p className="mt-3 text-xs text-slate-500">
            {totalMapel} mata pelajaran terdaftar.{" "}
            {mapel.filter((m) => m._count.capaian === 0).length} mapel belum memiliki CP.
          </p>
        </Card>
      </div>
    </div>
  );
}
