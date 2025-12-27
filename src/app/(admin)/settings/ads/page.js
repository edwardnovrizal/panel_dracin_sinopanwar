"use client";
import AddButton from "@/components/ui/AddButton";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Toast from "@/components/ui/Toast";
import Tooltip from "@/components/ui/Tooltip";
import { createAppAd, deleteAppAd, fetchAppAds, updateAppAd } from "@/lib/api";
import { useEffect, useState } from "react";

const TYPE_OPTIONS = ["admob", "fan", "applovin"];
const STATUS_OPTIONS = ["review", "active", "banned", "pin", "no-pin", "new"];

export default function SettingAdsPage() {
  const [ads, setAds] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total_items: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ type: "", status: "" });
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [adSaving, setAdSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [adForm, setAdForm] = useState({
    unit_name: "",
    unit_description: "",
    type: "admob",
    app_id: "",
    native_code: "",
    interstitial_code: "",
    banner_code: "",
    app_open_code: "",
    reward_code: "",
    status: "review",
  });

  useEffect(() => {
    loadAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_flash");
      if (raw) {
        const flash = JSON.parse(raw);
        if (flash && flash.scope === "settings_ads" && flash.message) {
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

  async function loadAds(page = 1) {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAppAds({
        page,
        per_page: 20,
        type: filters.type || undefined,
        status: filters.status || undefined,
      });
      setAds(res?.data || []);
      setMeta(res?.meta || { current_page: 1, last_page: 1, total_items: (res?.data || []).length });
    } catch (err) {
      setError(err?.message || "Gagal memuat iklan");
    } finally {
      setLoading(false);
    }
  }

  function statusBadgeVariant(s) {
    if (s === "active") return "success";
    if (s === "banned") return "danger";
    return "default";
  }

  function resetForm() {
    setAdForm({
      unit_name: "",
      unit_description: "",
      type: "admob",
      app_id: "",
      native_code: "",
      interstitial_code: "",
      banner_code: "",
      app_open_code: "",
      reward_code: "",
      status: "review",
    });
  }

  function openAdCreate() {
    setEditingAd(null);
    resetForm();
    setAdModalOpen(true);
  }

  function openAdEdit(ad) {
    setEditingAd(ad);
    setAdForm({
      unit_name: ad?.unit_name || "",
      unit_description: ad?.unit_description || "",
      type: ad?.type || "admob",
      app_id: ad?.app_id || "",
      native_code: ad?.native_code || "",
      interstitial_code: ad?.interstitial_code || "",
      banner_code: ad?.banner_code || "",
      app_open_code: ad?.app_open_code || "",
      reward_code: ad?.reward_code || "",
      status: ad?.status || "review",
    });
    setAdModalOpen(true);
  }

  async function saveAd() {
    if (!adForm.unit_name || !adForm.type) return;
    setAdSaving(true);
    try {
      if (editingAd?.id) {
        await updateAppAd(editingAd.id, adForm);
      } else {
        await createAppAd(adForm);
      }
      setAdModalOpen(false);
      setEditingAd(null);
      resetForm();
      try {
        localStorage.setItem(
          "admin_flash",
          JSON.stringify({
            scope: "settings_ads",
            type: "success",
            message: "Data ads berhasil disimpan",
          })
        );
      } catch {}
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        await loadAds(meta.current_page || 1);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menyimpan ads", "error");
    } finally {
      setAdSaving(false);
    }
  }

  function openDeleteConfirm(ad) {
    setDeleteTarget(ad);
    setDeleteOpen(true);
  }
  async function confirmDelete() {
    if (!deleteTarget?.id) {
      setDeleteOpen(false);
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteAppAd(deleteTarget.id);
      try {
        localStorage.setItem(
          "admin_flash",
          JSON.stringify({
            scope: "settings_ads",
            type: "success",
            message: `Data "${deleteTarget?.unit_name || "Ads"}" berhasil dihapus`,
          })
        );
      } catch {}
      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        await loadAds(meta.current_page || 1);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menghapus ads", "error");
    } finally {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Ads</h1>
          <p className="text-sm text-zinc-700">Kelola konfigurasi iklan.</p>
        </div>
        <div className="flex items-center gap-3 flex-nowrap">
          <Select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="w-[180px]"
          >
            <option value="">Semua Tipe</option>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="w-[180px]"
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
          <AddButton label="Tambah Ads" onClick={openAdCreate} />
        </div>
      </div>
      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-fit text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left w-[360px]">Nama</th>
                <th className="px-3 py-2 text-left w-[280px]">Deskripsi</th>
                <th className="px-3 py-2 text-left w-[180px]">Tipe & Status</th>
                <th className="px-3 py-2 text-left w-[200px]">App ID</th>
                <th className="px-3 py-2 text-left w-[200px]">Native</th>
                <th className="px-3 py-2 text-left w-[200px]">Interstitial</th>
                <th className="px-3 py-2 text-left w-[200px]">Banner</th>
                <th className="px-3 py-2 text-left w-[200px]">App Open</th>
                <th className="px-3 py-2 text-left w-[200px]">Reward</th>
                <th className="px-3 py-2 text-left w-[140px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-zinc-600">Memuat...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-red-600">{error}</td>
                </tr>
              ) : (ads || []).length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-zinc-600">Tidak ada data</td>
                </tr>
              ) : (
                (ads || []).map((ad) => (
                  <tr key={ad.id || ad.unit_name} className="border-t border-black/5 hover:bg-zinc-50">
                    <td className="px-3 py-2">
                      <Tooltip content={ad.unit_name || ""}>
                        <div className="max-w-[320px] truncate whitespace-nowrap cursor-pointer">
                          {ad.unit_name || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <Tooltip content={ad.unit_description || ""}>
                        <div className="max-w-[280px] truncate whitespace-nowrap cursor-pointer">
                          {ad.unit_description || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {ad.type ? (
                          <Badge variant="info">{ad.type}</Badge>
                        ) : (
                          <span>-</span>
                        )}
                        {ad.status ? (
                          <Badge variant={statusBadgeVariant(ad.status)}>{ad.status}</Badge>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Tooltip content={ad.app_id || ""}>
                        <div className="max-w-[200px] truncate whitespace-nowrap cursor-pointer">
                          {ad.app_id || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <Tooltip content={ad.native_code || ""}>
                        <div className="max-w-[200px] truncate whitespace-nowrap cursor-pointer">
                          {ad.native_code || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <Tooltip content={ad.interstitial_code || ""}>
                        <div className="max-w-[200px] truncate whitespace-nowrap cursor-pointer">
                          {ad.interstitial_code || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <Tooltip content={ad.banner_code || ""}>
                        <div className="max-w-[200px] truncate whitespace-nowrap cursor-pointer">
                          {ad.banner_code || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <Tooltip content={ad.app_open_code || ""}>
                        <div className="max-w-[200px] truncate whitespace-nowrap cursor-pointer">
                          {ad.app_open_code || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <Tooltip content={ad.reward_code || ""}>
                        <div className="max-w-[200px] truncate whitespace-nowrap cursor-pointer">
                          {ad.reward_code || "-"}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <IconButton name="edit" title="Edit" variant="outline" onClick={() => openAdEdit(ad)} />
                        <IconButton name="trash" title="Hapus" variant="danger" onClick={() => openDeleteConfirm(ad)} />
                      </div>
                    </td>
                  </tr>
                ))
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
              onClick={() => loadAds((meta.current_page || 1) - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => loadAds((meta.current_page || 1) + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={adModalOpen}
        onClose={() => setAdModalOpen(false)}
        title={editingAd ? "Edit Ads" : "Tambah Ads"}
        className="max-w-3xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-700">Nama</label>
              <Input
                value={adForm.unit_name}
                onChange={(e) => setAdForm((f) => ({ ...f, unit_name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Tipe</label>
              <Select
                value={adForm.type}
                onChange={(e) => setAdForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-zinc-700">Deskripsi</label>
              <Input
                value={adForm.unit_description}
                onChange={(e) => setAdForm((f) => ({ ...f, unit_description: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-700">App ID</label>
              <Input value={adForm.app_id} onChange={(e) => setAdForm((f) => ({ ...f, app_id: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Native Code</label>
              <Input value={adForm.native_code} onChange={(e) => setAdForm((f) => ({ ...f, native_code: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Interstitial Code</label>
              <Input value={adForm.interstitial_code} onChange={(e) => setAdForm((f) => ({ ...f, interstitial_code: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Banner Code</label>
              <Input value={adForm.banner_code} onChange={(e) => setAdForm((f) => ({ ...f, banner_code: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">App Open Code</label>
              <Input value={adForm.app_open_code} onChange={(e) => setAdForm((f) => ({ ...f, app_open_code: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Reward Code</label>
              <Input value={adForm.reward_code} onChange={(e) => setAdForm((f) => ({ ...f, reward_code: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Status</label>
              <Select
                value={adForm.status}
                onChange={(e) => setAdForm((f) => ({ ...f, status: e.target.value }))}
                className="mt-1"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setAdModalOpen(false)}>
              Tutup
            </Button>
            <Button onClick={saveAd} disabled={adSaving || !adForm.unit_name || !adForm.type}>
              {adSaving ? "Menyimpan..." : "Simpan"}
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
            Apakah anda yakin ingin menghapus data &quot;{deleteTarget?.unit_name || "-"}&quot;?
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
