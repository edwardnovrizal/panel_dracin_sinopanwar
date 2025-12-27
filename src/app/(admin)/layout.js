"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import AddButton from "@/components/ui/AddButton";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import SearchInput from "@/components/ui/SearchInput";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-zinc-50">
        <div className="text-sm text-zinc-700">Mengalihkan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-black/10 bg-white">
        <div className="px-4 py-4">
          <div className="text-lg font-semibold text-black">Admin Panel</div>
          <div className="mt-1 text-xs text-zinc-800">{user?.display_name || user?.email}</div>
        </div>
        <nav className="mt-2 space-y-3 px-2">
          <NavItem href="/dashboard" label="Dashboard" icon="dashboard" active={pathname === "/dashboard"} />
          <NavItem href="/settings/config" label="Config" icon="settings-solid" active={pathname?.startsWith("/settings/config")} />
          <NavHeader label="User Management" />
          <div className="space-y-1 pl-2">
            <NavItem href="/users" label="Users" icon="users" active={pathname?.startsWith("/users")} />
            <NavItem href="/payments" label="Payments" icon="payments" active={pathname?.startsWith("/payments")} />
          </div>
          <NavHeader label="Content" />
          <div className="space-y-1 pl-2">
            <NavItem href="/series" label="Series" icon="series" active={pathname?.startsWith("/series")} />
            <NavItem href="/tags" label="Tags" icon="tags" active={pathname?.startsWith("/tags")} />
            <NavItem href="/episodes" label="Episodes" icon="episodes" active={pathname?.startsWith("/episodes")} />
          </div>
          <NavHeader label="Setting" />
          <div className="space-y-1 pl-2">
            <NavItem href="/settings/ads" label="Ads" icon="settings" active={pathname?.startsWith("/settings/ads")} />
            <NavItem href="/settings/notification" label="Notification" icon="settings" active={pathname?.startsWith("/settings/notification")} />
            <NavItem href="/settings/redirect" label="Redirect" icon="settings" active={pathname?.startsWith("/settings/redirect")} />
            <NavItem href="/settings/announce" label="Announce" icon="settings" active={pathname?.startsWith("/settings/announce")} />
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-black/10">
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
              <SearchInput placeholder="Cari..." className="w-64" />
              <Button variant="ghost" className="gap-2 px-3">
                <span className="text-[#6D4AFF]">
                  <Icon name="filter" size={16} />
                </span>
                Filter
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-nowrap">
              <Button variant="outline" className="gap-2">
                <Icon name="calendar" size={16} />
                This Month
              </Button>
              <AddButton />
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ href, label, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-[#6D4AFF] text-white shadow-sm"
          : "text-black hover:bg-[#F0EFFF]"
      }`}
    >
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.5" stroke={stroke} strokeWidth="1.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "settings-solid") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.12 2.14c.3-.03.6.15.7.44l.3 1a7.1 7.1 0 0 1 1.38.56l.92-.62c.26-.17.6-.13.83.1l1.6 1.6c.23.23.27.57.1.83l-.62.92c.21.43.38.89.5 1.36l1 .3c.29.1.47.4.44.7l-.23 2.3c-.03.3-.25.56-.55.64l-1.02.26c-.09.47-.24.93-.43 1.36l.63.89c.18.26.16.61-.06.83l-1.6 1.6a.75.75 0 0 1-.83.06l-.89-.63c-.43.19-.89.34-1.36.43l-.26 1.02c-.08.3-.34.52-.64.55l-2.3.23a.75.75 0 0 1-.7-.44l-.3-1a7.1 7.1 0 0 1-1.38-.56l-.92.62a.75.75 0 0 1-.83-.1l-1.6-1.6a.75.75 0 0 1-.1-.83l.62-.92a7.1 7.1 0 0 1-.56-1.38l-1-.3a.75.75 0 0 1-.44-.7l.23-2.3c.03-.3.25-.56.55-.64l1.02-.26c.09-.47.24-.93.43-1.36l-.63-.89a.75.75 0 0 1 .06-.83l1.6-1.6c.23-.23.57-.27.83-.1l.89.63c.43-.19.89-.34 1.36-.43l.26-1.02c.08-.3.34-.52.64-.55l2.3-.23zm.88 7.36a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
      </svg>
    );
  }
  return null;
}
