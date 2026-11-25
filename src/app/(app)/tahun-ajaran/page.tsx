import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { ActionForm, DeleteForm, EditTahunAjaranForm, Field, TombolSetAktif } from "@/components/forms";
import { createTahunAjaran, deleteTahunAjaran, setSemesterAktif } from "@/app/actions";

export default async function TahunAjaranPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK"]);

  const tahunAjaran = await prisma.tahunAjaran.findMany({
    orderBy: [{ aktif: "desc" }, { nama: "asc" }],
  });

  const aktif = tahunAjaran.find((t) => t.aktif);
  const total = tahunAjaran.length;
  const semesterAktif = aktif?.semester ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Tahun Ajaran"
        desc="Kelola tahun ajaran, setel tahun yang aktif, dan tentukan semester yang sedang berjalan."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Tahun Ajaran" value={total} accent="bg-blue-500" />
        <StatCard
          label="Tahun Ajaran Aktif"
          value={aktif?.nama ?? "Belum ada"}
          accent={aktif ? "bg-emerald-500" : "bg-slate-500"}
          hint={aktif ? `Semester ${aktif.semester}` : "Belum ada yang ditetapkan"}
        />
        <StatCard label="Semester Aktif" value={semesterAktif} accent="bg-sky-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {tahunAjaran.length === 0 ? (
            <EmptyState message="Belum ada tahun ajaran. Tambahkan data di bawah." />
          ) : (
            <DataTable
              minWidth={640}
              caption="Daftar tahun ajaran"
              head={
                <>
                  <th scope="col" className="w-[30%]">Nama</th>
                  <th scope="col" className="w-[16%] text-right">Semester</th>
                  <th scope="col" className="w-[20%]">Status</th>
                  <th scope="col" className="w-[22%] text-right">Dibuat Pada</th>
                  <th scope="col" className="w-[12%]">Aksi</th>
                </>
              }
            >
              {tahunAjaran.map((t) => {
                const isAktif = t.aktif;
                return (
                  <tr key={t.id} className="transition hover:bg-slate-50">
                    <td className="font-medium text-slate-800">{t.nama}</td>
                    <td className="text-right tabular-nums text-slate-600">
                      <Badge
                        tone={t.semester === 1 ? "blue" : "amber"}
                      >
                        Semester {t.semester}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={isAktif ? "green" : "slate"}>
                        {isAktif ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </td>
                    <td className="text-right text-[11px] tabular-nums text-slate-500">
                      {t.createdAt.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <EditTahunAjaranForm tahun={t} />
                        <TombolSetAktif tahun={t} />
                        <DeleteForm
                          action={deleteTahunAjaran}
                          id={t.id}
                          disabled={isAktif}
                          label="Hapus"
                          confirm={`Hapus tahun ajaran "${t.nama}"?`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </div>

        <div className="space-y-4">
          <ActionForm action={createTahunAjaran} title="Tambah Tahun Ajaran">
            <Field label="Nama Tahun Ajaran" name="nama" required placeholder="2024/2025" />
            <Field
              label="Semester Aktif"
              name="semester"
              type="number"
              required
              defaultValue={1}
              min={1}
              max={2}
              hint="Semester yang sedang berjalan pada tahun ajaran ini."
            />
          </ActionForm>

          {aktif ? (
            <ActionForm action={setSemesterAktif} title={`Pengaturan Semester Aktif (${aktif.nama})`}>
              <p className="text-xs text-slate-500">
                Ganti semester aktif untuk tahun ajaran yang sedang berjalan.
              </p>
              <input type="hidden" name="id" value={aktif.id} />
              <Field
                label="Semester"
                name="semester"
                type="number"
                required
                defaultValue={aktif.semester}
                min={1}
                max={2}
              />
            </ActionForm>
          ) : (
            <EmptyState message="Belum ada tahun ajaran aktif." />
          )}
        </div>
      </div>
    </div>
  );
}
