"use client";

import AddButton from "@/components/ui/AddButton";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { deleteEpisode, fetchEpisodes, fetchSeries, updateEpisode } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function EpisodesPage() {
  const [q, setQ] = useState("");
  const [seriesId, setSeriesId] = useState("");
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
  const [episodeNumberValue, setEpisodeNumberValue] = useState("");
  const [filenameValue, setFilenameValue] = useState("");
  const [subtitleValue, setSubtitleValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [seriesIdEdit, setSeriesIdEdit] = useState("");

  const params = useMemo(
    () => ({
      q: q.trim(),
      series_id: seriesId || undefined,
      page,
      per_page: perPage,
    }),
    [q, seriesId, page, perPage]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const json = await fetchEpisodes(params);
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
  }, [params.q, params.series_id, params.page, params.per_page]);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const s = await fetchSeries({ page: 1, per_page: 100 });
        setSeriesOptions(s?.data || []);
      } catch {}
    };
    loadSeries();
  }, []);

  function openEdit(e) {
    setSelected(e);
    setEpisodeNumberValue(String(e.episode_number || ""));
    setFilenameValue(e.filename || "");
    setSubtitleValue(e.subtitle ? "true" : "false");
    setSeriesIdEdit(String(e.series_id || ""));
    setMessage("");
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        episodeNumber: episodeNumberValue === "" ? null : Number(episodeNumberValue),
        filename: filenameValue,
        subtitle: subtitleValue === "true",
        seriesId: seriesIdEdit || undefined,
      };
      await updateEpisode(selected.id, payload);
      setItems((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? {
                ...e,
                episode_number: episodeNumberValue === "" ? null : Number(episodeNumberValue),
                filename: filenameValue,
                subtitle: subtitleValue === "true",
                series_id: seriesIdEdit || e.series_id,
              }
            : e
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
      await deleteEpisode(selected.id);
      setItems((prev) => prev.filter((e) => e.id !== selected.id));
      setDeleteOpen(false);
    } catch (err) {
      setMessage(err?.message || "Gagal menghapus episode");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-nowrap">
        <div>
          <h1 className="text-xl font-semibold text-black">Episodes</h1>
          <p className="text-sm text-zinc-700">Daftar episodes dengan pencarian dan filter series.</p>
        </div>
        <AddButton href="/episodes/new" label="Tambah Episode" />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700">Cari</label>
            <Input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="mt-1"
              placeholder="filename, url"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Series</label>
            <Select
              value={seriesId}
              onChange={(e) => {
                setPage(1);
                setSeriesId(e.target.value);
              }}
              className="mt-1"
            >
              <option value="">Semua</option>
              {seriesOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </Select>
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
                <th className="px-3 py-2 text-left">Series ID</th>
                <th className="px-3 py-2 text-left">Episode #</th>
                <th className="px-3 py-2 text-left">Filename</th>
                <th className="px-3 py-2 text-left">Subtitle</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">Last Modified</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-600">
                    Memuat...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-600">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                items.map((e) => (
                  <tr key={e.id} className="border-t border-black/5">
                    <td className="px-3 py-2">{e.series_id}</td>
                    <td className="px-3 py-2">{e.episode_number}</td>
                    <td className="px-3 py-2">{e.filename}</td>
                    <td className="px-3 py-2">{e.subtitle ? "Ya" : "Tidak"}</td>
                    <td className="px-3 py-2">{e.size ?? "-"}</td>
                    <td className="px-3 py-2">
                      {e.last_modified ? new Date(e.last_modified).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/episodes/${e.id}`}
                          className="rounded-md border border-black/10 px-3 py-1 text-sm transition hover:bg-black/[.04]"
                        >
                          Detail
                        </Link>
                        <Button
                          variant="outline"
                          className="px-3 py-1"
                          onClick={() => openEdit(e)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-1"
                          onClick={() => {
                            setSelected(e);
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
        title="Edit Episode"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">Episode number</label>
            <Input
              type="number"
              value={episodeNumberValue}
              onChange={(e) => setEpisodeNumberValue(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Filename</label>
            <Input
              value={filenameValue}
              onChange={(e) => setFilenameValue(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Subtitle</label>
            <Select
              value={subtitleValue}
              onChange={(e) => setSubtitleValue(e.target.value)}
              className="mt-1"
            >
              <option value="false">Tidak</option>
              <option value="true">Ya</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Series</label>
            <Select
              value={seriesIdEdit}
              onChange={(e) => setSeriesIdEdit(e.target.value)}
              className="mt-1"
            >
              <option value="">Tidak diubah</option>
              {seriesOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
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
        title="Hapus Episode"
      >
        <div className="space-y-3">
          <div className="text-sm text-zinc-700">Apakah Anda yakin ingin menghapus episode ini?</div>
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
