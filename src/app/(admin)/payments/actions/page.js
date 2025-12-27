"use client";

import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon, { IconButton } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import {
    downloadPaymentOrdersCSV,
    fetchPaymentOrders,
    fetchPaymentProviders,
} from "@/lib/api";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["PENDING", "PAID", "FAILED", "EXPIRED", "CANCELED"];

function formatAmount(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

function statusBadgeVariant(s) {
  if (s === "PAID") return "success";
  if (s === "FAILED" || s === "EXPIRED" || s === "CANCELED") return "danger";
  return "default";
}
function statusIcon(s) {
  if (s === "PAID") return "check";
  if (s === "FAILED" || s === "EXPIRED" || s === "CANCELED") return "dot";
  return "dot";
}

export default function PaymentActionsPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total_items: 0,
    items_per_page: 20,
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [rangePreset, setRangePreset] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [providers, setProviders] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params = useMemo(() => {
    return {
      q: q.trim(),
      status: status || undefined,
      provider: provider || undefined,
      created_from: createdFrom ? new Date(createdFrom).toISOString() : undefined,
      created_to: createdTo ? new Date(createdTo).toISOString() : undefined,
      page,
      per_page: perPage,
    };
  }, [q, status, provider, createdFrom, createdTo, page, perPage]);

  useEffect(() => {
    const initialQ = searchParams?.get("q") || "";
    if (initialQ && initialQ !== q) {
      setPage(1);
      setQ(initialQ);
    }
  }, [searchParams, q]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const o = await fetchPaymentOrders(params);
        setOrders(o?.data || []);
        setMeta(o?.meta || meta);
      } catch (err) {
        setError(err?.message || "Gagal memuat orders");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.status, params.provider, params.created_from, params.created_to, params.page, params.per_page]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const p = await fetchPaymentProviders();
        setProviders(p?.providers || p?.data?.providers || []);
      } catch {}
    };
    loadMeta();
  }, []);

  function toLocalInputValue(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 0, 0);
    return x;
  }
  function applyRangePreset(val) {
    setRangePreset(val);
    setPage(1);
    const now = new Date();
    if (val === "today") {
      setCreatedFrom(toLocalInputValue(startOfDay(now)));
      setCreatedTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      setCreatedFrom(toLocalInputValue(startOfDay(y)));
      setCreatedTo(toLocalInputValue(endOfDay(y)));
      return;
    }
    if (val === "last7") {
      const s = startOfDay(new Date(now));
      s.setDate(s.getDate() - 7);
      setCreatedFrom(toLocalInputValue(s));
      setCreatedTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "last30") {
      const s = startOfDay(new Date(now));
      s.setDate(s.getDate() - 30);
      setCreatedFrom(toLocalInputValue(s));
      setCreatedTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "thisMonth") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      setCreatedFrom(toLocalInputValue(startOfDay(s)));
      setCreatedTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "lastMonth") {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      setCreatedFrom(toLocalInputValue(startOfDay(s)));
      setCreatedTo(toLocalInputValue(endOfDay(e)));
      return;
    }
  }
  function clearRange() {
    setRangePreset("");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
  }



  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[#6D4AFF]">
            <Icon name="check" size={18} />
          </span>
          <h1 className="text-xl font-semibold text-black">Payment Actions</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-700">Kelola orders: filter, lihat detail, export CSV.</p>
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
              <Link
                key={item.href}
                href={item.href}
                className={`py-3 text-sm font-medium transition ${
                  active ? "border-b-2 border-black text-black" : "text-zinc-700 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center justify-between">
        <SearchInput
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Cari invoice, email, display_name"
          className="w-72"
        />
        <Button variant="ghost" className="gap-2" onClick={() => setFiltersOpen((v) => !v)}>
          <span className="text-[#6D4AFF]">
            <Icon name="filter" size={16} />
          </span>
          {filtersOpen ? "Sembunyikan Filter" : "Tampilkan Filter"}
        </Button>
      </div>

      {filtersOpen && (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">Status</label>
            <Select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="mt-1"
            >
              <option value="">Semua</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Provider</label>
            <Select
              value={provider}
              onChange={(e) => {
                setPage(1);
                setProvider(e.target.value);
              }}
              className="mt-1"
            >
              <option value="">Semua</option>
              {(providers || []).map((p) => (
                <option key={p.code || p} value={p.code || p}>
                  {p.name || p.code || p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Per halaman</label>
            <Select
              value={perPage}
              onChange={(e) => {
                setPage(1);
                setPerPage(Number(e.target.value));
              }}
              className="mt-1"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-zinc-700">Rentang waktu</label>
              <Select
                value={rangePreset}
                onChange={(e) => applyRangePreset(e.target.value)}
                className="mt-1"
              >
                <option value="">Custom</option>
                <option value="today">Hari ini</option>
                <option value="yesterday">Kemarin</option>
                <option value="last7">7 hari terakhir</option>
                <option value="last30">30 hari terakhir</option>
                <option value="thisMonth">Bulan ini</option>
                <option value="lastMonth">Bulan lalu</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Dari tanggal</label>
              <Input
                type="datetime-local"
                value={createdFrom}
                onChange={(e) => {
                  setRangePreset("");
                  setPage(1);
                  setCreatedFrom(e.target.value || "");
                }}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">Sampai tanggal</label>
              <Input
                type="datetime-local"
                value={createdTo}
                onChange={(e) => {
                  setRangePreset("");
                  setPage(1);
                  setCreatedTo(e.target.value || "");
                }}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearRange}>
                Hapus
              </Button>
            </div>
          </div>
        </div>
        </div>
      )}

      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Invoice</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Provider</th>
                <th className="px-3 py-2"></th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-black/5">
                    <td className="px-3 py-2">{o.invoice_number}</td>
                    <td className="px-3 py-2">
                      {o.user?.email}{" "}
                      <span className="text-zinc-500">({o.user?.display_name || "-"})</span>
                    </td>
                    <td className="px-3 py-2">
                      {formatAmount(o.amount)} {o.currency}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={statusBadgeVariant(o.status)}>
                        <span className="mr-1 text-[#6D4AFF]">
                          <Icon name={statusIcon(o.status)} size={12} />
                        </span>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{o.provider}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          name="eye"
                          title="Detail"
                          href={`/payments/orders/${o.id}`}
                          variant="outline"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span>
              Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total_items}
            </span>
            <Button
              variant="ghost"
              className="gap-1"
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                setMessage("");
                try {
                  const blob = await downloadPaymentOrdersCSV({
                    status,
                    provider,
                    created_from: createdFrom ? new Date(createdFrom).toISOString() : undefined,
                    created_to: createdTo ? new Date(createdTo).toISOString() : undefined,
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `payment-orders-${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }, 0);
                } catch (err) {
                  setMessage(err?.message || "Gagal export CSV");
                } finally {
                  setExporting(false);
                }
              }}
            >
              <span className="text-[#6D4AFF]">
                <Icon name="download" size={16} />
              </span>
              {exporting ? "Mengekspor..." : "Export CSV"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
        {message && (
          <div className="px-4 pb-3 text-xs text-zinc-700">{message}</div>
        )}
      </div>
    </div>
  );
}
