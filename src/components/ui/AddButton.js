"use client";
import Link from "next/link";
import Icon from "./Icon";

export default function AddButton({
  label = "Tambah",
  href,
  onClick,
  className = "",
  variant = "primary",
  iconSize = 16,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed gap-2 whitespace-nowrap cursor-pointer flex-shrink-0 min-w-[160px]";
  const variants = {
    primary: "bg-[#6D4AFF] text-white hover:bg-[#5b3be6]",
    outline: "border border-black/10 text-black hover:bg-black/[.04] bg-white",
    ghost: "text-black hover:bg-black/[.04]",
  };
  const cls = `${base} ${variants[variant] || variants.primary} ${className}`;
  const content = (
    <>
      <Icon name="add" size={iconSize} />
      <span>{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} onClick={onClick} {...props} type="button">
      {content}
    </button>
  );
}
