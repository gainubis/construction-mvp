export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-36 rounded-full bg-slate-200" />
        <div className="h-10 w-72 rounded-2xl bg-slate-200" />
        <div className="h-5 w-[42rem] max-w-full rounded-full bg-slate-100" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-24 rounded-full bg-slate-200" />
            <div className="mt-4 h-10 w-16 rounded-2xl bg-slate-200" />
            <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
            <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-100" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="h-6 w-52 rounded-full bg-slate-200" />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                <div className="h-4 w-24 rounded-full bg-slate-200" />
                <div className="mt-3 h-6 w-48 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-36 rounded-full bg-slate-100" />
                <div className="mt-5 h-2 rounded-full bg-slate-200" />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="h-14 rounded-2xl bg-slate-100" />
                  <div className="h-14 rounded-2xl bg-slate-100" />
                  <div className="h-14 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="h-6 w-44 rounded-full bg-slate-200" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-slate-50 p-4">
                  <div className="h-4 w-40 rounded-full bg-slate-200" />
                  <div className="mt-2 h-4 w-28 rounded-full bg-slate-100" />
                  <div className="mt-3 h-3 w-20 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="h-6 w-44 rounded-full bg-slate-200" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-slate-50 p-4">
                  <div className="h-4 w-44 rounded-full bg-slate-200" />
                  <div className="mt-2 h-4 w-24 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 p-4">
                <div className="h-4 w-56 rounded-full bg-slate-200" />
                <div className="mt-2 h-3 w-32 rounded-full bg-slate-100" />
                <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="h-6 w-44 rounded-full bg-slate-200" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 p-4">
                <div className="h-4 w-40 rounded-full bg-slate-200" />
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-3 w-5/6 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
