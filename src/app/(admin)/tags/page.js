"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { deleteTag, fetchTags, updateTag } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddButton from "@/components/ui/AddButton";

export default function TagsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total_items: 0,
    items_per_page: 20,
  });
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [slugValue, setSlugValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [aliasesValue, setAliasesValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const params = useMemo(
    () => ({
      q: q.trim(),
      page,
      per_page: perPage,
    }),
    [q, page, perPage]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const json = await fetchTags(params);
        setItems(json?.data || []);
        setMeta(json?.meta || meta);
      } catch (err) {
        setError(err?.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.page, params.per_page]);

  function openEdit(t) {
    setSelected(t);
    setNameValue(t.name || "");
    setSlugValue(t.slug || "");
    setDescriptionValue(t.description || "");
    setAliasesValue((t.aliases || []).join(","));
    setMessage("");
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: nameValue,
        slug: slugValue,
        description: descriptionValue === "" ? null : descriptionValue,
        aliases: aliasesValue
          .split(",")
          .map((x) => x.trim())
          .filter((x) => x !== ""),
      };
      await updateTag(selected.id, payload);
      setItems((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? {
                ...t,
                name: nameValue,
                slug: slugValue,
                description: descriptionValue === "" ? null : descriptionValue,
                aliases: aliasesValue
                  .split(",")
                  .map((x) => x.trim())
                  .filter((x) => x !== ""),
              }
            : t
        )
      );
      setEditOpen(false);
    } catch (err) {
      setMessage(err?.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmDelete() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteTag(selected.id);
      setItems((prev) => prev.filter((t) => t.id !== selected.id));
      setDeleteOpen(false);
    } catch (err) {
      setMessage(err?.message || "Gagal menghapus tag");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-nowrap">
        <div>
          <h1 className="text-xl font-semibold text-black">Tags</h1>
          <p className="text-sm text-zinc-700">Daftar tags dengan pencarian.</p>
        </div>
        <AddButton href="/tags/new" label="Tambah Tag" />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Cari</label>
            <Input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="mt-1"
              placeholder="name, slug, description, aliases"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Per halaman</label>
            <Select
              value={perPage}
              onChange={(e) => {
                setPage(1);
                setPerPage(Number(e.target.value));
              }}
              className="mt-1"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Aliases</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-600">
                    Memuat...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-600">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className="border-t border-black/5">
                    <td className="px-3 py-2">{t.name}</td>
                    <td className="px-3 py-2">{t.slug || "-"}</td>
                    <td className="px-3 py-2">{t.description || "-"}</td>
                    <td className="px-3 py-2">
                      {(t.aliases || []).join(", ")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/tags/${t.id}`}
                          className="rounded-md border border-black/10 px-3 py-1 text-sm transition hover:bg-black/[.04]"
                        >
                          Detail
                        </Link>
                        <Button
                          variant="outline"
                          className="px-3 py-1"
                          onClick={() => openEdit(t)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-1"
                          onClick={() => {
                            setSelected(t);
                            setMessage("");
                            setDeleteOpen(true);
                          }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-xs text-zinc-600">
            Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total_items}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Tag"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">Name</label>
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Slug</label>
            <Input
              value={slugValue}
              onChange={(e) => setSlugValue(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Deskripsi</label>
            <Input
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              className="mt-1"
              placeholder="opsional"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Aliases</label>
            <Input
              value={aliasesValue}
              onChange={(e) => setAliasesValue(e.target.value)}
              className="mt-1"
              placeholder="pisahkan dengan koma"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={onSaveEdit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
          {message && (
            <div className="text-xs text-zinc-700">{message}</div>
          )}
        </div>
      </Modal>
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Hapus Tag"
      >
        <div className="space-y-3">
          <div className="text-sm text-zinc-700">Apakah Anda yakin ingin menghapus tag ini?</div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={onConfirmDelete} disabled={saving}>
              {saving ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
          {message && (
            <div className="text-xs text-red-600">{message}</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
