import { Loader2 } from "lucide-react";

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-700/60 ${className}`} />;
}

export default function DashboardSkeleton({ isDark }) {
  return (
    <div className="space-y-6">
      <section
        className={`overflow-hidden rounded-[2.25rem] border p-6 shadow-2xl ${
          isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
        }`}
      >
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div>
            <div className="flex flex-wrap gap-3">
              <SkeletonBlock className="h-8 w-48" />
              <SkeletonBlock className="h-8 w-40" />
              <SkeletonBlock className="h-8 w-40" />
            </div>

            <div className="mt-5">
              <SkeletonBlock className="h-12 w-[90%]" />
              <SkeletonBlock className="mt-4 h-5 w-[75%]" />
              <SkeletonBlock className="mt-3 h-5 w-[55%]" />
            </div>
          </div>

          <div className={`rounded-[2rem] border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"}`}>
            <SkeletonBlock className="h-10 w-[80%]" />
            <div className="mt-8 space-y-4">
              <SkeletonBlock className="h-6 w-[70%]" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-6 w-[60%]" />
              <div className="grid grid-cols-2 gap-3">
                <SkeletonBlock className="h-32 w-full" />
                <SkeletonBlock className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-[1.5rem] border px-4 py-4">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <SkeletonBlock className="h-4 w-[70%]" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-52 w-full" />
        <SkeletonBlock className="h-52 w-full" />
        <SkeletonBlock className="h-52 w-full" />
        <SkeletonBlock className="h-52 w-full" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <SkeletonBlock className="h-6 w-[40%]" />
          <SkeletonBlock className="mt-4 h-[320px] w-full" />
        </div>
        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <SkeletonBlock className="h-6 w-[45%]" />
          <SkeletonBlock className="mt-4 h-[320px] w-full" />
        </div>
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
        <SkeletonBlock className="h-6 w-[55%]" />
        <SkeletonBlock className="mt-5 h-56 w-full" />
      </section>
    </div>
  );
}
