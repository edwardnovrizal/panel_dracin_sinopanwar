export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 outline-none transition focus:border-black/30 ${className}`}
      {...props}
    />
  );
}
