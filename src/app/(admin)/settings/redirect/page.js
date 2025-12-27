"use client";
import AddButton from "@/components/ui/AddButton";
import Button from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { createAppRedirect, deleteAppRedirect, fetchAppRedirects, updateAppRedirect } from "@/lib/api";
import Image from "next/image";
import { useEffect, useState } from "react";

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

export default function SettingRedirectPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total_items: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    unit_name: "",
    unit_description: "",
    title: "",
    description: "",
    url: "",
    image: null,
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_flash");
      if (raw) {
        const flash = JSON.parse(raw);
        if (flash && flash.scope === "settings_redirect" && flash.message) {
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

  async function loadItems(page = 1) {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAppRedirects({ page, per_page: 20 });
      setItems(res?.data || []);
      setMeta(res?.meta || { current_page: 1, last_page: 1, total_items: (res?.data || []).length });
    } catch (err) {
      setError(err?.message || "Gagal memuat redirect");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      unit_name: "",
      unit_description: "",
      title: "",
      description: "",
      url: "",
      image: null,
    });
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({
      unit_name: item?.unit_name || "",
      unit_description: item?.unit_description || "",
      title: item?.title || "",
      description: item?.description || "",
      url: item?.url || "",
      image: null,
    });
    setModalOpen(true);
  }

  async function saveItem() {
    if (!form.unit_name || !form.title || !form.url) return;
    setSaving(true);
    try {
      if (editing?.id) {
        await updateAppRedirect(editing.id, form);
      } else {
        await createAppRedirect(form);
      }
      setModalOpen(false);
      setEditing(null);
      resetForm();
      try {
        localStorage.setItem(
          "admin_flash",
          JSON.stringify({
            scope: "settings_redirect",
            type: "success",
            message: "Data redirect berhasil disimpan",
          })
        );
      } catch {}
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        await loadItems(meta.current_page || 1);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menyimpan redirect", "error");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(item) {
    setDeleteTarget(item);
    setDeleteOpen(true);
  }
  async function confirmDelete() {
    if (!deleteTarget?.id) {
      setDeleteOpen(false);
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteAppRedirect(deleteTarget.id);
      try {
        localStorage.setItem(
          "admin_flash",
          JSON.stringify({
            scope: "settings_redirect",
            type: "success",
            message: `Data "${deleteTarget?.title || deleteTarget?.unit_name || "Redirect"}" berhasil dihapus`,
          })
        );
      } catch {}
      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        await loadItems(meta.current_page || 1);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menghapus redirect", "error");
    } finally {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Redirect</h1>
          <p className="text-sm text-zinc-700">Kelola konfigurasi redirect.</p>
        </div>
        <AddButton label="Tambah Redirect" onClick={openCreate} />
      </div>
      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: 80 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 240 }} />
              <col style={{ width: 300 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 140 }} />
            </colgroup>
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Gambar</th>
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Unit Deskripsi</th>
                <th className="px-3 py-2 text-left">Deskripsi</th>
                <th className="px-3 py-2 text-left">URL</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">Memuat...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-red-600">{error}</td>
                </tr>
              ) : (items || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">Tidak ada data</td>
                </tr>
              ) : (
                (items || []).map((it) => {
                  const src = buildImageUrl(it.image);
                  return (
                    <tr key={it.id || it.unit_name} className="border-t border-black/5 hover:bg-zinc-50">
                      <td className="px-3 py-2">
                        {src ? (
                          <Image
                            src={src}
                            alt={it.title || it.unit_name || ""}
                            width={40}
                            height={40}
                            unoptimized={isPrivateBase()}
                            className="rounded-md object-cover border border-black/10"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md border border-black/10 bg-zinc-100" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="truncate">{it.unit_name || "-"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="truncate">{it.title || "-"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="truncate">{it.unit_description || "-"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="truncate">{it.description || it.unit_description || "-"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="truncate">{it.url || "-"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <IconButton name="edit" title="Edit" variant="outline" onClick={() => openEdit(it)} />
                          <IconButton name="trash" title="Hapus" variant="danger" onClick={() => openDeleteConfirm(it)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-xs text-zinc-600">
            Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total_items}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={meta.current_page <= 1 || loading}
              onClick={() => loadItems((meta.current_page || 1) - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => loadItems((meta.current_page || 1) + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Redirect" : "Tambah Redirect"}
        className="max-w-xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-700">Nama</label>
              <Input value={form.unit_name} onChange={(e) => setForm((f) => ({ ...f, unit_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Title</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">URL</label>
              <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Deskripsi</label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Unit Description</label>
              <Input value={form.unit_description} onChange={(e) => setForm((f) => ({ ...f, unit_description: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Gambar (opsional)</label>
              <div className="mt-1 flex items-center gap-3">
                {(() => {
                  const preview =
                    form.image
                      ? URL.createObjectURL(form.image)
                      : editing?.image
                      ? buildImageUrl(editing.image)
                      : "";
                  return preview ? (
                    <Image
                      src={preview}
                      alt={form.title || editing?.title || ""}
                      width={48}
                      height={48}
                      unoptimized
                      className="rounded-md object-cover border border-black/10"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md border border-black/10 bg-zinc-100" />
                  );
                })()}
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black hover:bg-black/[.04]">
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))}
                      className="hidden"
                    />
                    Pilih Gambar
                  </label>
                  {form.image && (
                    <Button variant="outline" onClick={() => setForm((f) => ({ ...f, image: null }))}>
                      Hapus
                    </Button>
                  )}
                </div>
                {form.image && <div className="text-xs text-zinc-600 truncate max-w-[200px]">{form.image.name}</div>}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Tutup
            </Button>
            <Button onClick={saveItem} disabled={saving || !form.unit_name || !form.title || !form.url}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        title="Konfirmasi Hapus"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="text-sm text-black">
            Apakah anda yakin ingin menghapus data &quot;{deleteTarget?.title || deleteTarget?.unit_name || "-"}&quot;?
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>
              Batal
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>

      <Toast items={toasts} onClose={removeToast} />
    </div>
  );
}
