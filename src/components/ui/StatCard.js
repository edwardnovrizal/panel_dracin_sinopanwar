"use client";

import Icon from "./Icon";

export function StatCard({ title, value, delta, deltaDirection = "up", hint, icon, className = "", status }) {
  const deltaColor =
    delta == null
      ? "text-zinc-500"
      : deltaDirection === "down"
      ? "text-red-600"
      : "text-emerald-600";
  return (
    <div className={`rounded-2xl border border-black/10 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="rounded-md bg-[#F0EFFF] p-2 text-[#6D4AFF]">
              <Icon name={icon} size={16} />
            </div>
          )}
          <div className="text-xs font-medium text-zinc-700">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          {delta != null && (
            <div className={`flex items-center gap-1 text-xs ${deltaColor}`}>
              <Icon name={deltaDirection === "down" ? "arrow-down" : "arrow-up"} size={14} />
              <span>{delta}</span>
            </div>
          )}
          {status != null && (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs ${
                status ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${status ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className="hidden sm:inline">{status ? "Aktif" : "Nonaktif"}</span>
            </span>
          )}
        </div>
      </div>
      {value != null && value !== "" && (
        <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-black">{value}</div>
      )}
      {hint && <div className="mt-1 text-xs text-zinc-600">{hint}</div>}
    </div>
  );
}
