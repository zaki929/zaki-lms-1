"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/app/actions";
import { updateModulAjar } from "@/app/actions";
import { toastFromState } from "@/components/toast";
import { Field, TextArea } from "@/components/forms";

type Option = { value: string; label: string };

export function EditModulAjarForm({
  modul,
  mapel,
  kelas,
  guru,
}: {
  modul: {
    id: string;
    judul: string;
    status: string;
    file?: string | null;
    mapelId: string;
    kelasId?: string | null;
    guruId: string;
  };
  mapel: Option[];
  kelas: Option[];
  guru: Option[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    async (_prev, fd) => {
      let next: ActionState;
      try {
        next = (await updateModulAjar(fd)) ?? undefined;
      } catch (e) {
        next = { error: e instanceof Error ? e.message : "Terjadi kesalahan." };
      }
      toastFromState(next);
      return next;
    },
    undefined
  );
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (buka && state?.success) setBuka(false);
  }, [buka, state?.success]);

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Ubah
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-800">Ubah Modul Ajar</h3>
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={modul.id} />
          <TextArea label="Judul Modul" name="judul" required rows={2} defaultValue={modul.judul} />
          <Field label="Mata Pelajaran" name="mapelId" required options={mapel} defaultValue={modul.mapelId} />
          <Field label="Kelas" name="kelasId" options={kelas} defaultValue={modul.kelasId ?? ""} />
          <Field label="Guru Penyusun" name="guruId" required options={guru} defaultValue={modul.guruId} />
          <Field
            label="Status"
            name="status"
            required
            defaultValue={modul.status}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "REVIEW", label: "Review" },
              { value: "SELESAI", label: "Selesai" },
            ]}
          />
          <Field label="Berkas" name="file" defaultValue={modul.file ?? ""} placeholder="modul-ajar.pdf" />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBuka(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}
