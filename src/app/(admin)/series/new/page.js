"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createSeries } from "@/lib/api";

export default function SeriesNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [storageRootPath, setStorageRootPath] = useState("");
  const [key, setKey] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverPath, setCoverPath] = useState("");
  const [source, setSource] = useState("whatbox");
  const [uploadedAt, setUploadedAt] = useState("");
  const [episodeCount, setEpisodeCount] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name,
        storageRootPath,
        key,
      };
      if (synopsis !== "") payload.synopsis = synopsis;
      if (coverPath !== "") payload.coverPath = coverPath;
      if (source !== "") payload.source = source;
      if (uploadedAt) payload.uploadedAt = uploadedAt;
      if (episodeCount !== "") payload.episodeCount = Number(episodeCount);
      const arr = tags
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x !== "");
      if (arr.length > 0) payload.tags = arr;
      const res = await createSeries(payload);
      const created = res?.data;
      setMessage("Series berhasil dibuat");
      router.replace(`/series/${created?.id}`);
    } catch (err) {
      setMessage(err?.message || "Gagal membuat series");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tambah Series</h1>
          <p className="text-sm text-zinc-600">Isi minimal name, storage root path, dan key.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Kembali</Button>
      </div>

      <form onSubmit={onCreate} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm space-y-4">
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
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Source</label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} className="mt-1" placeholder="whatbox" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Uploaded At</label>
            <Input
              type="datetime-local"
              value={uploadedAt}
              onChange={(e) => setUploadedAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Episode Count</label>
            <Input type="number" value={episodeCount} onChange={(e) => setEpisodeCount(e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Synopsis</label>
            <Input value={synopsis} onChange={(e) => setSynopsis(e.target.value)} className="mt-1" />
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
