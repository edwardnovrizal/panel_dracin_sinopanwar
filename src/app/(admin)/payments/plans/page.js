"use client";

import AddButton from "@/components/ui/AddButton";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon, { IconButton } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Toast from "@/components/ui/Toast";
import {
  createPaymentPlan,
  deletePaymentPlan,
  fetchPaymentPlans,
  updatePaymentPlan,
} from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentPlansPage() {
  const pathname = usePathname();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [planActiveOnly, setPlanActiveOnly] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [plansMessage, setPlansMessage] = useState("");
  const [editingPlan, setEditingPlan] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deletePlanOpen, setDeletePlanOpen] = useState(false);
  const [deletePlanTarget, setDeletePlanTarget] = useState(null);
  const [planForm, setPlanForm] = useState({
    label: "",
    description: "",
    code: "",
    amount: "",
    currency: "IDR",
    period: "month",
    duration_count: 1,
    discount_percent: "",
    discount_amount: "",
    active: true,
    sort_order: 1,
  });

  function normalizePlans(payload) {
    if (Array.isArray(payload)) return payload;
    const data =
      payload?.plans ??
      payload?.data?.plans ??
      payload?.data ??
      payload?.items ??
      payload?.list ??
      [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.plans)) return data.plans;
    function findFirstArray(obj) {
      if (!obj || typeof obj !== "object") return null;
      for (const v of Object.values(obj)) {
        if (Array.isArray(v)) return v;
        if (v && typeof v === "object") {
          if (Array.isArray(v.plans)) return v.plans;
          for (const vv of Object.values(v)) {
            if (Array.isArray(vv)) return vv;
          }
        }
      }
      return null;
    }
    const any =
      findFirstArray(payload) ||
      findFirstArray(payload?.data);
    if (Array.isArray(any)) return any;
    return [];
  }

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      setPlansError("");
      try {
        const res = await fetchPaymentPlans();
        const list = normalizePlans(res);
        setPlans(list);
      } catch (err) {
        setPlansError(err?.message || "Gagal memuat payment plans");
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, []);

  useEffect(() => {
    const reloadPlans = async () => {
      setPlansLoading(true);
      setPlansError("");
      try {
        const res = await fetchPaymentPlans({ active_only: planActiveOnly });
        const list = normalizePlans(res);
        setPlans(list);
      } catch (err) {
        setPlansError(err?.message || "Gagal memuat payment plans");
      } finally {
        setPlansLoading(false);
      }
    };
    reloadPlans();
  }, [planActiveOnly]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_flash");
      if (raw) {
        const flash = JSON.parse(raw);
        if (flash && flash.scope === "payments_plans" && flash.message) {
          const id = `${Date.now()}-${Math.random()}`;
          setToasts((prev) => [...prev, { id, message: flash.message, type: flash.type === "error" ? "error" : "success" }]);
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

  function openCreatePlan() {
    setEditingPlan(null);
    setPlanForm({
      label: "",
      description: "",
      code: "",
      amount: "",
      currency: "IDR",
      period: "month",
      duration_count: 1,
      discount_percent: "",
      discount_amount: "",
      active: true,
      sort_order: 1,
    });
    setPlanModalOpen(true);
  }
  function openEditPlan(pl) {
    setEditingPlan(pl);
    setPlanForm({
      label: pl.label || "",
      description: pl.description || "",
      code: pl.code || "",
      amount: pl.amount ?? "",
      currency: pl.currency || "IDR",
      period: pl.period || "month",
      duration_count: pl.duration_count ?? 1,
      discount_percent: pl.discount_percent ?? "",
      discount_amount: pl.discount_amount ?? "",
      active: !!pl.active,
      sort_order: pl.sort_order ?? 1,
    });
    setPlanModalOpen(true);
  }
  function openPlanDelete(pl) {
    setDeletePlanTarget(pl);
    setDeletePlanOpen(true);
  }
  async function savePlan() {
    setPlanSaving(true);
    setPlansMessage("");
    try {
      const payload = {
        label: String(planForm.label || "").trim(),
        description: String(planForm.description || "").trim(),
        code: String(planForm.code || "").trim() || undefined,
        amount: Number(planForm.amount),
        currency: planForm.currency,
        period: planForm.period,
        duration_count: Number(planForm.duration_count),
        discount_percent: planForm.discount_percent !== "" ? Number(planForm.discount_percent) : undefined,
        discount_amount: planForm.discount_amount !== "" ? Number(planForm.discount_amount) : undefined,
        active: !!planForm.active,
        sort_order: Number(planForm.sort_order),
      };
      if (!payload.label || !(payload.amount > 0) || !payload.period || !(payload.duration_count >= 1)) {
        throw new Error("Isi label, amount>0, period, duration_count>=1");
      }
      if (editingPlan?.id) {
        await updatePaymentPlan(editingPlan.id, payload);
        try {
          localStorage.setItem("admin_flash", JSON.stringify({ scope: "payments_plans", type: "success", message: "Plan berhasil diperbarui" }));
        } catch {}
        addToast("Plan berhasil diperbarui", "success");
      } else {
        await createPaymentPlan(payload);
        try {
          localStorage.setItem("admin_flash", JSON.stringify({ scope: "payments_plans", type: "success", message: "Plan berhasil dibuat" }));
        } catch {}
        addToast("Plan berhasil dibuat", "success");
      }
      setPlanModalOpen(false);
      setEditingPlan(null);
      if (typeof window !== "undefined") {
        setTimeout(() => {
          try {
            window.location.reload();
          } catch {}
        }, 100);
        setTimeout(async () => {
          try {
            const res = await fetchPaymentPlans({ active_only: planActiveOnly });
            const list = normalizePlans(res);
            setPlans(list);
          } catch {}
        }, 400);
      } else {
        const res = await fetchPaymentPlans({ active_only: planActiveOnly });
        const list = normalizePlans(res);
        setPlans(list);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menyimpan plan", "error");
    } finally {
      setPlanSaving(false);
    }
  }
  async function confirmPlanDelete() {
    if (!deletePlanTarget?.id) {
      setDeletePlanOpen(false);
      setDeletePlanTarget(null);
      return;
    }
    try {
      await deletePaymentPlan(deletePlanTarget.id);
      try {
        localStorage.setItem("admin_flash", JSON.stringify({ scope: "payments_plans", type: "success", message: `Plan "${deletePlanTarget?.label || "-"}" berhasil dihapus` }));
      } catch {}
      setDeletePlanOpen(false);
      setDeletePlanTarget(null);
      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        const res = await fetchPaymentPlans({ active_only: planActiveOnly });
        const list = normalizePlans(res);
        setPlans(list);
      }
    } catch (err) {
      addToast(err?.message || "Gagal menghapus plan", "error");
      setDeletePlanOpen(false);
      setDeletePlanTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[#6D4AFF]">
            <Icon name="check" size={18} />
          </span>
          <h1 className="text-xl font-semibold text-black">Plans</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-700">Kelola paket langganan untuk client.</p>
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
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-700">
              <Input type="checkbox" checked={planActiveOnly} onChange={(e) => setPlanActiveOnly(e.target.checked)} />
              Hanya aktif
            </label>
          </div>
          <AddButton label="Tambah Plan" onClick={openCreatePlan} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Label</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Currency</th>
                <th className="px-3 py-2 text-left">Period</th>
                <th className="px-3 py-2 text-left">Duration (days)</th>
                <th className="px-3 py-2 text-left">Active</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {plansLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-600">
                    Memuat...
                  </td>
                </tr>
              ) : plansError ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-red-600">
                    {plansError}
                  </td>
                </tr>
              ) : (plans || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-600">
                    Belum ada plan. Klik <span className="font-medium text-black">Tambah Plan</span> untuk membuat.
                  </td>
                </tr>
              ) : (
                (plans || []).map((pl) => (
                  <tr key={pl.id || pl.label} className="border-t border-black/5">
                    <td className="px-3 py-2">{pl.label || "-"}</td>
                    <td className="px-3 py-2">{pl.amount != null ? pl.amount : "-"}</td>
                    <td className="px-3 py-2">{pl.currency || "-"}</td>
                    <td className="px-3 py-2">{pl.period || "-"}</td>
                    <td className="px-3 py-2">{pl.duration_days != null ? pl.duration_days : "-"}</td>
                    <td className="px-3 py-2">{pl.active ? <Badge variant="success">active</Badge> : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <IconButton name="edit" title="Edit" variant="outline" onClick={() => openEditPlan(pl)} />
                        <IconButton name="trash" title="Hapus" variant="danger" onClick={() => openPlanDelete(pl)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {plansMessage && <div className="px-4 py-2 text-xs text-zinc-700">{plansMessage}</div>}
      </div>

      <Modal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} title={editingPlan ? "Edit Plan" : "Tambah Plan"} className="max-w-4xl">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-700">
              <span className="font-medium text-black">Jadikan plan tersedia untuk dipilih client</span>
            </div>
            <button
              type="button"
              aria-pressed={planForm.active ? "true" : "false"}
              aria-label="Aktifkan plan"
              onClick={() => setPlanForm((f) => ({ ...f, active: !f.active }))}
              className={`inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                planForm.active ? "bg-emerald-500" : "bg-zinc-300"
              } hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
            >
              <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${planForm.active ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-700">Label</label>
              <Input
                placeholder="Contoh: Premium Bulanan"
                value={planForm.label}
                onChange={(e) => setPlanForm((f) => ({ ...f, label: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Nama paket langganan.</div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Amount</label>
              <Input
                type="number"
                placeholder="Contoh: 10000"
                value={planForm.amount}
                onChange={(e) => setPlanForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Nominal biaya langganan.</div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Currency</label>
              <Select
                value={planForm.currency}
                onChange={(e) => setPlanForm((f) => ({ ...f, currency: e.target.value }))}
              >
                <option value="IDR">IDR</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Period</label>
              <Select
                value={planForm.period}
                onChange={(e) => setPlanForm((f) => ({ ...f, period: e.target.value }))}
              >
                <option value="day">day</option>
                <option value="week">week</option>
                <option value="month">month</option>
                <option value="year">year</option>
              </Select>
              <div className="mt-1 text-xs text-zinc-700">Satuan waktu berlangganan.</div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Duration Count</label>
              <Input
                type="number"
                placeholder="Contoh: 1"
                value={planForm.duration_count}
                onChange={(e) => setPlanForm((f) => ({ ...f, duration_count: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Banyaknya period. Contoh: 1 month = 30 hari.</div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Sort Order</label>
              <Input
                type="number"
                placeholder="Contoh: 1"
                value={planForm.sort_order}
                onChange={(e) => setPlanForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Urutan tampil dalam daftar.</div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Discount Percent</label>
              <Input
                type="number"
                placeholder="Contoh: 10"
                value={planForm.discount_percent}
                onChange={(e) => setPlanForm((f) => ({ ...f, discount_percent: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Opsional, diskon dalam persen.</div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Discount Amount</label>
              <Input
                type="number"
                placeholder="Contoh: 2000"
                value={planForm.discount_amount}
                onChange={(e) => setPlanForm((f) => ({ ...f, discount_amount: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Opsional, diskon nominal.</div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Code</label>
              <Input
                placeholder="Contoh: MONTHLY"
                value={planForm.code}
                onChange={(e) => setPlanForm((f) => ({ ...f, code: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Kode plan (opsional) untuk identifikasi internal.</div>
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-zinc-700">Description</label>
              <textarea
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 outline-none transition focus:border-black/30"
                rows={3}
                placeholder="Contoh: Plan bulanan premium dengan akses penuh fitur."
                value={planForm.description}
                onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="mt-1 text-xs text-zinc-700">Deskripsi singkat plan untuk referensi admin.</div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setPlanModalOpen(false)}>
              Tutup
            </Button>
            <Button onClick={savePlan} disabled={planSaving}>
              {planSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={deletePlanOpen}
        onClose={() => {
          setDeletePlanOpen(false);
          setDeletePlanTarget(null);
        }}
        title="Konfirmasi Hapus Plan"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="text-sm text-black">Apakah anda yakin ingin menghapus plan &quot;{deletePlanTarget?.label || "-"}&quot;?</div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeletePlanOpen(false);
                setDeletePlanTarget(null);
              }}
            >
              Batal
            </Button>
            <Button variant="danger" onClick={confirmPlanDelete}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
      <Toast items={toasts} onClose={removeToast} />
    </div>
  );
}
