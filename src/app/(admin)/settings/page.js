"use client";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import Toast from "@/components/ui/Toast";
import Tooltip from "@/components/ui/Tooltip";
import { fetchAdminSettings, updateAdminSettings } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

export default function SettingsPage() {
  const FIELDS = useMemo(
    () => [
      { key: "WHATBOX_FTP_HOST", label: "WHATBOX FTP Host", type: "string", desc: "Host FTP Whatbox", sample: "mywhatbox.example.com" },
      { key: "WHATBOX_FTP_PORT", label: "WHATBOX FTP Port", type: "number", desc: "Port FTP", sample: "21" },
      { key: "WHATBOX_FTP_USER", label: "WHATBOX FTP User", type: "string", desc: "Username FTP", sample: "user" },
      { key: "WHATBOX_FTP_PASS", label: "WHATBOX FTP Pass", type: "string", desc: "Password FTP", sample: "pass" },
      { key: "WHATBOX_FTP_SECURE", label: "WHATBOX FTP Secure", type: "boolean", desc: "Aktifkan FTPS/TLS", sample: "true" },
      { key: "WHATBOX_FTP_REMOTE_PATH", label: "WHATBOX FTP Remote Path", type: "string", desc: "Direktori remote utama", sample: "/files" },
      { key: "FTP_KEEPALIVE_MS", label: "FTP Keepalive (ms)", type: "number", desc: "Interval keepalive FTP (ms)", sample: "30000" },
      { key: "EMAIL_FROM", label: "Email From", type: "string", desc: "Alamat pengirim email", sample: "Dracin App <noreply@yourdomain.com>" },
      { key: "BREVO_API_KEY", label: "Brevo API Key", type: "string", desc: "Kunci API Brevo untuk email", sample: "brevo_xxx" },
      { key: "GOOGLE_CLIENT_ID", label: "Google Client ID", type: "string", desc: "Client ID Google OAuth (mendukung multi-nilai; pisahkan dengan koma atau spasi)", sample: "idA.apps.googleusercontent.com, idB.apps.googleusercontent.com" },
      { key: "JWT_SECRET", label: "JWT Secret", type: "string", desc: "Secret untuk signing token JWT (client)", sample: "your-jwt-client-secret" },
      { key: "JWT_REFRESH_SECRET", label: "JWT Refresh Secret", type: "string", desc: "Secret untuk signing refresh token JWT (client)", sample: "your-jwt-refresh-secret" },
      { key: "FREE_EPISODES_LIMIT", label: "Free Episodes Limit", type: "number", desc: "Batas episode gratis default", sample: "5" },
      { key: "BASE_URL_WHATBOX", label: "Base URL Whatbox", type: "string", desc: "Base URL server Whatbox", sample: "https://mywhatbox.example.com" },
      { key: "WHATBOX_HTTP_SCHEME", label: "Whatbox HTTP Scheme", type: "string", desc: "Skema HTTP (http/https)", sample: "https" },
      { key: "DOKU_CLIENT_ID", label: "DOKU Client ID", type: "string", desc: "Client ID DOKU", sample: "doku_client_xxx" },
      { key: "DOKU_SECRET_KEY", label: "DOKU Secret Key", type: "string", desc: "Secret key DOKU", sample: "doku_secret_xxx" },
      { key: "DOKU_BASE_API", label: "DOKU Base API", type: "string", desc: "Base API DOKU", sample: "https://api-sandbox.doku.com" },
      { key: "TRIPAY_API_KEY", label: "Tripay API Key", type: "string", desc: "API key Tripay", sample: "tripay_api_xxx" },
      { key: "TRIPAY_PRIVATE_KEY", label: "Tripay Private Key", type: "string", desc: "Private key Tripay", sample: "tripay_private_xxx" },
      { key: "TRIPAY_MERCHANT_CODE", label: "Tripay Merchant Code", type: "string", desc: "Kode merchant Tripay", sample: "TRIPAY123" },
      { key: "TRIPAY_BASE_API", label: "Tripay Base API", type: "string", desc: "Base API Tripay", sample: "https://tripay.co.id/api" },
      { key: "PAYMENT_DUE_MINUTES", label: "Payment Due (minutes)", type: "number", desc: "Batas waktu pembayaran (menit)", sample: "60" },
      { key: "PREMIUM_DEFAULT_DAYS", label: "Premium Default (days)", type: "number", desc: "Durasi default premium (hari)", sample: "7" },
      { key: "PAYMENT_CALLBACK_BASE_URL", label: "Payment Callback Base URL", type: "string", desc: "Base URL callback pembayaran", sample: "https://api.example.com/payments/callback" },
      { key: "PAYMENT_REDIRECT_SUCCESS_URL", label: "Payment Redirect Success URL", type: "string", desc: "URL deep-link sukses", sample: "myapp://payments?invoice={invoice}&status={status}" },
      { key: "PAYMENT_REDIRECT_CANCEL_URL", label: "Payment Redirect Cancel URL", type: "string", desc: "URL deep-link batal", sample: "myapp://payments?invoice={invoice}&status={status}" },
      { key: "PAYMENT_REDIRECT_FALLBACK_URL", label: "Payment Redirect Fallback URL", type: "string", desc: "URL fallback web", sample: "https://yourapp.example.com/profile" },
      { key: "FIREBASE_PROJECT_ID", label: "Firebase Project ID", type: "string", desc: "Project ID Firebase", sample: "your-firebase-project" },
      { key: "FIREBASE_CLIENT_EMAIL", label: "Firebase Client Email", type: "string", desc: "Email client Firebase admin", sample: "firebase-admin@your-firebase-project.iam.gserviceaccount.com" },
      { key: "FIREBASE_PRIVATE_KEY", label: "Firebase Private Key", type: "multiline", desc: "Private key Firebase admin", sample: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n" },
    ],
    []
  );
  const [form, setForm] = useState(() => {
    const init = {};
    FIELDS.forEach((f) => {
      if (f.type === "boolean") init[f.key] = false;
      else init[f.key] = "";
    });
    return init;
  });
  const [toasts, setToasts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalForm, setOriginalForm] = useState(null);
  const [gciInput, setGciInput] = useState("");
  const [secretVisible, setSecretVisible] = useState({});

  const KEY_META = useMemo(() => {
    const m = {};
    FIELDS.forEach((f) => {
      m[f.key] = f;
    });
    return m;
  }, [FIELDS]);
  const REQUIRED_KEYS = useMemo(
    () => [
      "WHATBOX_FTP_HOST",
      "WHATBOX_FTP_USER",
      "WHATBOX_FTP_PASS",
      "WHATBOX_FTP_REMOTE_PATH",
      "BREVO_API_KEY",
      "EMAIL_FROM",
      "FREE_EPISODES_LIMIT",
      "PREMIUM_DEFAULT_DAYS",
    ],
    []
  );
  const GROUPS = useMemo(
    () => [
      {
        title: "Whatbox & FTP",
        keys: [
          "WHATBOX_FTP_HOST",
          "WHATBOX_FTP_PORT",
          "WHATBOX_FTP_USER",
          "WHATBOX_FTP_PASS",
          "WHATBOX_FTP_SECURE",
          "WHATBOX_FTP_REMOTE_PATH",
          "FTP_KEEPALIVE_MS",
          "BASE_URL_WHATBOX",
          "WHATBOX_HTTP_SCHEME",
        ],
      },
      {
        title: "Email & Brevo",
        keys: ["BREVO_API_KEY", "EMAIL_FROM"],
      },
      {
        title: "Aplikasi (Umum)",
        keys: ["FREE_EPISODES_LIMIT", "PREMIUM_DEFAULT_DAYS"],
      },
      {
        title: "Google OAuth",
        keys: ["GOOGLE_CLIENT_ID"],
      },
      {
        title: "Auth & JWT",
        keys: ["JWT_SECRET", "JWT_REFRESH_SECRET"],
      },
      {
        title: "Pembayaran (Callback)",
        keys: ["PAYMENT_CALLBACK_BASE_URL"],
      },
      {
        title: "Pembayaran (URL Redirect)",
        keys: [
          "PAYMENT_REDIRECT_SUCCESS_URL",
          "PAYMENT_REDIRECT_CANCEL_URL",
          "PAYMENT_REDIRECT_FALLBACK_URL",
        ],
      },
      {
        title: "Pembayaran (Umum)",
        keys: ["PAYMENT_DUE_MINUTES"],
      },
      {
        title: "DOKU",
        keys: ["DOKU_CLIENT_ID", "DOKU_SECRET_KEY", "DOKU_BASE_API"],
      },
      {
        title: "Tripay",
        keys: ["TRIPAY_API_KEY", "TRIPAY_PRIVATE_KEY", "TRIPAY_MERCHANT_CODE", "TRIPAY_BASE_API"],
      },
      {
        title: "Firebase Admin",
        keys: ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"],
      },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchAdminSettings();
        const data = res?.data || {};
        const next = {};
        FIELDS.forEach((f) => {
          const v = data[f.key];
          if (f.type === "boolean") next[f.key] = !!v;
          else if (f.type === "number") next[f.key] = v != null ? String(v) : "";
          else if (f.type === "array") next[f.key] = Array.isArray(v) ? (v || []).join("\n") : "";
          else next[f.key] = v != null ? String(v) : "";
        });
        setForm(next);
        setOriginalForm(next);
      } catch (err) {
        addToast(err?.message || "Gagal memuat settings", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [FIELDS]);

  function addToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }
  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function typedValue(key) {
    const meta = FIELDS.find((f) => f.key === key);
    if (!meta) return undefined;
    const raw = form[key];
    if (meta.type === "boolean") return !!raw;
    if (meta.type === "number") {
      if (raw === "" || raw == null) return undefined;
      const n = Number(raw);
      if (Number.isNaN(n)) return undefined;
      return n;
    }
    if (meta.type === "array") {
      const lines = String(raw || "")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return lines;
    }
    return raw == null ? "" : String(raw);
  }

  function normalizeGoogleClientIds(input) {
    const items = String(input || "")
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const uniq = Array.from(new Set(items));
    return uniq.join(", ");
  }
  function parseGoogleClientIds(input) {
    const items = String(input || "")
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return Array.from(new Set(items));
  }
  function addGoogleClientId(id) {
    const val = String(id || "").trim();
    if (!val) return;
    const current = parseGoogleClientIds(form["GOOGLE_CLIENT_ID"]);
    const next = Array.from(new Set([...current, val]));
    setForm((x) => ({ ...x, GOOGLE_CLIENT_ID: next.join(", ") }));
    setGciInput("");
  }
  function removeGoogleClientId(id) {
    const current = parseGoogleClientIds(form["GOOGLE_CLIENT_ID"]);
    const next = current.filter((it) => it !== id);
    setForm((x) => ({ ...x, GOOGLE_CLIENT_ID: next.join(", ") }));
  }

  const requiredMissing = useMemo(() => {
    return REQUIRED_KEYS.filter((key) => {
      const meta = KEY_META[key];
      const raw = form[key];
      if (meta?.type === "number") {
        if (raw === "" || raw == null) return true;
        const n = Number(raw);
        return Number.isNaN(n);
      }
      if (meta?.type === "string") {
        return raw == null || String(raw).trim() === "";
      }
      return false;
    });
  }, [REQUIRED_KEYS, KEY_META, form]);

  async function onSaveAll() {
    setSaving(true);
    try {
      const payload = {};
      FIELDS.forEach((f) => {
        if (f.key === "GOOGLE_CLIENT_ID") {
          const normalized = normalizeGoogleClientIds(form[f.key]);
          if (normalized !== "") payload[f.key] = normalized;
          return;
        }
        const val = typedValue(f.key);
        if (f.type === "boolean") payload[f.key] = !!val;
        else if (f.type === "array") payload[f.key] = val;
        else if (val !== undefined && val !== "") payload[f.key] = val;
      });
      await updateAdminSettings(payload);
      addToast("Settings berhasil disimpan", "success");
      setOriginalForm(form);
    } catch (err) {
      addToast(err?.message || "Gagal menyimpan settings", "error");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = useMemo(() => {
    if (!originalForm) return false;
    return FIELDS.some((f) => {
      const a = form[f.key];
      const b = originalForm[f.key];
      return a !== b;
    });
  }, [form, originalForm, FIELDS]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Settings</h1>
          <p className="text-sm text-zinc-700">Kelola {FIELDS.length} field konfigurasi admin.</p>
        </div>
      </div>
      {isDirty && (
        <div
          className="fixed top-0 z-30"
          style={{ left: "16rem", right: 0 }}
        >
          <div className="border-b border-amber-200 bg-amber-50/90 backdrop-blur px-6 py-2 text-center text-xs font-medium text-amber-700">
            Perubahan belum disimpan
          </div>
        </div>
      )}
      {requiredMissing.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <div className="font-medium">Lengkapi key wajib sebelum menyimpan:</div>
          <div className="mt-1">
            {(requiredMissing || [])
              .map((key) => KEY_META[key]?.label || key)
              .join(", ")}
          </div>
        </div>
      )}
      {GROUPS.map((g) => (
        <Card key={g.title} title={g.title}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.keys.map((key) => {
              const f = KEY_META[key];
              return (
                <div key={key} className="space-y-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-black">{f.label}</div>
                    <div className="text-[11px] text-zinc-600">{f.desc}</div>
                  </div>
                  {f.type === "boolean" ? (
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((x) => ({ ...x, [key]: !x[key] }))}
                        aria-pressed={!!form[key]}
                        aria-label={f.label}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition ${form[key] ? "bg-emerald-500" : "bg-zinc-300"} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
                      >
                        <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${form[key] ? "translate-x-5" : ""}`} />
                      </button>
                      <span className="text-[11px] font-medium text-zinc-700">{form[key] ? "Aktif" : "Nonaktif"}</span>
                    </div>
                  ) : f.type === "multiline" || f.type === "array" ? (
                    <>
                      <div className="mt-2">
                        <textarea
                          value={form[key] ?? ""}
                          onChange={(e) => setForm((x) => ({ ...x, [key]: e.target.value }))}
                          rows={f.type === "multiline" ? 4 : 3}
                          className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 outline-none transition focus:border-black/30"
                          placeholder={f.type === "array" ? "Satu nilai per baris" : ""}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">Contoh: {f.sample}</div>
                    </>
                  ) : (
                    <>
                      {key === "GOOGLE_CLIENT_ID" ? (
                        <>
                          <div className="mt-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {parseGoogleClientIds(form[key]).map((cid) => (
                                <span key={cid} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-zinc-50 px-2.5 py-[4px] text-[12px] text-zinc-700">
                                  <Tooltip content={cid} position="bottom">
                                    <span className="truncate max-w-[240px] cursor-help">{cid}</span>
                                  </Tooltip>
                                  <button
                                    type="button"
                                    onClick={() => removeGoogleClientId(cid)}
                                    className="inline-flex items-center rounded-md p-[2px] text-zinc-700 hover:bg-black/[.04]"
                                    aria-label="Hapus Client ID"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-zinc-700">
                                      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                      <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              type="text"
                              value={gciInput}
                              onChange={(e) => setGciInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addGoogleClientId(gciInput);
                                }
                              }}
                              placeholder="Tambah Client ID lalu Enter"
                            />
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => addGoogleClientId(gciInput)}
                              disabled={!String(gciInput || "").trim()}
                            >
                              Tambah
                            </Button>
                          </div>
                          <div className="mt-1 text-[11px] text-zinc-500">
                            Masukkan satu atau lebih Client ID. Duplikasi akan dihapus dan format diseragamkan saat disimpan.
                          </div>
                          <div className="mt-1 text-[11px] text-zinc-500">Contoh: {f.sample}</div>
                        </>
                      ) : (key === "JWT_SECRET" || key === "JWT_REFRESH_SECRET") ? (
                        <>
                          <div className="mt-2 relative">
                            <Input
                              type={secretVisible[key] ? "text" : "password"}
                              value={form[key] ?? ""}
                              onChange={(e) => setForm((x) => ({ ...x, [key]: e.target.value }))}
                              placeholder={String(f.sample || "")}
                              className="pr-9"
                            />
                            <button
                              type="button"
                              onClick={() => setSecretVisible((s) => ({ ...s, [key]: !s[key] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center rounded-md p-[2px] text-zinc-700 hover:bg-black/[.04]"
                              aria-label={secretVisible[key] ? "Sembunyikan" : "Tampilkan"}
                              title={secretVisible[key] ? "Sembunyikan" : "Tampilkan"}
                            >
                              <Icon name={secretVisible[key] ? "eye" : "eye-off"} size={16} />
                            </button>
                          </div>
                          <div className="mt-1 text-[11px] text-zinc-500">Contoh: {f.sample}</div>
                        </>
                      ) : (
                        <>
                          <div className="mt-2">
                            <Input
                              type={f.type === "number" ? "number" : "text"}
                              value={form[key] ?? ""}
                              onChange={(e) => setForm((x) => ({ ...x, [key]: e.target.value }))}
                              placeholder={String(f.sample || "")}
                            />
                          </div>
                          <div className="mt-1 text-[11px] text-zinc-500">Contoh: {f.sample}</div>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      <div className="mt-6">
        <div className="flex items-center justify-center px-6 py-4">
          <Button onClick={onSaveAll} disabled={saving || loading || requiredMissing.length > 0} className="min-w-[300px] px-6 py-3">
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>
      <Toast items={toasts} onClose={removeToast} />
    </div>
  );
}
