"use client";

import Icon from "./Icon";

export default function SearchInput({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
        <Icon name="search" size={16} />
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-full border border-black/10 bg-white pl-9 pr-3 py-2 text-sm text-black outline-none transition focus:border-[#6D4AFF]/40"
      />
    </div>
  );
}
