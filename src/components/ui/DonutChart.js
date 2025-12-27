"use client";

import { useState } from "react";

export function DonutChart({ data = [], totalLabel, className = "" }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((a, b) => a + (b.value || 0), 0);
  const segments = data.reduce((acc, d, i) => {
    const prev = acc[i - 1];
    const start = prev ? prev.offset + prev.len : 0;
    const len = total > 0 ? (d.value / total) * circumference : 0;
    const seg = { len, color: d.color, label: d.label, value: d.value, offset: start };
    return [...acc, seg];
  }, []);
  const [hi, setHi] = useState(null);
  return (
    <div className={`rounded-2xl border border-black/10 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-800">{totalLabel || "Total"}</div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <g transform="translate(60,60)">
              <circle r={radius} stroke="#F3F4F6" strokeWidth="16" fill="none" />
              {segments.map((s, i) => (
                <circle
                  key={i}
                  r={radius}
                  stroke={s.color}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${s.len} ${circumference - s.len}`}
                  strokeDashoffset={-s.offset}
                  transform="rotate(-90)"
                  onMouseEnter={() => setHi(i)}
                  onMouseLeave={() => setHi(null)}
                />
              ))}
              <circle r={28} fill="white" />
              <text x="0" y="4" textAnchor="middle" className="fill-black" fontSize="14" fontWeight="600">
                {hi != null ? data[hi]?.value || 0 : total}
              </text>
            </g>
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between"
              onMouseEnter={() => setHi(i)}
              onMouseLeave={() => setHi(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-zinc-700">{d.label}</span>
              </div>
              <span className="text-sm font-medium text-black">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
