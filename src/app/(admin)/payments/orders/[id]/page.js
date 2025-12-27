"use client";

import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
    fetchPaymentOrder,
} from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function statusBadgeVariant(s) {
  if (s === "PAID") return "success";
  if (s === "FAILED" || s === "EXPIRED" || s === "CANCELED") return "danger";
  return "default";
}

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
function formatAmount(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
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

export default function PaymentOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const json = await fetchPaymentOrder(id);
        const o = json?.data;
        setOrder(o);
      } catch (err) {
        setError(err?.message || "Gagal memuat order");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="animate-pulse text-sm text-zinc-600">Memuat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Detail Payment Order</h1>
          <p className="text-sm text-zinc-600">{order.invoice_number}</p>
        </div>
      </div>

      <Card title="Ringkasan">
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-sm text-zinc-700">
            User: <span className="font-medium text-black">{order.user?.email}</span>{" "}
            <span className="text-zinc-500">({order.user?.display_name || "-"})</span>
          </div>
          <div className="text-sm text-zinc-700">
            Amount: <span className="font-medium text-black">{formatAmount(order.amount)}</span>{" "}
            <span className="text-zinc-700">{order.currency}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Status: <Badge variant={statusBadgeVariant(order.status)}>{order.status}</Badge>
          </div>
          <div className="text-sm text-zinc-700">
            Provider: <span className="font-medium text-black">{order.provider}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Dibuat:{" "}
            <span className="font-medium text-black">
              {order.created_at ? new Date(order.created_at).toLocaleString() : "-"}
            </span>
          </div>
          <div className="text-sm text-zinc-700">
            Diperbarui:{" "}
            <span className="font-medium text-black">
              {order.updated_at ? new Date(order.updated_at).toLocaleString() : "-"}
            </span>
          </div>
        </div>
      </Card>

      <Card title="Pembayaran">
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-sm text-zinc-700">
            Invoice: <span className="font-medium text-black">{order.invoice_number || "-"}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Metode: <span className="font-medium text-black">{order.method || "-"}</span>
          </div>
          <div className="text-sm text-zinc-700">
            URL Pembayaran:{" "}
            {isURLLike(order.payment_url) ? (
              <a href={order.payment_url} target="_blank" rel="noreferrer" className="font-medium text-[#6D4AFF] hover:underline">
                Buka
              </a>
            ) : (
              <span className="font-medium text-black">-</span>
            )}
          </div>
          <div className="text-sm text-zinc-700">
            Kadaluarsa: <span className="font-medium text-black">{formatDate(order.expires_at)}</span>
          </div>
        </div>
      </Card>

      <Card title="Provider">
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-sm text-zinc-700">
            Provider: <span className="font-medium text-black">{order.provider || "-"}</span>
          </div>
        </div>
      </Card>

      {order?.provider_payload && (
        <Card title="Provider Payload">
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-600">
                  <th className="px-3 py-2">Kunci</th>
                  <th className="px-3 py-2">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {flattenEntries(order.provider_payload).map(([k, v]) => (
                  <tr key={k} className="border-t border-black/5">
                    <td className="px-3 py-2">{k}</td>
                    <td className="px-3 py-2">{String(v ?? "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="User">
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-sm text-zinc-700">
            Email: <span className="font-medium text-black">{order.user?.email || "-"}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Nama: <span className="font-medium text-black">{order.user?.display_name || "-"}</span>
          </div>
          <div className="text-sm text-zinc-700">
            User ID: <span className="font-medium text-black">{order.user?.id ?? "-"}</span>
          </div>
        </div>
      </Card>

      <Card title="Waktu">
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-sm text-zinc-700">
            Dibuat: <span className="font-medium text-black">{formatDate(order.created_at)}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Diperbarui: <span className="font-medium text-black">{formatDate(order.updated_at)}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Dibayar: <span className="font-medium text-black">{formatDate(order.paid_at)}</span>
          </div>
          <div className="text-sm text-zinc-700">
            Premium sampai: <span className="font-medium text-black">{formatDate(order.premium_until)}</span>
          </div>
        </div>
      </Card>

      <Card title="Metadata">
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="px-3 py-2">Kunci</th>
                <th className="px-3 py-2">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {flattenEntries(order || {})
                .filter(([k]) => {
                  const prefixes = ["user", "provider_payload"];
                  const known = [
                    "id",
                    "invoice_number",
                    "amount",
                    "currency",
                    "status",
                    "provider",
                    "created_at",
                    "updated_at",
                    "payment_url",
                    "method",
                    "expires_at",
                    "paid_at",
                    "premium_until",
                  ];
                  if (known.includes(k)) return false;
                  if (prefixes.some((p) => k === p || k.startsWith(p + "."))) return false;
                  return true;
                })
                .map(([k, v]) => (
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
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    </div>
  );
}
