"use client";
import { useRef, useState } from "react";

export default function Tooltip({ content, children, position = "top", className = "" }) {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  function showTip() {
    if (!content) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = r.left + r.width / 2;
    const y = position === "top" ? r.top - 8 : r.bottom + 8;
    setTip({ x, y });
  }
  function hideTip() {
    setTip(null);
  }
  return (
    <>
      <span
        ref={ref}
        onMouseEnter={showTip}
        onMouseLeave={hideTip}
        className={className}
      >
        {children}
      </span>
      {tip && content && (
        <div
          className="pointer-events-none fixed z-50 max-w-[320px] rounded-md bg-black px-2 py-1 text-xs text-white shadow"
          style={{ left: tip.x, top: tip.y, transform: "translateX(-50%)" }}
        >
          {content}
        </div>
      )}
    </>
  );
}
