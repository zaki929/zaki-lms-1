import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, Field, TextArea } from "@/components/forms";
import { createAtp, createCapaian, createTujuan, deleteAtp, deleteCapaian, deleteTujuan } from "@/app/actions";

export default async function CpTpAtpPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  const canManage = user.role === "ADMIN" || user.role === "KURIKULUM";

  const mapel = await prisma.mapel.findMany({
    include: {
      capaian: {
        orderBy: [{ fase: "asc" }, { id: "asc" }],
        include: {
          tujuan: {
            orderBy: { urutan: "asc" },
            include: { atp: { orderBy: { urutan: "asc" } } },
          },
        },
      },
    },
    orderBy: { nama: "asc" },
  });

  const semuaCp: { value: string; label: string }[] = mapel.flatMap((m) =>
    m.capaian.map((c) => ({
      value: c.id,
      label: `${m.nama} • Fase ${c.fase} • ${c.deskripsi.slice(0, 50)}${c.deskripsi.length > 50 ? "…" : ""}`,
    })),
  );

  const semuaTp: { value: string; label: string }[] = mapel.flatMap((m) =>
    m.capaian.flatMap((c) =>
      c.tujuan.map((t) => ({
        value: t.id,
        label: `${m.nama} • ${t.deskripsi.slice(0, 55)}${t.deskripsi.length > 55 ? "…" : ""}`,
      })),
    ),
  );

  const totalCp = semuaCp.length;
  const totalTp = semuaTp.length;
  const totalAtp = mapel.reduce(
    (acc, m) => acc + m.capaian.reduce((a, c) => a + c.tujuan.reduce((x, t) => x + t.atp.length, 0), 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="CP, TP, dan ATP"
        desc="Capaian Pembelajaran, Tujuan Pembelajaran, dan Alur Tujuan Pembelajaran per mata pelajaran."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="blue">{totalCp} CP</Badge>
        <Badge tone="green">{totalTp} TP</Badge>
        <Badge tone="amber">{totalAtp} ATP</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {mapel.length === 0 ? (
            <EmptyState message="Belum ada mata pelajaran. Tambahkan mapel dulu di menu Mata Pelajaran." />
          ) : (
            mapel.map((m) => (
              <Card key={m.id} title={`${m.nama} (${m.kode})`}>
                {m.capaian.length === 0 ? (
                  <EmptyState message="Belum ada CP untuk mapel ini." />
                ) : (
                  <ul className="space-y-4">
                    {m.capaian.map((c) => (
                      <li key={c.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              CP • Fase {c.fase}
                            </p>
                            <p className="mt-1 text-sm text-slate-700">{c.deskripsi}</p>
                          </div>
                          {canManage && (
                            <DeleteForm
                              action={deleteCapaian}
                              id={c.id}
                              confirm="Hapus CP ini beserta TP dan ATP di dalamnya?"
                            />
                          )}
                        </div>

                        {c.tujuan.length === 0 ? (
                          <p className="mt-3 text-xs text-slate-400">Belum ada TP.</p>
                        ) : (
                          <ul className="mt-3 space-y-2 border-l-2 border-slate-200 pl-3">
                            {c.tujuan.map((t) => (
                              <li key={t.id}>
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-slate-700">
                                    <span className="font-semibold text-slate-500">TP {t.urutan}.</span>{" "}
                                    {t.deskripsi}
                                  </p>
                                  {canManage && (
                                    <DeleteForm
                                      action={deleteTujuan}
                                      id={t.id}
                                      label="Hapus TP"
                                      confirm="Hapus TP ini beserta ATP di dalamnya?"
                                    />
                                  )}
                                </div>
                                {t.atp.length > 0 && (
                                  <ul className="mt-1 space-y-1">
                                    {t.atp.map((a) => (
                                      <li
                                        key={a.id}
                                        className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600"
                                      >
                                        <span className="min-w-0 truncate">
                                          ATP {a.urutan}: {a.judul}
                                          {a.alokasi ? ` (${a.alokasi})` : ""}
                                        </span>
                                        {canManage && (
                                          <DeleteForm action={deleteAtp} id={a.id} confirm="Hapus ATP ini?" />
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))
          )}
        </div>

        {canManage && (
          <div className="space-y-4">
            <ActionForm action={createCapaian} title="Tambah CP">
              <Field
                label="Mata Pelajaran"
                name="mapelId"
                required
                options={mapel.map((m) => ({ value: m.id, label: m.nama }))}
              />
              <Field label="Fase" name="fase" required placeholder="E" hint="Contoh: E atau F." />
              <TextArea label="Deskripsi CP" name="deskripsi" required rows={4} />
            </ActionForm>

            <ActionForm action={createTujuan} title="Tambah TP">
              <Field label="CP" name="capaianId" required options={semuaCp} />
              <TextArea label="Deskripsi TP" name="deskripsi" required rows={3} />
              <Field label="Urutan" name="urutan" type="number" defaultValue={1} min={1} />
            </ActionForm>

            <ActionForm action={createAtp} title="Tambah ATP">
              <Field label="TP" name="tujuanId" required options={semuaTp} />
              <Field label="Judul ATP" name="judul" required placeholder="Penerapan pada soal cerita" />
              <Field label="Alokasi" name="alokasi" placeholder="6 JP" />
              <Field label="Urutan" name="urutan" type="number" defaultValue={1} min={1} />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
