"use client";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Toast from "@/components/ui/Toast";
import Tooltip from "@/components/ui/Tooltip";
import {
  fetchAppAds,
  fetchAppAnnounces,
  fetchAppConfig,
  fetchAppNotifications,
  fetchAppRedirects,
  updateAppConfig,
} from "@/lib/api";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export default function SettingConfigPage() {
  function DropdownPreview({ value, onChange, options = [], placeholder = "— Tidak ada —", showIcon = true, className = "" }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const selected = options.find((o) => o.id === value) || null;
    useEffect(() => {
      function onDocClick(e) {
        const el = rootRef.current;
        if (!el) return;
        if (!el.contains(e.target)) setOpen(false);
      }
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
    return (
      <div ref={rootRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition hover:border-black/20 focus:border-[#6D4AFF]/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            {showIcon &&
              (selected?.image ? (
                <Image
                  src={selected.image}
                  alt={selected.label || ""}
                  width={24}
                  height={24}
                  unoptimized={isPrivateBase()}
                  className="h-6 w-6 rounded-md border border-black/10 object-cover"
                />
              ) : (
                <span className="h-6 w-6 rounded-md border border-black/10 bg-zinc-100" />
              ))}
            <div className="min-w-0">
              <div className="truncate">{selected ? selected.label : placeholder}</div>
              {selected?.desc && <div className="truncate text-xs text-zinc-600">{selected.desc}</div>}
              {Array.isArray(selected?.tags) && selected.tags.length > 0 && (
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  {selected.tags.filter(Boolean).map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="rounded-full border border-black/10 bg-zinc-50 px-2 py-[2px] text-[11px] text-zinc-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span className="ml-3 text-zinc-500">▾</span>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-black/15 bg-white shadow-sm">
            <div className="max-h-64 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50"
              >
                {showIcon && <span className="h-6 w-6 rounded-md border border-black/10 bg-zinc-100" />}
                <div className="min-w-0">
                  <div className="truncate">{placeholder}</div>
                </div>
              </button>
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                >
                  {showIcon &&
                    (o.image ? (
                      <Image
                        src={o.image}
                        alt={o.label || ""}
                        width={24}
                        height={24}
                        unoptimized={isPrivateBase()}
                        className="h-6 w-6 rounded-md border border-black/10 object-cover"
                      />
                    ) : (
                      <span className="h-6 w-6 rounded-md border border-black/10 bg-zinc-100" />
                    ))}
                  <div className="min-w-0">
                    <div className="truncate font-medium text-black">{o.label}</div>
                    {o.desc && <div className="truncate text-xs text-zinc-600">{o.desc}</div>}
                    {Array.isArray(o.tags) && o.tags.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {o.tags.filter(Boolean).map((t, i) => (
                          <span
                            key={`${t}-${i}`}
                            className="rounded-full border border-black/10 bg-zinc-50 px-2 py-[2px] text-[11px] text-zinc-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [lists, setLists] = useState({
    ads: [],
    notifications: [],
    redirects: [],
    announces: [],
  });
  const [form, setForm] = useState({
    global: { isActive: true, isLive: true },
    notification: { id: "", isEnable: false },
    ads: {
      id: "",
      isEnable: false,
      interval: 30,
      nativeEnable: true,
      interstitialEnable: false,
      bannerEnable: true,
      appOpenEnable: false,
      rewardEnable: false,
    },
    redirect: { id: "", isEnable: false },
    announce: { id: "", isEnable: false },
  });

  const loadConfigAndLists = useCallback(async () => {
    try {
      const [cfg, adsRes, notifRes, redRes, annRes] = await Promise.all([
        fetchAppConfig(),
        fetchAppAds({ page: 1, per_page: 100 }),
        fetchAppNotifications({ page: 1, per_page: 100 }),
        fetchAppRedirects({ page: 1, per_page: 100 }),
        fetchAppAnnounces({ page: 1, per_page: 100 }),
      ]);
      setConfig(cfg?.data || null);
      setLists({
        ads: adsRes?.data || [],
        notifications: notifRes?.data || [],
        redirects: redRes?.data || [],
        announces: annRes?.data || [],
      });
      const current = cfg?.data || {};
      setForm({
        global: {
          isActive: !!current.global?.isActive,
          isLive: !!current.global?.isLive,
        },
        notification: {
          id: current.notification?.id || "",
          isEnable: !!current.notification?.isEnable,
        },
        ads: {
          id: current.ads?.id || "",
          isEnable: !!current.ads?.isEnable,
          interval: current.ads?.interval ?? 30,
          nativeEnable: !!current.ads?.nativeEnable,
          interstitialEnable: !!current.ads?.interstitialEnable,
          bannerEnable: !!current.ads?.bannerEnable,
          appOpenEnable: !!current.ads?.appOpenEnable,
          rewardEnable: !!current.ads?.rewardEnable,
        },
        redirect: {
          id: current.redirect?.id || "",
          isEnable: !!current.redirect?.isEnable,
        },
        announce: {
          id: current.announce?.id || "",
          isEnable: !!current.announce?.isEnable,
        },
      });
    } catch (err) {
      addToast(err?.message || "Gagal memuat konfigurasi", "error");
    }
  }, []);

  useEffect(() => {
    loadConfigAndLists();
  }, [loadConfigAndLists]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_flash");
      if (raw) {
        const flash = JSON.parse(raw);
        if (flash && flash.scope === "settings_config" && flash.message) {
          addToast(flash.message, flash.type === "error" ? "error" : "success");
        }
        localStorage.removeItem("admin_flash");
      }
    } catch {}
  }, []);

  function addToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }
  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function buildImageUrl(path) {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";
    if (!path) return "";
    try {
      const u = new URL(path, BASE_URL);
      return u.href;
    } catch {
      return `${BASE_URL}${String(path).startsWith("/") ? path : `/${path}`}`;
    }
  }
  function isPrivateBase() {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";
    try {
      const host = new URL(BASE_URL).hostname;
      return host === "localhost" || host === "127.0.0.1" || host === "::1";
    } catch {
      return false;
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await updateAppConfig({
        global: {
          isActive: !!form.global.isActive,
          isLive: !!form.global.isLive,
        },
        notification: {
          id: form.notification.id || undefined,
          isEnable: !!form.notification.isEnable,
        },
        ads: {
          id: form.ads.id || undefined,
          isEnable: !!form.ads.isEnable,
          interval: Number(form.ads.interval || 0),
          nativeEnable: !!form.ads.nativeEnable,
          interstitialEnable: !!form.ads.interstitialEnable,
          bannerEnable: !!form.ads.bannerEnable,
          appOpenEnable: !!form.ads.appOpenEnable,
          rewardEnable: !!form.ads.rewardEnable,
        },
        redirect: {
          id: form.redirect.id || undefined,
          isEnable: !!form.redirect.isEnable,
        },
        announce: {
          id: form.announce.id || undefined,
          isEnable: !!form.announce.isEnable,
        },
      });
      try {
        localStorage.setItem(
          "admin_flash",
          JSON.stringify({
            scope: "settings_config",
            type: "success",
            message: "Konfigurasi berhasil disimpan",
          })
        );
      } catch {}
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        await loadConfigAndLists();
      }
    } catch (err) {
      addToast(err?.message || "Gagal menyimpan konfigurasi", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Config</h1>
          <p className="text-sm text-zinc-700">Pengaturan gabungan UI aktif.</p>
        </div>
      </div>
      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="p-6 space-y-8">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-black">Global</div>
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-1">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-black">Aktif</div>
                  <div className="text-[11px] text-zinc-600">Aktifkan konfigurasi UI gabungan</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, global: { ...f.global, isActive: !f.global.isActive } }))}
                  aria-pressed={form.global.isActive}
                  aria-label="Aktifkan konfigurasi UI"
                  className={`mt-1 inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${form.global.isActive ? "bg-emerald-500" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
                >
                  <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form.global.isActive ? "translate-x-5" : ""}`} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-black">Live</div>
                  <div className="text-[11px] text-zinc-600">Gunakan mode data produksi</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, global: { ...f.global, isLive: !f.global.isLive } }))}
                  aria-pressed={form.global.isLive}
                  aria-label="Aktifkan mode live"
                  className={`mt-1 inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${form.global.isLive ? "bg-emerald-500" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
                >
                  <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form.global.isLive ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card
                className="border-[#6D4AFF]/15 transition hover:border-[#6D4AFF]/30 hover:bg-[#F8F7FF]"
                title="Notification"
                subtitle={
                  <Tooltip content="Aktifkan notifikasi" position="bottom">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          notification: { ...f.notification, isEnable: !f.notification.isEnable },
                        }))
                      }
                      aria-pressed={form.notification.isEnable}
                      aria-label="Aktifkan notifikasi"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                        form.notification.isEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"
                      } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span
                        className={`ml-1 h-4 w-4 rounded-full bg-white transition ${
                          form.notification.isEnable ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </Tooltip>
                }
              >
                <DropdownPreview
                  value={form.notification.id}
                  onChange={(id) => setForm((f) => ({ ...f, notification: { ...f.notification, id } }))}
                  options={lists.notifications.map((n) => ({
                    id: n.id,
                    label: n.unit_name || n.title || n.id,
                    desc: n.url || "",
                    image: buildImageUrl(n.image),
                  }))}
                  showIcon
                />
              </Card>
              <Card
                className="border-[#6D4AFF]/15 transition hover:border-[#6D4AFF]/30 hover:bg-[#F8F7FF]"
                title="Redirect"
                subtitle={
                  <Tooltip content="Aktifkan redirect" position="bottom">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          redirect: { ...f.redirect, isEnable: !f.redirect.isEnable },
                        }))
                      }
                      aria-pressed={form.redirect.isEnable}
                      aria-label="Aktifkan redirect"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                        form.redirect.isEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"
                      } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span
                        className={`ml-1 h-4 w-4 rounded-full bg-white transition ${
                          form.redirect.isEnable ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </Tooltip>
                }
              >
                <DropdownPreview
                  value={form.redirect.id}
                  onChange={(id) => setForm((f) => ({ ...f, redirect: { ...f.redirect, id } }))}
                  options={lists.redirects.map((r) => ({
                    id: r.id,
                    label: r.title || r.unit_name || r.id,
                    desc: r.url || "",
                    image: buildImageUrl(r.image),
                  }))}
                  showIcon
                />
              </Card>
              <Card
                className="border-[#6D4AFF]/15 transition hover:border-[#6D4AFF]/30 hover:bg-[#F8F7FF]"
                title="Announce"
                subtitle={
                  <Tooltip content="Aktifkan announce" position="bottom">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          announce: { ...f.announce, isEnable: !f.announce.isEnable },
                        }))
                      }
                      aria-pressed={form.announce.isEnable}
                      aria-label="Aktifkan announce"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                        form.announce.isEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"
                      } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span
                        className={`ml-1 h-4 w-4 rounded-full bg-white transition ${
                          form.announce.isEnable ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </Tooltip>
                }
              >
                <DropdownPreview
                  value={form.announce.id}
                  onChange={(id) => setForm((f) => ({ ...f, announce: { ...f.announce, id } }))}
                  options={lists.announces.map((a) => ({
                    id: a.id,
                    label: a.unit_name || a.id,
                    desc: a.content || "",
                  }))}
                  showIcon={false}
                />
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card
              className="border-[#6D4AFF]/20 transition hover:border-[#6D4AFF]/40 hover:bg-[#F8F7FF]"
              title="Ads"
              subtitle={
                <Tooltip content="Aktifkan iklan" position="bottom">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        ads: { ...f.ads, isEnable: !f.ads.isEnable },
                      }))
                    }
                    aria-pressed={form.ads.isEnable}
                    aria-label="Aktifkan iklan"
                    className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                      form.ads.isEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"
                    } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                  >
                    <span
                      className={`ml-1 h-4 w-4 rounded-full bg-white transition ${
                        form.ads.isEnable ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </Tooltip>
              }
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-[240px] lg:w-[320px]">
                  <DropdownPreview
                    value={form.ads.id}
                    onChange={(id) => setForm((f) => ({ ...f, ads: { ...f.ads, id } }))}
                    options={lists.ads.map((a) => ({
                      id: a.id,
                      label: a.unit_name || a.id,
                      desc: "",
                      tags: [a.type || "-", a.status || "-"],
                    }))}
                    showIcon={false}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-700">Interval</span>
                  <Input
                    type="number"
                    value={form.ads.interval}
                    onChange={(e) => setForm((f) => ({ ...f, ads: { ...f.ads, interval: Number(e.target.value || 0) } }))}
                    className="w-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-center flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">Native</span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ads: { ...f.ads, nativeEnable: !f.ads.nativeEnable } }))}
                      aria-pressed={form.ads.nativeEnable}
                      aria-label="Aktifkan iklan native"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${form.ads.nativeEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form.ads.nativeEnable ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">Interstitial</span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ads: { ...f.ads, interstitialEnable: !f.ads.interstitialEnable } }))}
                      aria-pressed={form.ads.interstitialEnable}
                      aria-label="Aktifkan iklan interstitial"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${form.ads.interstitialEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form.ads.interstitialEnable ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">Banner</span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ads: { ...f.ads, bannerEnable: !f.ads.bannerEnable } }))}
                      aria-pressed={form.ads.bannerEnable}
                      aria-label="Aktifkan iklan banner"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${form.ads.bannerEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form.ads.bannerEnable ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">App Open</span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ads: { ...f.ads, appOpenEnable: !f.ads.appOpenEnable } }))}
                      aria-pressed={form.ads.appOpenEnable}
                      aria-label="Aktifkan iklan app open"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${form.ads.appOpenEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form.ads.appOpenEnable ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">Reward</span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ads: { ...f.ads, rewardEnable: !f.ads.rewardEnable } }))}
                      aria-pressed={form.ads.rewardEnable}
                      aria-label="Aktifkan iklan reward"
                      className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${form.ads.rewardEnable ? "bg-[#6D4AFF]" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/40`}
                    >
                      <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form.ads.rewardEnable ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={saveConfig} disabled={saving} className="hover:cursor-pointer">
              {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
            </Button>
          </div>
        </div>
      </div>
      <Toast items={toasts} onClose={removeToast} />
    </div>
  );
}
