"use client";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Toast from "@/components/ui/Toast";
import { API_BASE, fetchScanRealtime, fetchScanReportCurrent, fetchScanReportSummary, getAccessToken, startScan, stopScan } from "@/lib/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function ScanPage() {
  function formatBytes(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num < 0) return "-";
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    if (num === 0) return "0 B";
    const i = Math.min(units.length - 1, Math.floor(Math.log(num) / Math.log(1024)));
    const val = num / Math.pow(1024, i);
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
  }
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [batchSize, setBatchSize] = useState("");
  const [pauseMs, setPauseMs] = useState("");
  const [intervalMs, setIntervalMs] = useState("");
  const [topFoldersText, setTopFoldersText] = useState("");
  const esRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);
  const [realtime, setRealtime] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [summaryReport, setSummaryReport] = useState(null);
 

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scan_last_logs");
      const arr = JSON.parse(raw || "[]");
      const lines = Array.isArray(arr) ? arr : [];
      setLogs(lines.slice(-2));
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rt = await fetchScanRealtime();
        setRealtime(rt?.data || rt);
        const rtd = rt?.data || rt || {};
        const statusLite = {
          is_running: !!rtd.is_running,
          current_folder: rtd?.position?.folder ?? null,
          current_folder_position: rtd?.position?.current ?? null,
          total_folders: rtd?.position?.total ?? null,
          friendly_message: rtd?.message ?? "",
          current_series_detail: rtd?.current_series ?? null,
        };
        setStatus(statusLite);
        if (rtd?.message) appendLog(rtd.message);
        const runningNow = !!statusLite.is_running;
        if (!runningNow) {
          try {
            const sr = await fetchScanReportSummary();
            const raw = sr?.data || sr || {};
            const normalized = raw?.totals
              ? raw
              : {
                  totals: {
                    series_total: raw?.series_total ?? raw?.totals?.series_total ?? 0,
                    episodes_total: raw?.episodes_total ?? raw?.totals?.episodes_total ?? 0,
                    tags_total: raw?.tags_total ?? raw?.totals?.tags_total ?? 0,
                  },
                  by_folder: raw?.by_folder || {},
                };
            setSummaryReport(normalized);
          } catch {}
        } else {
          try {
            const cr = await fetchScanReportCurrent();
            setCurrentReport(cr?.data || cr);
          } catch {}
        }
      } catch (err) {
        addToast(err?.message || "Gagal memuat status scan", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function appendLog(s) {
    const line = `${new Date().toLocaleTimeString()} ${String(s || "")}`;
    setLogs((prev) => [...prev.slice(-299), line]);
  }
  const appendLogItem = useCallback((it) => {
    const ts = it?.ts ? new Date(it.ts).toLocaleTimeString() : new Date().toLocaleTimeString();
    const lvl = it?.level ? String(it.level).toUpperCase() : "INFO";
    const msg = it?.message != null ? String(it.message) : "";
    const line = `[${ts}] [${lvl}] ${msg}`;
    setLogs((prev) => [...prev.slice(-299), line]);
  }, []);
  function clearLogs() {
    setLogs([]);
    try {
      localStorage.removeItem("scan_last_logs");
    } catch {}
  }
  useEffect(() => {
    const el = logRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const running = useMemo(() => !!status?.is_running, [status]);

  useEffect(() => {
    try {
      const lastTwo = logs.slice(-2);
      localStorage.setItem("scan_last_logs", JSON.stringify(lastTwo));
    } catch {}
  }, [logs]);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const rt = await fetchScanRealtime();
      const rtd = rt?.data || rt || {};
      const statusLite = {
        is_running: !!rtd.is_running,
        current_folder: rtd?.position?.folder ?? null,
        current_folder_position: rtd?.position?.current ?? null,
        total_folders: rtd?.position?.total ?? null,
        friendly_message: rtd?.message ?? "",
        current_series_detail: rtd?.current_series ?? null,
      };
      setRealtime(rtd);
      setStatus(statusLite);
      try {
        const cr = await fetchScanReportCurrent();
        setCurrentReport(cr?.data || cr);
      } catch {}
      if (rtd?.message) appendLog(rtd.message);
    } catch (err) {
      addToast(err?.message || "Gagal memuat status scan", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (running) {
      try {
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
        const token = getAccessToken && getAccessToken();
        const url = token ? `${API_BASE}/scan/stream?access_token=${encodeURIComponent(token)}` : `${API_BASE}/scan/stream`;
        const es = new EventSource(url, { withCredentials: true });
        es.addEventListener("log", (e) => {
          try {
            const item = JSON.parse(e.data || "{}");
            appendLogItem(item);
          } catch {}
        });
        es.addEventListener("status", (e) => {
          try {
            const payload = JSON.parse(e.data || "{}");
            const next = payload?.data != null ? payload.data : payload;
            setStatus(next);
            try {
              if (next?.is_running || next?.running) {
                fetchScanReportCurrent().then((cr) => setCurrentReport(cr?.data || cr)).catch(() => {});
              }
            } catch {}
          } catch {}
        });
        es.onerror = () => {
          try {
            es.close();
          } catch {}
          esRef.current = null;
          addToast("Streaming terputus", "error");
        };
        esRef.current = es;
      } catch {
      }
      return () => {
        if (esRef.current) {
          try {
            esRef.current.close();
          } catch {}
          esRef.current = null;
        }
      };
    } else {
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {}
        esRef.current = null;
      }
    }
  }, [running, appendLogItem]);

  function addToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }
  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function toArrayLines(s) {
    return String(s || "")
      .split("\n")
      .map((it) => it.trim())
      .filter((it) => it.length > 0);
  }
  function toNumberOrUndefined(s) {
    if (s == null || String(s).trim() === "") return undefined;
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
  }

  const canStart = useMemo(() => {
    const folders = toArrayLines(topFoldersText);
    const bs = toNumberOrUndefined(batchSize);
    const pm = toNumberOrUndefined(pauseMs);
    const im = toNumberOrUndefined(intervalMs);
    const okFolders = folders.length > 0;
    const okBatch = bs != null && bs > 0;
    const okPause = pm != null && pm >= 0;
    const okInterval = im != null && im > 0;
    return okFolders && okBatch && okPause && okInterval;
  }, [topFoldersText, batchSize, pauseMs, intervalMs]);
 
  async function onStart() {
    setStarting(true);
    try {
      const payload = {
        batch_size: toNumberOrUndefined(batchSize),
        pause_ms: toNumberOrUndefined(pauseMs),
        interval_ms: toNumberOrUndefined(intervalMs),
        top_folders: toArrayLines(topFoldersText),
      };
      if (!payload.top_folders || payload.top_folders.length === 0) throw new Error("Top folders wajib diisi");
      if (payload.batch_size == null || payload.batch_size <= 0) throw new Error("Batch size wajib > 0");
      if (payload.pause_ms == null || payload.pause_ms < 0) throw new Error("Pause (ms) wajib ≥ 0");
      if (payload.interval_ms == null || payload.interval_ms <= 0) throw new Error("Interval (ms) wajib > 0");
      const res = await startScan(payload);
      addToast(res?.message || "Scan dimulai", "success");
      appendLog("Scan dimulai");
      await onRefresh();
    } catch (err) {
      addToast(err?.message || "Gagal memulai scan", "error");
      appendLog(`Gagal memulai scan: ${err?.message || "-"}`);
    } finally {
      setStarting(false);
    }
  }

  async function onStop() {
    setStopping(true);
    try {
      const res = await stopScan();
      addToast(res?.message || "Scan dihentikan", "success");
      appendLog("Scan dihentikan");
      await onRefresh();
    } catch (err) {
      addToast(err?.message || "Gagal menghentikan scan", "error");
      appendLog(`Gagal menghentikan scan: ${err?.message || "-"}`);
    } finally {
      setStopping(false);
    }
  }

  // pisahkan refresh: current & summary
  const refreshCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const cr = await fetchScanReportCurrent();
      setCurrentReport(cr?.data || cr);
    } catch (err) {
      addToast(err?.message || "Gagal memuat laporan berjalan", "error");
    } finally {
      setLoading(false);
    }
  }, []);
  const refreshSummary = useCallback(async () => {
    setLoading(true);
    try {
      const sr = await fetchScanReportSummary();
      const raw = sr?.data || sr || {};
      const normalized = raw?.totals
        ? raw
        : {
            totals: {
              series_total: raw?.series_total ?? raw?.totals?.series_total ?? 0,
              episodes_total: raw?.episodes_total ?? raw?.totals?.episodes_total ?? 0,
              tags_total: raw?.tags_total ?? raw?.totals?.tags_total ?? 0,
            },
            by_folder: raw?.by_folder || {},
          };
      normalized.storage_total_size = raw?.storage_total_size ?? normalized?.storage_total_size ?? undefined;
      setSummaryReport(normalized);
    } catch (err) {
      addToast(err?.message || "Gagal memuat ringkasan", "error");
    } finally {
      setLoading(false);
    }
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Scan Konten Whatbox</h1>
        <p className="text-sm text-zinc-700">Kontrol start/stop dan pantau status scan.</p>
      </div>

      <Card title="Kontrol">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-black">Top Folders</div>
            <textarea
              value={topFoldersText}
              onChange={(e) => setTopFoldersText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 outline-none transition focus:border-black/30"
              placeholder="Satu folder per baris"
            />
            <div className="text-[11px] text-zinc-500">Daftar folder level atas yang dipindai. Minimal 1 item; string di-trim dan kosong dibuang.</div>
            <div className="text-[11px] text-zinc-500">Harus sesuai dengan remote root WHATBOX_FTP_REMOTE_PATH. Contoh: ANIME_A, ANIME_B</div>
          </div>
          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-black">Batch Size</div>
            <Input type="number" value={batchSize} onChange={(e) => setBatchSize(e.target.value)} placeholder="10" />
            <div className="text-[11px] text-zinc-500">Maksimum series per folder yang diproses per round; mempengaruhi lamanya round.</div>
            <div className="text-[11px] text-zinc-500">Direkomendasikan: 5–50 sesuai kapasitas FTP/DB.</div>
          </div>
          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-black">Pause (ms)</div>
            <Input type="number" value={pauseMs} onChange={(e) => setPauseMs(e.target.value)} placeholder="30000" />
            <div className="text-[11px] text-zinc-500">Jeda antar pemrosesan folder di dalam satu round; menurunkan beban puncak ke FTP/DB.</div>
            <div className="text-[11px] text-zinc-500">Direkomendasikan: 5.000–60.000 (5–60 detik).</div>
          </div>
          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-black">Interval (ms)</div>
            <Input type="number" value={intervalMs} onChange={(e) => setIntervalMs(e.target.value)} placeholder="600000" />
            <div className="text-[11px] text-zinc-500">Jeda setelah semua folder selesai diproses sebelum round berikutnya dimulai.</div>
            <div className="text-[11px] text-zinc-500">Direkomendasikan: hitungan menit (mis. 600.000 = 10 menit).</div>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-zinc-500">
          Catatan: Offset per folder disimpan untuk melanjutkan progres; jika suatu round tidak memproses apa pun, offset di-reset. Kombinasi umum: batch_size moderat, pause_ms beberapa detik, interval_ms beberapa menit.
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={onStart} disabled={starting || loading || running || !canStart} className="px-6 py-3">
            {starting ? "Memulai..." : "Mulai Scan"}
          </Button>
          <Button variant="outline" onClick={onStop} disabled={stopping || loading || !running} className="px-6 py-3">
            {stopping ? "Menghentikan..." : "Hentikan Scan"}
          </Button>
        </div>
      </Card>

      <Card title="Progres Real-time">
        <div className="mb-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={clearLogs} disabled={loading} className="px-3 py-2">
            Bersihkan
          </Button>
        </div>
        <div ref={logRef} className="max-h-[40vh] overflow-auto rounded-md border border-black/10 bg-zinc-900 p-3 text-xs font-mono text-zinc-100">
          {logs.length === 0 ? "—" : logs.map((line, idx) => (
            <div key={idx} className="whitespace-pre leading-tight">{line}</div>
          ))}
        </div>
      </Card>

      <Card title="Laporan Berjalan (Current)" subtitle={running ? <Badge variant="success">Running</Badge> : undefined}>
        <div className="mb-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={refreshCurrent} disabled={loading} className="px-3 py-2">
            {loading ? "Memuat..." : "Segarkan Current"}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-[13px] font-semibold text-black">Total Series</div>
            <div className="text-sm text-zinc-700">{currentReport?.totals?.series_total != null ? String(currentReport.totals.series_total) : "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[13px] font-semibold text-black">Total Episodes</div>
            <div className="text-sm text-zinc-700">{currentReport?.totals?.episodes_total != null ? String(currentReport.totals.episodes_total) : "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[13px] font-semibold text-black">Total Tags</div>
            <div className="text-sm text-zinc-700">{currentReport?.totals?.tags_total != null ? String(currentReport.totals.tags_total) : "-"}</div>
          </div>
        </div>
        <div className="mt-3 text-[12px] font-medium text-zinc-700">Progres per folder</div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border border-black/10 text-sm">
            <thead>
              <tr className="bg-[#F0EFFF] text-[#1F2937]">
                <th className="border-b border-black/10 px-3 py-2 text-left">Folder</th>
                <th className="border-b border-black/10 px-3 py-2 text-left">Series</th>
                <th className="border-b border-black/10 px-3 py-2 text-left">Episodes</th>
                <th className="border-b border-black/10 px-3 py-2 text-left">Tags</th>
                <th className="border-b border-black/10 px-3 py-2 text-left">Errors</th>
                <th className="border-b border-black/10 px-3 py-2 text-left">Next Index</th>
              </tr>
            </thead>
            <tbody>
              {!currentReport?.by_folder || Object.keys(currentReport.by_folder).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-zinc-700">-</td>
                </tr>
              ) : (
                Object.keys(currentReport.by_folder).map((dir) => {
                  const row = currentReport.by_folder[dir] || {};
                  return (
                    <tr key={dir} className="bg-white">
                      <td className="border-t border-black/10 px-3 py-2">{dir}</td>
                      <td className="border-t border-black/10 px-3 py-2">{row.series_total != null ? String(row.series_total) : "-"}</td>
                      <td className="border-t border-black/10 px-3 py-2">{row.episodes_total != null ? String(row.episodes_total) : "-"}</td>
                      <td className="border-t border-black/10 px-3 py-2">{row.tags_total != null ? String(row.tags_total) : "-"}</td>
                      <td className="border-t border-black/10 px-3 py-2">{row.errors_total != null ? String(row.errors_total) : "-"}</td>
                      <td className="border-t border-black/10 px-3 py-2">{row.next_start_index != null ? String(row.next_start_index) : "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Ringkasan Database (Summary)">
        <div className="mb-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={refreshSummary} disabled={loading} className="px-3 py-2">
            {loading ? "Memuat..." : "Segarkan Summary"}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <div className="text-[13px] font-semibold text-black">Total Series</div>
            <div className="text-sm text-zinc-700">{summaryReport?.totals?.series_total != null ? String(summaryReport.totals.series_total) : "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[13px] font-semibold text-black">Total Episodes</div>
            <div className="text-sm text-zinc-700">{summaryReport?.totals?.episodes_total != null ? String(summaryReport.totals.episodes_total) : "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[13px] font-semibold text-black">Total Tags</div>
            <div className="text-sm text-zinc-700">{summaryReport?.totals?.tags_total != null ? String(summaryReport.totals.tags_total) : "-"}</div>
          </div>
          {summaryReport?.storage_total_size != null && (
            <div className="space-y-1">
              <div className="text-[13px] font-semibold text-black">Total Storage Size</div>
              <div className="text-sm text-zinc-700">{formatBytes(summaryReport.storage_total_size)}</div>
            </div>
          )}
        </div>
      </Card>

      

      <Toast items={toasts} onClose={removeToast} />
    </div>
  );
}
