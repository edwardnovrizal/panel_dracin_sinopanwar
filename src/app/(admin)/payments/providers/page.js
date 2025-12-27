"use client";

import AddButton from "@/components/ui/AddButton";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon, { IconButton } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Toast from "@/components/ui/Toast";
import { createPaymentProvider, deletePaymentProvider, fetchPaymentProviders, updatePaymentProvider } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentProvidersPage() {
  const pathname = usePathname();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [provQ, setProvQ] = useState("");
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerMessage, setProviderMessage] = useState("");
  const [toasts, setToasts] = useState([]);
  const [deleteProvOpen, setDeleteProvOpen] = useState(false);
  const [deleteProvTarget, setDeleteProvTarget] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerForm, setProviderForm] = useState({
    code: "",
    name: "",
    description: "",
    selected: false,
  });

  function normalizeProviders(payload) {
    if (Array.isArray(payload)) return payload;
    const data = payload?.providers ?? payload?.data?.providers ?? payload?.data ?? payload?.items ?? payload?.list ?? [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.providers)) return data.providers;
    function findFirstArray(obj) {
      if (!obj || typeof obj !== "object") return null;
      for (const v of Object.values(obj)) {
        if (Array.isArray(v)) return v;
        if (v && typeof v === "object") {
          if (Array.isArray(v.providers)) return v.providers;
          for (const vv of Object.values(v)) {
            if (Array.isArray(vv)) return vv;
          }
        }
      }
      return null;
    }
    const any = findFirstArray(payload) || findFirstArray(payload?.data);
    if (Array.isArray(any)) return any;
    return [];
  }

  function providerStatusBadgeVariant(s) {
    if (s === "enable") return "success";
    if (s === "disable") return "danger";
    return "default";
  }

  useEffect(() => {
    const loadProviders = async () => {
      setLoading(true);
      setError("");
      try {
        const p = await fetchPaymentProviders();
        const list = normalizeProviders(p);
        setProviders(list);
      } catch (err) {
        setError(err?.message || "Gagal memuat providers");
      } finally {
        setLoading(false);
      }
    };
    loadProviders();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_flash");
      if (raw) {
        const flash = JSON.parse(raw);
        if (flash && flash.scope === "payments_providers" && flash.message) {
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

  function openProviderEdit(p) {
    setSelectedProvider(p);
    setProviderForm({
      code: p.code || "",
      name: p.name || "",
      description: p.description || "",
      selected: !!p.selected,
    });
    setProviderMessage("");
    setProviderModalOpen(true);
  }
  function openProviderCreate() {
    setSelectedProvider(null);
    setProviderForm({
      code: "",
      name: "",
      description: "",
      selected: false,
    });
    setProviderMessage("");
    setProviderModalOpen(true);
  }
  async function saveProvider() {
    setProviderSaving(true);
    setProviderMessage("");
    try {
      if (selectedProvider?.id) {
        await updatePaymentProvider(selectedProvider.id, {
          name: providerForm.name,
          description: providerForm.description,
          selected: !!providerForm.selected,
        });
      } else {
        if (!providerForm.code || !providerForm.name) {
          throw new Error("Isi code dan name");
        }
        await createPaymentProvider({
          code: providerForm.code,
          name: providerForm.name,
          description: providerForm.description,
          selected: !!providerForm.selected,
        });
      }
      try {
        localStorage.setItem(
          "admin_flash",
          JSON.stringify({
            scope: "payments_providers",
            type: "success",
            message: selectedProvider?.id ? "Provider berhasil diperbarui" : "Provider berhasil dibuat",
          })
        );
      } catch {}
      setProviderModalOpen(false);
      setSelectedProvider(null);
      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        const p = await fetchPaymentProviders();
        const list = normalizeProviders(p);
        setProviders(list);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menyimpan provider", "error");
    } finally {
      setProviderSaving(false);
    }
  }
  function openProviderDelete(p) {
    setDeleteProvTarget(p);
    setDeleteProvOpen(true);
  }
  async function confirmProviderDelete() {
    if (!deleteProvTarget?.id) {
      setDeleteProvOpen(false);
      setDeleteProvTarget(null);
      return;
    }
    try {
      await deletePaymentProvider(deleteProvTarget.id);
      try {
        localStorage.setItem(
          "admin_flash",
          JSON.stringify({
            scope: "payments_providers",
            type: "success",
            message: `Provider "${deleteProvTarget?.name || deleteProvTarget?.code || "-"}" berhasil dihapus`,
          })
        );
      } catch {}
      setDeleteProvOpen(false);
      setDeleteProvTarget(null);
      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        const res = await fetchPaymentProviders();
        const list = res?.providers || res?.data?.providers || [];
        setProviders(list || []);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menghapus provider", "error");
      setDeleteProvOpen(false);
      setDeleteProvTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[#6D4AFF]">
            <Icon name="check" size={18} />
          </span>
          <h1 className="text-xl font-semibold text-black">Providers</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-700">Kelola penyedia pembayaran. Metode diambil otomatis dari provider.</p>
      </div>
      <div className="border-b border-black/10">
        <nav className="flex gap-6">
          {[
            { href: "/payments/actions", label: "Actions" },
            { href: "/payments/webhooks", label: "Webhook Logs" },
            { href: "/payments/providers", label: "Providers" },
            { href: "/payments/plans", label: "Plans" },
          ].map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={`py-3 text-sm font-medium transition ${active ? "border-b-2 border-black text-black" : "text-zinc-700 hover:text-black"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between flex-nowrap">
          <SearchInput value={provQ} onChange={(e) => setProvQ(e.target.value)} placeholder="Cari provider" className="w-64" />
          <div className="flex items-center gap-2 flex-nowrap">
            <AddButton label="Tambah Provider" onClick={openProviderCreate} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Methods</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Selected</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">
                    Memuat...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : (providers || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                (providers || [])
                  .filter((p) => {
                    const s = provQ.trim().toLowerCase();
                    if (!s) return true;
                    const nm = String(p.name || p.code || "").toLowerCase();
                    return nm.includes(s);
                  })
                  .map((p) => {
                    const code = p.code || p;
                    const selected = !!p.selected;
                    const methods = Array.isArray(p.methods) ? p.methods.map((m) => m?.code || m?.name || m).filter(Boolean) : [];
                    return (
                      <tr key={code} className={`border-t border-black/5 hover:bg-zinc-50 ${selected ? "bg-emerald-50" : ""}`}>
                        <td className="px-3 py-2">{p.code || "-"}</td>
                        <td className="px-3 py-2">{p.name || "-"}</td>
                        <td className="px-3 py-2">
                          {methods.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {methods.map((m) => (
                                <Badge key={`${code}-${m}`} variant="default">
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2">{p.status ? <Badge variant={providerStatusBadgeVariant(p.status)}>{p.status}</Badge> : "-"}</td>
                        <td className="px-3 py-2">{p.selected ? <Badge variant="success">selected</Badge> : "-"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <IconButton name="edit" title="Edit" variant="outline" onClick={() => openProviderEdit(p)} />
                            <IconButton name="trash" title="Hapus" variant="danger" onClick={() => openProviderDelete(p)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={providerModalOpen} onClose={() => setProviderModalOpen(false)} title={selectedProvider ? "Edit Provider" : "Tambah Provider"} className="max-w-3xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {!selectedProvider && (
              <div>
                <label className="text-xs font-medium text-zinc-700">Code</label>
                <Select value={providerForm.code} onChange={(e) => setProviderForm((f) => ({ ...f, code: e.target.value }))} className="mt-1">
                  <option value="">Pilih provider</option>
                  <option value="doku">doku</option>
                  <option value="tripay">tripay</option>
                </Select>
                <div className="mt-1 text-xs text-zinc-700">Pilih code provider: doku atau tripay.</div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-zinc-700">Name</label>
              <Input placeholder="Contoh: DOKU" value={providerForm.name} onChange={(e) => setProviderForm((f) => ({ ...f, name: e.target.value }))} />
              <div className="mt-1 text-xs text-zinc-700">Nama provider yang ditampilkan pada admin/client.</div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 outline-none transition focus:border-black/30"
              rows={4}
              placeholder="Contoh: Pembayaran melalui DOKU dengan VA dan QRIS"
              value={providerForm.description}
              onChange={(e) => setProviderForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className=" text-xs text-zinc-700">Deskripsi singkat provider dan catatan integrasi.</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-700">
              <span className="font-medium text-md text-black">Jadikan provider aktif untuk checkout</span>
            </div>
            <button
              type="button"
              aria-pressed={providerForm.selected ? "true" : "false"}
              onClick={() => setProviderForm((f) => ({ ...f, selected: !f.selected }))}
              className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                providerForm.selected ? "bg-emerald-500" : "bg-zinc-300"
              } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
            >
              <span className={`ml-1 inline-block h-4 w-4 rounded-full bg-white transition ${providerForm.selected ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <div>{providerMessage && <div className="text-xs text-zinc-700">{providerMessage}</div>}</div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setProviderModalOpen(false)}>
              Tutup
            </Button>
            <Button onClick={saveProvider} disabled={providerSaving}>
              {providerSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={deleteProvOpen}
        onClose={() => {
          setDeleteProvOpen(false);
          setDeleteProvTarget(null);
        }}
        title="Konfirmasi Hapus Provider"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="text-sm text-black">Apakah anda yakin ingin menghapus provider &quot;{deleteProvTarget?.name || deleteProvTarget?.code || "-"}&quot;?</div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteProvOpen(false);
                setDeleteProvTarget(null);
              }}
            >
              Batal
            </Button>
            <Button variant="danger" onClick={confirmProviderDelete}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>

      <Toast items={toasts} onClose={removeToast} />
    </div>
  );
}
