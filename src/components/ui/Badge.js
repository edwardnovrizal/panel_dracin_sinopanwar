export function Badge({ children, variant = "default", className = "" }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs";
  const variants = {
    default: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-[#F0EFFF] text-[#6D4AFF]",
    danger: "bg-red-100 text-red-700",
  };
  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
