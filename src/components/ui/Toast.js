"use client";
import { useEffect, useMemo, useRef } from "react";

export default function Toast({ items = [], onClose, duration = 4000 }) {
  const list = useMemo(() => items.slice(-5), [items]);
  const timersRef = useRef(new Map());

  useEffect(() => {
    list.forEach((t) => {
      if (!timersRef.current.has(t.id)) {
        const timer = setTimeout(() => {
          onClose?.(t.id);
          timersRef.current.delete(t.id);
        }, duration);
        timersRef.current.set(t.id, timer);
      }
    });
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [list, onClose, duration]);

  return (
    <div className="pointer-events-none fixed top-3 right-3 z-50 space-y-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm shadow ${
            t.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="pr-2">{t.message}</div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-zinc-700 hover:bg-black/[.04]"
            onClick={() => onClose?.(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
