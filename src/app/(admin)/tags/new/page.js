"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createTag } from "@/lib/api";

export default function TagNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [aliases, setAliases] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = { name };
      if (slug !== "") payload.slug = slug;
      if (description !== "") payload.description = description;
      const arr = aliases
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x !== "");
      if (arr.length > 0) payload.aliases = arr;
      const res = await createTag(payload);
      const created = res?.data;
      setMessage("Tag berhasil dibuat");
      router.replace(`/tags/${created?.id}`);
    } catch (err) {
      setMessage(err?.message || "Gagal membuat tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tambah Tag</h1>
          <p className="text-sm text-zinc-600">Isi minimal name.</p>
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
            <label className="text-xs font-medium text-zinc-700">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1" placeholder="otomatis dari name jika kosong" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
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
