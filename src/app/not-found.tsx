import Link from "next/link";
import { BRAND } from "@/lib/brand";

/**
 * 404 global. Tanpa file ini Next.js menampilkan halaman default yang terlihat
 * seperti halaman rusak — bukan seperti aplikasi yang error dengan rapi.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-900 px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
        {BRAND.short}
      </p>
      <p className="text-6xl font-bold text-white">404</p>
      <h1 className="max-w-md text-xl font-semibold text-white">
        Halaman yang Anda cari tidak ditemukan
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-400">
        Alamat yang Anda buka sudah dipindahkan, dihapus, atau Anda tidak punya akses ke
        halaman tersebut. Periksa kembali tautannya.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Ke Dashboard
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Beranda
        </Link>
      </div>
    </main>
  );
}