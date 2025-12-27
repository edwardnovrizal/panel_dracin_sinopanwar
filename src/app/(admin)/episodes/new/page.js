"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createEpisode } from "@/lib/api";

export default function EpisodeNewPage() {
  const router = useRouter();
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

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        seriesId,
        episodeNumber: Number(episodeNumber),
        filename,
      };
      if (subtitle) payload.isSubtitle = true;
      if (subtitlePath !== "") payload.subtitlePath = subtitlePath;
      if (size !== "") payload.size = Number(size);
      if (lastModified) payload.lastModified = lastModified;
      if (url !== "") payload.url = url;
      const res = await createEpisode(payload);
      const created = res?.data;
      setMessage("Episode berhasil dibuat");
      router.replace(`/episodes/${created?.id}`);
    } catch (err) {
      setMessage(err?.message || "Gagal membuat episode");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tambah Episode</h1>
          <p className="text-sm text-zinc-600">Isi minimal series ID, episode number, dan filename.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Kembali</Button>
      </div>

      <form onSubmit={onCreate} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-700">Series ID</label>
            <Input value={seriesId} onChange={(e) => setSeriesId(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Episode Number</label>
            <Input type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
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
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Size</label>
            <Input type="number" value={size} onChange={(e) => setSize(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Last Modified</label>
            <Input
              type="datetime-local"
              value={lastModified}
              onChange={(e) => setLastModified(e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" />
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
