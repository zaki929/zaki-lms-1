"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary global.
 *
 * Tanpa file ini, error server membuat user melihat halaman putih / stack trace.
 * Ini-component menangkapnya dan menampilkan pesan yang bisa ditindaklanjuti,
 * lalu otomatis reload sekali supaya error sementara (koneksi DB putus,
 * proses sedang compile) tidak menyisakan user di halaman rusak.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Tetap catat ke console supaya developer punya jejak saat user lapor.
    console.error("Terjadi kesalahan pada halaman:", error);
  }, [error]);

  const sementara = /fetch failed|ECONNREFUSED|SQLITE_BUSY|timeout/i.test(
    `${error.message} ${error.digest ?? ""}`
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-900 px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
        Terjadi kesalahan
      </p>
      <h1 className="max-w-md text-xl font-semibold text-white">
        Halaman ini gagal dimuat
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-400">
        {sementara
          ? "Koneksi ke database terputus. Coba muat ulang beberapa saat lagi."
          : "Ada kesalahan saat memproses data. Coba muat ulang halaman, atau kembali ke dashboard."}
      </p>

      {error.digest && (
        <p className="text-xs text-slate-500">
          Kode kesalahan: <span className="font-mono">{error.digest}</span>
        </p>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Muat Ulang
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Ke Dashboard
        </Link>
      </div>
    </main>
  );
}