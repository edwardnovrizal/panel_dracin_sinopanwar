"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { fetchAdminSettings } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminLayout({ children }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState(false);
  const pageTitle = useMemo(() => {
    const parts = String(pathname || "").split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    return parts
      .map((p) =>
        p
          .replace(/[-_]/g, " ")
          .split(" ")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
          .join(" ")
      )
      .join(" • ");
  }, [pathname]);
  const pageSubtitle = useMemo(() => {
    const parts = String(pathname || "").split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    return parts
      .map((p) =>
        p
          .replace(/[-_]/g, " ")
          .split(" ")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
          .join(" ")
      )
      .join(" / ");
  }, [pathname]);
  const sectionIcon = useMemo(() => {
    const first = String(pathname || "").split("/").filter(Boolean)[0] || "dashboard";
    if (first === "settings") return "settings-solid";
    if (first === "scan") return "monitoring";
    if (["dashboard","users","payments","series","tags","episodes","ads","notification","redirect","announce"].includes(first)) return first;
    return "dashboard";
  }, [pathname]);
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchAdminSettings();
        if (!mounted) return;
        setMaintenance(!!res?.meta?.maintenance);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-zinc-50">
        <div className="text-sm text-zinc-700">Mengalihkan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-black/10 bg-white flex flex-col">
        <div className="px-4 py-4 shrink-0">
          <div className="text-lg font-semibold text-black">Admin Panel</div>
          <div className="mt-1 text-xs text-zinc-800">{user?.display_name || user?.email}</div>
        </div>
        <nav className="mt-2 space-y-3 px-2 overflow-y-auto flex-1 py-4">
          <NavItem href="/dashboard" label="Dashboard" icon="dashboard" active={pathname === "/dashboard"} disabled={maintenance} />
          <NavItem href="/settings/config" label="Config" icon="settings-solid" active={pathname?.startsWith("/settings/config")} disabled={maintenance} />
          <NavHeader label="User Management" />
          <div className="space-y-1 pl-2">
            <NavItem href="/users" label="Users" icon="users" active={pathname?.startsWith("/users")} disabled={maintenance} />
            <NavItem href="/payments" label="Payments" icon="payments" active={pathname?.startsWith("/payments")} disabled={maintenance} />
          </div>
          <NavHeader label="Content" />
          <div className="space-y-1 pl-2">
            <NavItem href="/series" label="Series" icon="series" active={pathname?.startsWith("/series")} disabled={maintenance} />
            <NavItem href="/tags" label="Tags" icon="tags" active={pathname?.startsWith("/tags")} disabled={maintenance} />
            <NavItem href="/episodes" label="Episodes" icon="episodes" active={pathname?.startsWith("/episodes")} disabled={maintenance} />
          </div>
          <NavHeader label="Operations" />
          <div className="space-y-1 pl-2">
            <NavItem href="/scan" label="Scan" icon="monitoring" active={pathname?.startsWith("/scan")} disabled={maintenance} />
          </div>
          <NavHeader label="Setting" />
          <div className="space-y-1 pl-2">
            <NavItem href="/settings/ads" label="Ads" icon="ads" active={pathname?.startsWith("/settings/ads")} disabled={maintenance} />
            <NavItem href="/settings/notification" label="Notification" icon="notification" active={pathname?.startsWith("/settings/notification")} disabled={maintenance} />
            <NavItem href="/settings/redirect" label="Redirect" icon="redirect" active={pathname?.startsWith("/settings/redirect")} disabled={maintenance} />
            <NavItem href="/settings/announce" label="Announce" icon="announce" active={pathname?.startsWith("/settings/announce")} disabled={maintenance} />
          </div>
          <NavItem href="/settings" label="Settings" icon="settings" active={pathname === "/settings"} disabled={false} />
        </nav>
        <div className="border-t border-black/10 p-3 shrink-0">
          <button
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            className="w-full rounded-full border border-black/10 px-3 py-2 text-sm font-medium text-black transition hover:bg-black/[.04]"
          >
            Keluar
          </button>
        </div>
      </aside>
      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0EFFF] text-[#6D4AFF]">
                <span className="scale-110">
                  <ItemIcon name={sectionIcon} active={true} />
                </span>
              </span>
              <div>
                <div className="text-base font-semibold text-black tracking-wide">{pageTitle}</div>
                <div className="text-xs text-zinc-600">{pageSubtitle}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-nowrap">
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                Admin
              </span>
            </div>
          </div>
          {maintenance && <div className="border-t border-amber-200 bg-amber-50/90 px-6 py-2 text-center text-xs font-medium text-amber-700">Sistem dalam mode maintenance. Lengkapi Settings.</div>}
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ href, label, active, disabled }) {
  const cls = `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${active ? "bg-[#6D4AFF] text-white shadow-sm" : "text-black hover:bg-[#F0EFFF]"}`;
  if (disabled) {
    return (
      <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400 border border-black/10 bg-white opacity-60 cursor-not-allowed">
        <ItemIcon name={arguments[0]?.icon} active={false} />
        <span>{label}</span>
      </div>
    );
  }
  return (
    <Link href={href} className={cls}>
      <ItemIcon name={arguments[0]?.icon} active={active} />
      <span>{label}</span>
    </Link>
  );
}

function NavHeader({ label }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-black/10 bg-[#F0EFFF] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#6D4AFF]">
      <span>{label}</span>
    </div>
  );
}

function ItemIcon({ name, active }) {
  const stroke = active ? "currentColor" : "currentColor";
  if (name === "dashboard") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="7" r="3.5" stroke={stroke} strokeWidth="1.5" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "payments") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke={stroke} strokeWidth="1.5" />
        <rect x="3" y="9" width="18" height="3" fill="currentColor" />
      </svg>
    );
  }
  if (name === "series") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "tags") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 10V5a2 2 0 0 1 2-2h5l9 9-7 7-9-9z" stroke={stroke} strokeWidth="1.5" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (name === "episodes") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" />
        <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
        />
      </svg>
    );
  }
  if (name === "settings-solid") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    );
  }
  if (name === "monitoring") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
        />
      </svg>
    );
  }
  if (name === "ads") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke={stroke} strokeWidth="1.5" />
        <path d="M7 9l4 3-4 3V9z" fill="currentColor" />
        <line x1="13" y1="9" x2="19" y2="9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="13" x2="19" y2="13" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "notification") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3V9z" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="19" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (name === "redirect") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 12h12" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 8l4 4-4 4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "announce") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 12l8-4v8l-8-4z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 8l6-1v10l-6-1" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 13l-2 4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}
