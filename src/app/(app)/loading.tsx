/**
 * Skeleton saat halaman (app) sedang dimuat.
 *
 * Halaman-halaman ini server-rendered dan menyentuh database, jadi render
 * pertama butuh waktu. Tanpa skeleton, user melihat layar kosong dan mengira
 * aplikasinya macet.
 */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden="true" />;
}

export default function AppLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Memuat halaman">
      <div>
        <Bar className="h-7 w-56" />
        <Bar className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <Bar className="h-11 w-1.5" />
              <div className="flex-1">
                <Bar className="h-3 w-24" />
                <Bar className="mt-2 h-6 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Bar className="h-4 w-2/3" />
              <Bar className="mt-3 h-3 w-full" />
              <Bar className="mt-2 h-3 w-4/5" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Bar className="h-4 w-32" />
          <Bar className="mt-4 h-16 w-full" />
          <Bar className="mt-3 h-16 w-full" />
        </div>
      </div>
    </div>
  );
}