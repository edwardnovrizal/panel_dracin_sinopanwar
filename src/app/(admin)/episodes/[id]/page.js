"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  fetchEpisode,
  updateEpisode,
  deleteEpisode,
} from "@/lib/api";

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [episode, setEpisode] = useState(null);

  const [seriesId, setSeriesId] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [filename, setFilename] = useState("");
  const [subtitle, setSubtitle] = useState(false);
  const [subtitlePath, setSubtitlePath] = useState("");
  const [size, setSize] = useState("");
  const [lastModified, setLastModified] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const json = await fetchEpisode(id);
        const e = json?.data;
        setEpisode(e);
        setSeriesId(e?.series_id || "");
        setEpisodeNumber(e?.episode_number ?? "");
        setFilename(e?.filename || "");
        setSubtitle(!!e?.subtitle);
        setSubtitlePath(e?.subtitle_path || "");
        setSize(e?.size ?? "");
        setLastModified(e?.last_modified ?? "");
        setUrl(e?.url || "");
      } catch (err) {
        setError(err?.message || "Gagal memuat episode");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const payload = useMemo(() => {
    const data = {};
    if (seriesId !== (episode?.series_id || "")) data.seriesId = seriesId;
    if (episodeNumber !== (episode?.episode_number ?? "")) data.episodeNumber = Number(episodeNumber);
    if (filename !== (episode?.filename || "")) data.filename = filename;
    if (subtitle !== !!episode?.subtitle) data.isSubtitle = subtitle;
    if (subtitlePath !== (episode?.subtitle_path || "")) data.subtitlePath = subtitlePath === "" ? "" : subtitlePath;
    if (size !== (episode?.size ?? "")) data.size = size === "" ? null : Number(size);
    if (lastModified !== (episode?.last_modified ?? "")) data.lastModified = lastModified || null;
    if (url !== (episode?.url || "")) data.url = url === "" ? "" : url;
    return data;
  }, [seriesId, episodeNumber, filename, subtitle, subtitlePath, size, lastModified, url, episode]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const body = { ...payload };
      if (body.subtitlePath === "") {
        if (episode?.subtitle_path && subtitlePath === "") {
          body.subtitlePath = null;
        } else {
          delete body.subtitlePath;
        }
      }
      if (body.url === "") {
        if (episode?.url && url === "") {
          body.url = null;
        } else {
          delete body.url;
        }
      }
      const res = await updateEpisode(id, body);
      const updated = res?.data;
      setEpisode(updated);
      setSeriesId(updated?.series_id || "");
      setEpisodeNumber(updated?.episode_number ?? "");
      setFilename(updated?.filename || "");
      setSubtitle(!!updated?.subtitle);
      setSubtitlePath(updated?.subtitle_path || "");
      setSize(updated?.size ?? "");
      setLastModified(updated?.last_modified ?? "");
      setUrl(updated?.url || "");
      setMessage("Perubahan berhasil disimpan");
    } catch (err) {
      setMessage(err?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Hapus episode ini?")) return;
    try {
      await deleteEpisode(id);
      router.replace("/episodes");
    } catch (err) {
      setMessage(err?.message || "Gagal menghapus episode");
    }
  };

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

  if (!episode) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Detail Episode</h1>
          <p className="text-sm text-zinc-600">{episode.filename}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={onDelete}>
            Hapus
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Kembali
          </Button>
        </div>
      </div>

      <form onSubmit={onSave} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-700">Series ID</label>
            <Input value={seriesId} onChange={(e) => setSeriesId(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Episode Number</label>
            <Input type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Filename</label>
            <Input value={filename} onChange={(e) => setFilename(e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="subtitle"
              type="checkbox"
              checked={subtitle}
              onChange={(e) => setSubtitle(e.target.checked)}
              className="h-4 w-4 rounded border border-black/15"
            />
            <label htmlFor="subtitle" className="text-xs font-medium text-zinc-700">
              Subtitle tersedia
            </label>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Subtitle Path</label>
            <Input value={subtitlePath} onChange={(e) => setSubtitlePath(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-zinc-500">Kosongkan untuk tetap; kirim null untuk menghapus.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Size</label>
            <Input type="number" value={size} onChange={(e) => setSize(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Last Modified</label>
            <Input
              type="datetime-local"
              value={lastModified ? toLocalInputValue(lastModified) : ""}
              onChange={(e) => setLastModified(e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-zinc-500">Kosongkan untuk tetap; kirim null untuk menghapus.</p>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-md px-3 py-2 text-sm ${
              message.includes("Gagal")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Kembali
          </Button>
        </div>
      </form>
    </div>
  );
}

function toLocalInputValue(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  } catch {
    return "";
  }
}
