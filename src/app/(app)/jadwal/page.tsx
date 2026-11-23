import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, EditJadwalForm, Field } from "@/components/forms";
import { createJadwal, deleteJadwal } from "@/app/actions";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default async function JadwalPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"]);

  const isSiswa = user.role === "SISWA";
  const isGuru = user.role === "GURU";
  const canManage = ["ADMIN", "KURIKULUM", "KEPSEK"].includes(user.role);

  const jadwal = await prisma.jadwal.findMany({
    where: isSiswa
      ? { kelas: { siswa: { some: { id: user.id } } } }
      : isGuru
        ? { kelas: { guruId: user.id } }
        : {},
    include: {
      kelas: true,
      mapel: true,
    },
    orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
  });

  const kelas = await prisma.kelas.findMany({ orderBy: { nama: "asc" } });
  const mapel = await prisma.mapel.findMany({ orderBy: { nama: "asc" } });

  const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long" });
  const adaJadwal = jadwal.length > 0;

  return (
    <div>
      <PageHeader
        title="Jadwal Mengajar"
        desc={isSiswa ? "Jadwal pelajaran kelas Anda." : "Jadwal pelajaran per hari."}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {!adaJadwal ? (
            <EmptyState message="Belum ada jadwal." />
          ) : (
            HARI.map((h) => {
              const list = jadwal.filter((j) => j.hari === h);
              if (list.length === 0) return null;
              const ini = h === hariIni;
              return (
                <Card
                  key={h}
                  title={h}
                  className={ini ? "border-blue-300 ring-1 ring-blue-100" : ""}
                  action={ini ? <Badge tone="blue">Hari ini</Badge> : undefined}
                >
                  <ul className="space-y-2">
                    {list.map((j) => (
                      <li
                        key={j.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{j.mapel.nama}</p>
                          <p className="text-xs text-slate-500">
                            {j.jamMulai}&ndash;{j.jamSelesai} &bull; {j.kelas.nama} &bull; R. {j.ruangan ?? "-"}
                          </p>
                        </div>
                        {canManage && (
                          <div className="flex shrink-0 items-center gap-2">
                            <EditJadwalForm jadwal={j} allKelas={kelas} allMapel={mapel} />
                            <DeleteForm
                              action={deleteJadwal}
                              id={j.id}
                              confirm={`Hapus jadwal ${j.mapel.nama} hari ${h}?`}
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })
          )}
        </div>

        {canManage && (
          <div>
            <ActionForm action={createJadwal} title="Tambah Jadwal">
              <Field
                label="Hari"
                name="hari"
                required
                options={HARI.map((h) => ({ value: h, label: h }))}
              />
              <Field label="Jam Mulai" name="jamMulai" type="time" required />
              <Field label="Jam Selesai" name="jamSelesai" type="time" required />
              <Field label="Ruangan" name="ruangan" placeholder="Lab IPA" />
              <Field
                label="Kelas"
                name="kelasId"
                required
                options={kelas.map((k) => ({ value: k.id, label: k.nama }))}
              />
              <Field
                label="Mata Pelajaran"
                name="mapelId"
                required
                options={mapel.map((m) => ({ value: m.id, label: m.nama }))}
              />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
