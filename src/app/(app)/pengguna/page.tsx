import { getSession } from "@/lib/auth";
import { prisma, ROLE_LABEL, ROLES } from "@/lib/prisma";
import type { Role } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, DataTable, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, Field } from "@/components/forms";
import { createUser, deleteUser, toggleUser } from "@/app/actions";

export default async function PenggunaPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK"]);

  const isAdmin = user.role === "ADMIN";

  const users = await prisma.user.findMany({
    include: { kelasDiikuti: { select: { nama: true } } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        desc={isAdmin ? "Tambah, aktifkan, dan hapus akun pengguna." : "Daftar seluruh pengguna sekolah (read-only)."}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card title={`${users.length} pengguna`}>
            {users.length === 0 ? (
              <EmptyState message="Belum ada pengguna." />
            ) : (
              <div>
                <DataTable
                  minWidth={520}
                  caption="Daftar pengguna sekolah"
                  head={
                    <>
                      <th scope="col" className="w-[22%]">Nama</th>
                      <th scope="col" className="w-[24%]">Email</th>
                      <th scope="col" className="w-[14%]">Role</th>
                      <th scope="col" className="w-[16%]">Kelas</th>
                      <th scope="col" className="w-[10%]">Status</th>
                      {isAdmin && (
                        <th scope="col" className="w-[14%] text-right">Aksi</th>
                      )}
                    </>
                  }
                >
                  {users.map((p) => (
                    <tr key={p.id} className="transition hover:bg-slate-50">
                      <td className="truncate font-medium text-slate-800">
                        {p.name}
                        <p className="truncate text-xs font-normal text-slate-400">
                          {p.nis ? `NIS ${p.nis}` : p.nip ? `NIP ${p.nip}` : ""}
                        </p>
                      </td>
                      <td className="truncate text-slate-600">{p.email}</td>
                      <td>
                        <Badge tone="violet">{ROLE_LABEL[p.role as Role] ?? p.role}</Badge>
                      </td>
                      <td className="truncate text-xs text-slate-500">
                        {p.kelasDiikuti.map((k) => k.nama).join(", ") || "-"}
                      </td>
                      <td>
                        <Badge tone={p.active ? "green" : "red"}>
                          {p.active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="flex justify-end gap-2">
                            {p.id === user.id ? (
                              <span className="text-xs text-slate-400">Akun Anda</span>
                            ) : (
                              <>
                                <DeleteForm
                                  action={toggleUser}
                                  id={p.id}
                                  label={p.active ? "Nonaktifkan" : "Aktifkan"}
                                />
                                <DeleteForm
                                  action={deleteUser}
                                  id={p.id}
                                  confirm={`Hapus akun ${p.name}? Tindakan ini tidak bisa dibatalkan.`}
                                />
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </DataTable>
              </div>
            )}
          </Card>
        </div>

        {isAdmin && (
          <div>
            <ActionForm action={createUser} title="Tambah Pengguna">
              <Field label="Nama Lengkap" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Password" name="password" type="password" required placeholder="min 6 karakter" />
              <Field
                label="Role"
                name="role"
                required
                defaultValue="SISWA"
                options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
              />
              <Field label="NIS (siswa)" name="nis" hint="Wajib untuk akun siswa." />
              <Field label="NIP (guru)" name="nip" hint="Wajib untuk akun guru/kepsek/kurikulum." />
              <Field label="No. HP" name="phone" type="tel" placeholder="08xxxxxxxxxx" autoComplete="tel" />
              <Field
                label="Jenis Kelamin"
                name="gender"
                options={[
                  { value: "", label: "-- tidak diisi --" },
                  { value: "L", label: "Laki-laki" },
                  { value: "P", label: "Perempuan" },
                ]}
              />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
