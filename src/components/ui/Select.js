export default function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-black/30 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
