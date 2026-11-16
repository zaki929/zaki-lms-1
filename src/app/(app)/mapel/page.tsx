import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, Field, MultiSelect, TextArea } from "@/components/forms";
import { createMapel, deleteMapel } from "@/app/actions";

export default async function MapelPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "GURU", "KEPSEK", "KURIKULUM"]);

  const canManage = user.role === "ADMIN" || user.role === "KURIKULUM";

  const mapel = await prisma.mapel.findMany({
    include: { kelas: { select: { id: true, nama: true } }, _count: { select: { tugas: true } } },
    orderBy: { nama: "asc" },
  });

  const kelas = await prisma.kelas.findMany({ orderBy: { nama: "asc" } });

  return (
    <div>
      <PageHeader
        title="Mata Pelajaran"
        desc={canManage ? "Kelola daftar mata pelajaran dan kelas pengampu." : "Daftar mata pelajaran sekolah."}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {mapel.length === 0 ? (
            <EmptyState message="Belum ada mata pelajaran." />
          ) : (
            mapel.map((m) => (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-800">
                      {m.nama} <span className="text-sm font-normal text-slate-400">({m.kode})</span>
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">{m.deskripsi ?? "Tidak ada deskripsi."}</p>
                  </div>
                  {canManage && (
                    <DeleteForm
                      action={deleteMapel}
                      id={m.id}
                      confirm={`Hapus mata pelajaran ${m.nama}?`}
                    />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.kelas.map((k) => (
                    <Badge key={k.id} tone="blue">
                      {k.nama}
                    </Badge>
                  ))}
                  <Badge tone="slate">{m._count.tugas} tugas</Badge>
                </div>
              </Card>
            ))
          )}
        </div>

        {canManage && (
          <div>
            <ActionForm action={createMapel} title="Tambah Mata Pelajaran">
              <Field label="Nama Mapel" name="nama" required placeholder="Basis Data" />
              <Field label="Kode" name="kode" required placeholder="BDD" hint="Kode unik, otomatis jadi huruf besar." />
              <TextArea label="Deskripsi" name="deskripsi" />
              <MultiSelect
                label="Kelas"
                name="kelasId"
              options={kelas.map((k) => ({ value: k.id, label: k.nama }))}
              />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
