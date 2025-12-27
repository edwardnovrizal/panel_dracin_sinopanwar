"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  fetchTag,
  updateTag,
  deleteTag,
} from "@/lib/api";

export default function TagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tag, setTag] = useState(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [aliases, setAliases] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const json = await fetchTag(id);
        const t = json?.data;
        setTag(t);
        setName(t?.name || "");
        setSlug(t?.slug || "");
        setDescription(t?.description || "");
        setAliases((t?.aliases || []).join(","));
      } catch (err) {
        setError(err?.message || "Gagal memuat tag");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const payload = useMemo(() => {
    const data = {};
    if (name !== (tag?.name || "")) data.name = name;
    if (slug !== (tag?.slug || "")) data.slug = slug;
    if (description !== (tag?.description || "")) data.description = description === "" ? null : description;
    const currentAliases = (tag?.aliases || []).join(",");
    if (aliases !== currentAliases) {
      const arr = aliases
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x !== "");
      data.aliases = arr;
    }
    return data;
  }, [name, slug, description, aliases, tag]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await updateTag(id, payload);
      const updated = res?.data;
      setTag(updated);
      setName(updated?.name || "");
      setSlug(updated?.slug || "");
      setDescription(updated?.description || "");
      setAliases((updated?.aliases || []).join(","));
      setMessage("Perubahan berhasil disimpan");
    } catch (err) {
      setMessage(err?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Hapus tag ini?")) return;
    try {
      await deleteTag(id);
      router.replace("/tags");
    } catch (err) {
      setMessage(err?.message || "Gagal menghapus tag");
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

  if (!tag) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Detail Tag</h1>
          <p className="text-sm text-zinc-600">{tag.name}</p>
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
            <label className="text-xs font-medium text-zinc-700">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1" placeholder="otomatis dari name jika kosong" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-zinc-500">Kosongkan untuk tetap; kirim null untuk menghapus.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Aliases (comma separated)</label>
            <Input value={aliases} onChange={(e) => setAliases(e.target.value)} className="mt-1" placeholder="alias1,alias2" />
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
