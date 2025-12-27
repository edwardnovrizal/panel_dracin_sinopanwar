"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  fetchSeriesDetail,
  updateSeries,
  deleteSeries,
} from "@/lib/api";

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [series, setSeries] = useState(null);

  const [name, setName] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverPath, setCoverPath] = useState("");
  const [storageRootPath, setStorageRootPath] = useState("");
  const [key, setKey] = useState("");
  const [source, setSource] = useState("whatbox");
  const [uploadedAt, setUploadedAt] = useState("");
  const [episodeCount, setEpisodeCount] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const json = await fetchSeriesDetail(id);
        const s = json?.data;
        setSeries(s);
        setName(s?.name || "");
        setSynopsis(s?.synopsis || "");
        setCoverPath(s?.cover_path || "");
        setStorageRootPath(s?.storage_root_path || "");
        setKey(s?.key || "");
        setSource(s?.source || "whatbox");
        setUploadedAt(s?.uploaded_at ?? "");
        setEpisodeCount(s?.episode_count ?? "");
        setTags((s?.tags || []).map((t) => t.id).join(","));
      } catch (err) {
        setError(err?.message || "Gagal memuat series");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const payload = useMemo(() => {
    const data = {};
    if (name !== (series?.name || "")) data.name = name;
    if (synopsis !== (series?.synopsis || "")) data.synopsis = synopsis === "" ? "" : synopsis;
    if (coverPath !== (series?.cover_path || "")) data.coverPath = coverPath === "" ? "" : coverPath;
    if (storageRootPath !== (series?.storage_root_path || "")) data.storageRootPath = storageRootPath === "" ? "" : storageRootPath;
    if (key !== (series?.key || "")) data.key = key;
    if (source !== (series?.source || "whatbox")) data.source = source;
    if (uploadedAt !== (series?.uploaded_at ?? "")) data.uploadedAt = uploadedAt || null;
    if (episodeCount !== (series?.episode_count ?? "")) data.episodeCount = episodeCount === "" ? null : Number(episodeCount);
    const currentTagIds = (series?.tags || []).map((t) => t.id).join(",");
    if (tags !== currentTagIds) {
      const arr = tags
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x !== "");
      data.tags = arr;
    }
    return data;
  }, [name, synopsis, coverPath, storageRootPath, key, source, uploadedAt, episodeCount, tags, series]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const body = { ...payload };
      if (body.synopsis === "") delete body.synopsis;
      if (body.coverPath === "") {
        if (series?.cover_path && coverPath === "") {
          body.coverPath = null;
        } else {
          delete body.coverPath;
        }
      }
      if (body.storageRootPath === "") {
        if (series?.storage_root_path && storageRootPath === "") {
          body.storageRootPath = null;
        } else {
          delete body.storageRootPath;
        }
      }
      const res = await updateSeries(id, body);
      const updated = res?.data;
      setSeries(updated);
      setName(updated?.name || "");
      setSynopsis(updated?.synopsis || "");
      setCoverPath(updated?.cover_path || "");
      setStorageRootPath(updated?.storage_root_path || "");
      setKey(updated?.key || "");
      setSource(updated?.source || "whatbox");
      setUploadedAt(updated?.uploaded_at ?? "");
      setEpisodeCount(updated?.episode_count ?? "");
      setTags((updated?.tags || []).map((t) => t.id).join(","));
      setMessage("Perubahan berhasil disimpan");
    } catch (err) {
      setMessage(err?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Hapus series ini?")) return;
    try {
      await deleteSeries(id);
      router.replace("/series");
    } catch (err) {
      setMessage(err?.message || "Gagal menghapus series");
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

  if (!series) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Detail Series</h1>
          <p className="text-sm text-zinc-600">{series.key}</p>
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
            <label className="text-xs font-medium text-zinc-700">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Key</label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Storage Root Path</label>
            <Input value={storageRootPath} onChange={(e) => setStorageRootPath(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Cover Path</label>
            <Input value={coverPath} onChange={(e) => setCoverPath(e.target.value)} className="mt-1" placeholder="/files/covers/series.jpg" />
            <p className="mt-1 text-xs text-zinc-500">Kosongkan untuk tetap; gunakan nilai null untuk menghapus.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Source</label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} className="mt-1" placeholder="whatbox" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Uploaded At</label>
            <Input
              type="datetime-local"
              value={uploadedAt ? toLocalInputValue(uploadedAt) : ""}
              onChange={(e) => setUploadedAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Episode Count</label>
            <Input
              type="number"
              value={episodeCount}
              onChange={(e) => setEpisodeCount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Synopsis</label>
            <Input value={synopsis} onChange={(e) => setSynopsis(e.target.value)} className="mt-1" placeholder="Ringkasan..." />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Tag IDs (comma separated)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1" placeholder="id1,id2,id3" />
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
