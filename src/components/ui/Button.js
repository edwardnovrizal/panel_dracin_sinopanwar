export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-[#6D4AFF] text-white hover:bg-[#5b3be6]",
    outline:
      "border border-black/10 text-black hover:bg-black/[.04] bg-white",
    danger:
      "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    success:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ghost:
      "text-black hover:bg-black/[.04]",
  };
  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
