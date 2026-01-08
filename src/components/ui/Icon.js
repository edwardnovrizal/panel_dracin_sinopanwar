"use client";
import Link from "next/link";
import { useRef, useState } from "react";

export default function Icon({ name, size = 16, className = "" }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", className };
  if (name === "search") {
    return (
      <svg {...props}>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="16.5" y2="16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="2.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="2.5" x2="16" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "filter") {
    return (
      <svg {...props}>
        <path d="M3 6h18l-6 7v5l-6 3v-8L3 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "download") {
    return (
      <svg {...props}>
        <path d="M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="4" y="17" width="16" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "add") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "more") {
    return (
      <svg {...props}>
        <circle cx="6" cy="12" r="2" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <circle cx="18" cy="12" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (name === "arrow-up") {
    return (
      <svg {...props}>
        <path d="M12 19V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "arrow-down") {
    return (
      <svg {...props}>
        <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 14l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...props}>
        <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg {...props}>
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "eye") {
    return (
      <svg {...props}>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (name === "eye-off") {
    return (
      <svg {...props}>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "edit") {
    return (
      <svg {...props}>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M14.06 6.19l3.75 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "trash") {
    return (
      <svg {...props}>
        <path d="M5 7h14M10 7V5h4v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "dot") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      </svg>
    );
  }
  if (name === "link") {
    return (
      <svg {...props}>
        <path d="M10 14l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 17a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 7a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}

export function IconButton({
  name,
  href,
  onClick,
  title,
  ariaLabel,
  variant = "outline",
  className = "",
}) {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  const base = "inline-flex items-center justify-center rounded-md p-1 h-8 w-8 text-sm transition";
  const variants = {
    primary: "bg-[#6D4AFF] text-white hover:bg-[#5b3be6]",
    outline: "border border-black/10 text-black hover:bg-black/[.04] bg-white",
    danger: "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    success: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ghost: "text-black hover:bg-black/[.04]",
  };
  const cls = `${base} ${variants[variant] || variants.outline} ${className}`;
  function showTip() {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ x: r.left + r.width / 2, y: r.bottom + 6 });
  }
  function hideTip() {
    setTip(null);
  }
  const common = {
    className: cls,
    onMouseEnter: showTip,
    onMouseLeave: hideTip,
    title,
    "aria-label": ariaLabel || title || name,
  };
  const El = href ? Link : "button";
  return (
    <>
      <El {...common} ref={ref} href={href} onClick={onClick} type={href ? undefined : "button"}>
        <Icon name={name} size={16} />
      </El>
      {tip && title && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-black px-2 py-1 text-xs text-white shadow"
          style={{ left: tip.x, top: tip.y, transform: "translateX(-50%)" }}
        >
          {title}
        </div>
      )}
    </>
  );
}
