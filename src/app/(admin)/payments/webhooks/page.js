"use client";

import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon, { IconButton } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import { fetchPaymentProviders, fetchPaymentWebhookLogs } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

export default function PaymentWebhookLogsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rangePreset, setRangePreset] = useState("");
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const params = useMemo(() => {
    return {
      provider: provider || undefined,
      status: status || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
    };
  }, [provider, status, from, to]);

  const displayLogs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return logs || [];
    return (logs || []).filter((log) => {
      const iv = String(log?.invoice_number || "").toLowerCase();
      const tp = String(log?.type || "").toLowerCase();
      return iv.includes(s) || tp.includes(s);
    });
  }, [logs, q]);

  function isDateLike(s) {
    return typeof s === "string" && /\d{4}-\d{2}-\d{2}T/.test(s);
  }
  function isURLLike(s) {
    return typeof s === "string" && /^https?:\/\//.test(s);
  }
  function formatDate(s) {
    if (!s) return "-";
    try {
      return new Date(s).toLocaleString();
    } catch {
      return String(s);
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
  function flattenEntries(obj, prefix = "") {
    const out = [];
    const isObj = (val) => val != null && typeof val === "object";
    Object.entries(obj || {}).forEach(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (!isObj(v)) {
        out.push([key, v == null ? "-" : String(v)]);
        return;
      }
      if (Array.isArray(v)) {
        if (v.length === 0) {
          out.push([key, "[]"]);
        } else {
          v.forEach((it, i) => {
            const ik = `${key}[${i}]`;
            if (isObj(it)) {
              flattenEntries(it, ik).forEach((p) => out.push(p));
            } else {
              out.push([ik, it == null ? "-" : String(it)]);
            }
          });
        }
        return;
      }
      flattenEntries(v, key).forEach((p) => out.push(p));
    });
    return out;
  }

  useEffect(() => {
    setRangePreset("last7");
    const now = new Date();
    const s = startOfDay(new Date(now));
    s.setDate(s.getDate() - 7);
    setFrom(toLocalInputValue(s));
    setTo(toLocalInputValue(endOfDay(now)));
    const loadMeta = async () => {
      try {
        const p = await fetchPaymentProviders();
        setProviders(p?.providers || p?.data?.providers || []);
      } catch {}
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchPaymentWebhookLogs(params);
        const list = res?.logs || res?.data?.logs || [];
        setLogs(list);
      } catch (err) {
        setError(err?.message || "Gagal memuat log webhook");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params]);

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
    const now = new Date();
    if (val === "today") {
      setFrom(toLocalInputValue(startOfDay(now)));
      setTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      setFrom(toLocalInputValue(startOfDay(y)));
      setTo(toLocalInputValue(endOfDay(y)));
      return;
    }
    if (val === "last7") {
      const s = startOfDay(new Date(now));
      s.setDate(s.getDate() - 7);
      setFrom(toLocalInputValue(s));
      setTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "last30") {
      const s = startOfDay(new Date(now));
      s.setDate(s.getDate() - 30);
      setFrom(toLocalInputValue(s));
      setTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "thisMonth") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(toLocalInputValue(startOfDay(s)));
      setTo(toLocalInputValue(endOfDay(now)));
      return;
    }
    if (val === "lastMonth") {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      setFrom(toLocalInputValue(startOfDay(s)));
      setTo(toLocalInputValue(endOfDay(e)));
      return;
    }
  }
  function clearRange() {
    setRangePreset("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[#6D4AFF]">
            <Icon name="check" size={18} />
          </span>
          <h1 className="text-xl font-semibold text-black">Webhook Logs</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-700">Log notifikasi dan cek status dari provider.</p>
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
        <div className="flex items-center gap-3">
          <SearchInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari invoice atau type"
            className="w-96"
          />
          <Select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-48"
          >
            <option value="">Semua Provider</option>
            {(providers || []).map((p) => (
              <option key={p.code || p} value={p.code || p}>
                {p.name || p.code || p}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" className="gap-2" onClick={() => setFiltersOpen((v) => !v)}>
          <span className="text-[#6D4AFF]">
            <Icon name="filter" size={16} />
          </span>
          {filtersOpen ? "Sembunyikan Filter" : "Tampilkan Filter"}
        </Button>
      </div>

      {filtersOpen && (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div>
            <label className="text-xs font-medium text-zinc-700">Provider</label>
            <Select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
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
            <label className="text-xs font-medium text-zinc-700">Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1"
            >
              <option value="">Semua</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELED">CANCELED</option>
            </Select>
          </div>
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
              value={from}
              onChange={(e) => setFrom(e.target.value || "")}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Sampai tanggal</label>
            <Input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value || "")}
              className="mt-1"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={clearRange} type="button">
              Hapus
            </Button>
          </div>
        </div>
        </div>
      )}

      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Jenis</th>
                <th className="px-3 py-2 text-left">Provider</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Invoice</th>
                <th className="px-3 py-2 text-left">Waktu</th>
                <th className="px-3 py-2 text-left">Detail</th>
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
              ) : (logs || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">Tidak ada data</td>
                </tr>
              ) : (
                (displayLogs || []).map((log, idx) => (
                  <Fragment key={log?.id ?? `${log?.type ?? "type"}-${log?.invoice_number ?? "inv"}-${idx}`}>
                    <tr className="border-t border-black/5">
                      <td className="px-3 py-2">{log.type}</td>
                      <td className="px-3 py-2">{log.provider}</td>
                      <td className="px-3 py-2">
                        {log.status ? (
                          <Badge variant={statusBadgeVariant(log.status)}>
                            <span className="mr-1 text-[#6D4AFF]">
                              <Icon name={statusIcon(log.status)} size={12} />
                            </span>
                            {log.status}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2">{log.invoice_number}</td>
                      <td className="px-3 py-2">{log.at ? new Date(log.at).toLocaleString() : "-"}</td>
                      <td className="px-3 py-2">
                        <IconButton
                          name="eye"
                          title="Lihat Detail"
                          variant="outline"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailOpen(true);
                          }}
                        />
                      </td>
                    </tr>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detail Webhook"
      >
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-sm text-zinc-700">
            Jenis: <span className="font-medium text-black">{selectedLog?.type || "-"}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Provider: <span className="font-medium text-black">{selectedLog?.provider || "-"}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Status:{" "}
            {selectedLog?.status ? (
              <Badge className="align-middle" variant={statusBadgeVariant(selectedLog.status)}>
                {selectedLog.status}
              </Badge>
            ) : (
              <span className="font-medium text-black">-</span>
            )}
          </div>
          <div className="text-sm text-zinc-700">
            Invoice: <span className="font-medium text-black">{selectedLog?.invoice_number || "-"}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Waktu:{" "}
            <span className="font-medium text-black">
              {selectedLog?.at ? new Date(selectedLog.at).toLocaleString() : "-"}
            </span>
          </div>
        </div>
        <div className="mb-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              try {
                const txt = JSON.stringify(selectedLog ?? {}, null, 2);
                navigator.clipboard.writeText(txt);
              } catch {}
            }}
          >
            Salin JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              try {
                const txt = JSON.stringify(selectedLog ?? {}, null, 2);
                const blob = new Blob([txt], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `webhook-${selectedLog?.invoice_number || selectedLog?.id || "log"}.json`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 0);
              } catch {}
            }}
          >
            Unduh JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const inv = selectedLog?.invoice_number || "";
              router.push(`/payments/actions?q=${encodeURIComponent(inv)}`);
            }}
          >
            Cari Order
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="px-3 py-2">Kunci</th>
                <th className="px-3 py-2">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {(selectedLog ? flattenEntries(selectedLog) : []).map(([k, v]) => (
                <tr key={k} className="border-t border-black/5">
                  <td className="px-3 py-2">{k}</td>
                  <td className="px-3 py-2">
                    {isURLLike(v) ? (
                      <a href={v} target="_blank" rel="noreferrer" className="text-[#6D4AFF] hover:underline">
                        Buka
                      </a>
                    ) : isDateLike(v) ? (
                      formatDate(v)
                    ) : (
                      String(v)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
