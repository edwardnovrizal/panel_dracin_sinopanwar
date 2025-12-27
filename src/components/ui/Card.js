export function Card({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#6D4AFF]" />
            <div className="text-sm font-semibold text-black">{title}</div>
          </div>
          {subtitle && <div className="text-xs text-zinc-600">{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
