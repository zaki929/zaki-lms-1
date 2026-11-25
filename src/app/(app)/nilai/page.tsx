import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, DataTable, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, EditNilaiForm, Field } from "@/components/forms";
import { createNilai, deleteNilai } from "@/app/actions";
import { PRED_TONE, predikat, TIPE_NILAI } from "@/lib/grading";

export default async function NilaiPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"]);

  const isSiswa = user.role === "SISWA";
  const isGuru = user.role === "GURU";
  const canGrade = user.role === "GURU" || user.role === "ADMIN";

  const nilai = await prisma.nilai.findMany({
    where: isSiswa ? { siswaId: user.id } : {},
    include: { siswa: { select: { id: true, name: true, nis: true } }, guru: { select: { name: true } } },
    orderBy: { id: "asc" },
  });

  // Guru hanya boleh melihat dan menilai siswa kelas yang ia ampu, supaya nilai
  // antar kelas tidak tercampur di halaman yang sama.
  const siswaAmpu = user.role === "GURU"
    ? await prisma.kelas.findMany({
        where: { guruId: user.id },
        select: { siswa: { select: { id: true } } },
      })
    : [];
  const idSiswaAmpu = new Set(siswaAmpu.flatMap((k) => k.siswa.map((s) => s.id)));

  const nilaiTerlihat = isSiswa
    ? nilai
    : user.role === "GURU"
      ? nilai.filter((n) => idSiswaAmpu.has(n.siswaId))
      : nilai;

  const siswa = await prisma.user.findMany({
    where: {
      role: "SISWA",
      active: true,
      ...(user.role === "GURU" ? { id: { in: [...idSiswaAmpu] } } : {}),
    },
    orderBy: { name: "asc" },
  });
  const tahunAktif = await prisma.tahunAjaran.findFirst({ where: { aktif: true } });

  // Tugas untuk dropdown dibatasi ke tugas milik guru yang sedang login.
  const tugasOpsi = await prisma.tugas.findMany({
    where: isGuru ? { guruId: user.id } : {},
    select: { id: true, judul: true, kelas: { select: { nama: true } } },
    orderBy: { deadline: "desc" },
    take: 50,
  });

  const dapatUbah = (guruId: string) => user.role === "ADMIN" || guruId === user.id;

  return (
    <div>
      <PageHeader
        title="Penilaian"
        desc={isSiswa ? "Daftar nilai yang sudah masuk." : "Input dan pantau nilai siswa."}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card title={`Total ${nilaiTerlihat.length} nilai`}>
            {nilaiTerlihat.length === 0 ? (
              <EmptyState message="Belum ada data nilai." />
            ) : (
                <DataTable
                  minWidth={640}
                  caption="Daftar nilai siswa"
                  head={
                    <>
                      <th scope="col" className="w-[24%]">Siswa</th>
                      <th scope="col" className="w-[13%]">Jenis</th>
                      <th scope="col" className="w-[9%]">Sem.</th>
                      <th scope="col" className="w-[10%] text-right">Nilai</th>
                      <th scope="col" className="w-[12%] text-right">Predikat</th>
                      <th scope="col" className="w-[20%]">Catatan</th>
                      {canGrade && <th scope="col" className="w-[12%] text-right">Aksi</th>}
                    </>
                  }
                >
                {nilaiTerlihat.map((n) => (
                  <tr key={n.id} className="transition hover:bg-slate-50">
                    <td className="truncate font-medium text-slate-800">
                      {n.siswa.name}
                      <p className="truncate text-xs font-normal text-slate-400">
                        {n.siswa.nis ? `NIS ${n.siswa.nis}` : ""}
                      </p>
                    </td>
                    <td>
                      <Badge tone="slate">{n.tipe}</Badge>
                    </td>
                    <td className="text-slate-600">{n.semester}</td>
                    <td className="text-right font-semibold text-slate-800">{n.nilai}</td>
                    <td className="text-right">
                      <Badge tone={PRED_TONE[predikat(n.nilai)]}>{predikat(n.nilai)}</Badge>
                    </td>
                    <td className="truncate text-xs text-slate-500" title={n.catatan ?? undefined}>
                      {n.catatan ?? "-"}
                    </td>
                    {canGrade && (
                      <td className="text-right">
                        {dapatUbah(n.guruId) ? (
                          <div className="flex justify-end gap-2">
                            <EditNilaiForm
                              id={n.id}
                              defaultNilai={n.nilai}
                              defaultCatatan={n.catatan}
                            />
                            <DeleteForm
                              action={deleteNilai}
                              id={n.id}
                              confirm={`Hapus nilai ${n.nilai} untuk ${n.siswa.name}?`}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>
        </div>

        {canGrade && (
          <div>
            <ActionForm action={createNilai} title="Input Nilai Baru">
              <Field
                label="Siswa"
                name="siswaId"
                required
                options={siswa.map((s) => ({ value: s.id, label: `${s.name} (${s.nis ?? "-"})` }))}
              />
              <Field
                label="Jenis"
                name="tipe"
                required
                defaultValue="HARIAN"
                options={TIPE_NILAI.map((t) => ({ value: t, label: t }))}
              />
              <Field label="Semester" name="semester" type="number" defaultValue={tahunAktif?.semester ?? 1} min={1} max={12} required />
              <Field label="Nilai (0-100)" name="nilai" type="number" min={0} max={100} step={0.1} required />
              <Field
                label="Tugas (untuk nilai bertipe TUGAS)"
                name="tugasId"
                hint="Pilih tugas bila nilainya dari pengumpulan tugas."
                options={[
                  { value: "", label: "-- tidak ada --" },
                  ...tugasOpsi.map((t) => ({ value: t.id, label: `${t.judul} (${t.kelas.nama})` })),
                ]}
              />
              <Field label="Catatan" name="catatan" hint="Catatan untuk siswa, opsional." />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
