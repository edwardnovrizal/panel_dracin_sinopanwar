"use client";

import { useEffect, useRef, useState } from "react";

export function BarChart({ labels = [], series = [], className = "" }) {
  const height = 160;
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.data || [])
  );
  const seriesGap = 6;
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [chartWidth, setChartWidth] = useState(() => {
    const groupWidth = 40;
    const gap = 24;
    return labels.length * (groupWidth + gap) + gap;
  });

  useEffect(() => {
    function recalc() {
      const w = containerRef.current?.clientWidth || 160;
      setChartWidth(Math.max(160, Math.floor(w)));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [labels.length]);

  return (
    <div ref={containerRef} className={`relative rounded-2xl border border-black/10 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex w-full justify-end overflow-x-auto">
        <svg width={chartWidth} height={height} onMouseLeave={() => setHover(null)}>
          <line x1="0" y1={height - 20} x2={chartWidth} y2={height - 20} stroke="#E5E7EB" />
          {labels.map((label, i) => {
            const groupBlock = labels.length > 0 ? chartWidth / labels.length : chartWidth;
            const padding = 8;
            const usable = Math.max(0, groupBlock - padding * 2);
            const perWidth = Math.max(
              2,
              (usable - seriesGap * (Math.max(series.length, 1) - 1)) / Math.max(series.length, 1)
            );
            const x = i * groupBlock;
            return (
              <g key={i} transform={`translate(${x},0)`}>
                {series.map((s, j) => {
                  const val = s.data?.[i] || 0;
                  const h = Math.round(((val / max) * (height - 40)));
                  const rx = padding + j * (perWidth + seriesGap);
                  return (
                    <rect
                      key={j}
                      x={rx}
                      y={height - 20 - h}
                      width={perWidth}
                      height={h}
                      rx="4"
                      fill={s.color}
                      onMouseMove={(e) => {
                        const b = containerRef.current?.getBoundingClientRect();
                        const lx = e.clientX - (b?.left || 0);
                        const ly = e.clientY - (b?.top || 0);
                        setHover({ name: s.name, label, value: val, x: lx, y: ly });
                      }}
                    />
                  );
                })}
                <text x={groupBlock / 2} y={height - 4} textAnchor="middle" fontSize="10" fill="#6B7280">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-black px-2 py-1 text-xs text-white shadow"
          style={{ left: Math.max(8, hover.x - 24), top: Math.max(8, hover.y - 32) }}
        >
          {hover.name}: {hover.value}
        </div>
      )}
      {series.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-zinc-700">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
