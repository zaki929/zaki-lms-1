"use client";

import { useEffect, useState } from "react";

/**
 * Toast global untuk hasil server action.
 *
 * Kenapa tidak cukup state lokal di dalam form? Karena setiap server action
 * memanggil revalidatePath() yang me-remount subtree, jadi state useActionState
 * ikut ke-reset dan pesan sukses "berhasil dihapus" akan hilang seketika.
 * Toast hidup di layout (AppShell) sehingga tidak ikut ter-remount.
 */

export type ToastKind = "success" | "error";

type Toast = { id: number; kind: ToastKind; message: string };

declare global {
  interface WindowEventMap {
    "lms:toast": CustomEvent<{ kind: ToastKind; message: string }>;
  }
}

let counter = 0;

export function toast(kind: ToastKind, message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("lms:toast", { detail: { kind, message } })
  );
}

export function toastFromState(state: { error?: string; success?: string } | undefined) {
  if (!state) return;
  if (state.error) toast("error", state.error);
  else if (state.success) toast("success", state.success);
}

const ICON: Record<ToastKind, string> = {
  success: "M12 4a8 8 0 100 16 8 8 0 000-16zM9 12l2 2 4-4",
  error: "M12 8v5M12 16.5v.5M12 3a9 9 0 100 18 9 9 0 000-18z",
};

export function ToastHost() {
  return <Toasts />;
}

function Toasts() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const { kind, message } = (e as CustomEvent<{ kind: ToastKind; message: string }>).detail;
      counter += 1;
      const id = counter;
      setItems((prev) => [...prev.slice(-2), { id, kind, message }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
    window.addEventListener("lms:toast", onToast);
    return () => window.removeEventListener("lms:toast", onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    // Kanan-atas di desktop: kanan-bawah akan menutupi tombol submit form
    // yang berada di kolom kanan. Di mobile tetap bawah (legenda lebih mudah).
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end"
      role="status"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${t.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path d={ICON[t.kind]} />
          </svg>
          <span className="min-w-0 flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
