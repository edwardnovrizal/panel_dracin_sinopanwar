"use client";

export function Modal({ isOpen, onClose, title, children, className = "" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-md rounded-xl border border-black/10 bg-white shadow-sm ${className}`}>
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <div className="text-sm font-semibold text-black">{title}</div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-black/[.04]"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
