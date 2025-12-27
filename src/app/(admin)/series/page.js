"use client";

import AddButton from "@/components/ui/AddButton";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { deleteSeries, fetchSeries, fetchSeriesDetail, fetchTags, updateSeries } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function SeriesPage() {
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
  const [keyValue, setKeyValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tagsList, setTagsList] = useState([]);
  const [tagsValue, setTagsValue] = useState([]);

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
        const json = await fetchSeries(params);
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

  useEffect(() => {
    const loadTags = async () => {
      try {
        const t = await fetchTags({ page: 1, per_page: 100 });
        setTagsList(t?.data || []);
      } catch {}
    };
    loadTags();
  }, []);

  function openEdit(s) {
    setSelected(s);
    setNameValue(s.name || "");
    setKeyValue(s.key || "");
    setMessage("");
    setEditOpen(true);
    (async () => {
      try {
        const det = await fetchSeriesDetail(s.id);
        const currentTagIds = (det?.data?.tags || []).map((t) => String(t.id));
        setTagsValue(currentTagIds);
      } catch {
        setTagsValue([]);
      }
    })();
  }

  async function onSaveEdit() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      await updateSeries(selected.id, {
        name: nameValue,
        key: keyValue,
        tags: tagsValue,
      });
      setItems((prev) =>
        prev.map((s) =>
          s.id === selected.id
            ? { ...s, name: nameValue, key: keyValue }
            : s
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
      await deleteSeries(selected.id);
      setItems((prev) => prev.filter((s) => s.id !== selected.id));
      setDeleteOpen(false);
    } catch (err) {
      setMessage(err?.message || "Gagal menghapus series");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-nowrap">
        <div>
          <h1 className="text-xl font-semibold text-black">Series</h1>
          <p className="text-sm text-zinc-700">Daftar series dengan pencarian.</p>
        </div>
        <AddButton href="/series/new" label="Tambah Series" />
      </div>

      <Card>
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
              placeholder="name, synopsis, key"
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
      </Card>

      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Key</th>
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-left">Episodes</th>
                <th className="px-3 py-2 text-left">Uploaded At</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">
                    Memuat...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="border-t border-black/5">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.key}</td>
                    <td className="px-3 py-2">{s.source}</td>
                    <td className="px-3 py-2">{s.episode_count ?? "-"}</td>
                    <td className="px-3 py-2">
                      {s.uploaded_at ? new Date(s.uploaded_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/series/${s.id}`}
                          className="rounded-md border border-black/10 px-3 py-1 text-sm transition hover:bg-black/[.04]"
                        >
                          Detail
                        </Link>
                        <Button
                          variant="outline"
                          className="px-3 py-1"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-1"
                          onClick={() => {
                            setSelected(s);
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
        title="Edit Series"
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
            <label className="text-xs font-medium text-zinc-700">Key</label>
            <Input
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Tags</label>
            <Select
              multiple
              value={tagsValue}
              onChange={(e) =>
                setTagsValue(Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="mt-1 h-28"
            >
              {tagsList.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </Select>
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
        title="Hapus Series"
      >
        <div className="space-y-3">
          <div className="text-sm text-zinc-700">Apakah Anda yakin ingin menghapus series ini?</div>
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
