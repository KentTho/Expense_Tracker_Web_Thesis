
export default function MetricCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border p-5 shadow-xl ${tone.panel}`}>
      <div
        className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tone.iconWrap}`}
      >
        {Icon ? <Icon size={20} className={tone.icon || ""} /> : null}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">{title}</p>
      <h3 className="mt-4 text-3xl font-black tracking-tight">{value}</h3>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
