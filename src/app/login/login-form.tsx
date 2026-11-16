"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type DemoAccount = {
  email: string;
  name: string;
  role: string;
  password: string;
  tone: string;
};

export default function LoginForm({ demo }: { demo: DemoAccount[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-800">Masuk</h2>
      <p className="text-sm text-slate-500">Gunakan akun yang terdaftar.</p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="nama@sekolah.test"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="••••••"
          />
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Akun demo cepat
      </p>

      {demo.length === 0 ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Belum ada akun demo yang tersedia. Jalankan{" "}
          <code className="font-mono">npm run db:seed</code> untuk membuatkannya.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-slate-500">
            Klik salah satu akun untuk mengisi form secara otomatis.
          </p>
          <div className="mt-3 grid gap-2">
            {demo.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                  setError("");
                }}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition hover:border-indigo-400 hover:bg-indigo-50/50"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-700">
                    {d.name} ({d.role})
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">{d.email}</span>
                </span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-white ${d.tone}`}>pakai</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}