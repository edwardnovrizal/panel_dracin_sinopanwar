"use client";

import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Icon, { IconButton } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import { deleteUser, fetchUsers, updateUser } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [disabledFilter, setDisabledFilter] = useState("");
  const [isPremiumFilter, setIsPremiumFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("created_at_desc");
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
  const [displayName, setDisplayName] = useState("");
  const [isPremium, setIsPremium] = useState("");
  const [premiumUntil, setPremiumUntil] = useState("");
  const [disabledValue, setDisabledValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterWrapRef = useRef(null);

  const params = useMemo(
    () => ({
      q: q.trim(),
      page,
      per_page: perPage,
      disabled:
        disabledFilter === "" ? undefined : disabledFilter === "true" ? true : false,
      is_premium:
        isPremiumFilter === "" ? undefined : isPremiumFilter === "true" ? true : false,
      sort: sortOrder || undefined,
    }),
    [q, page, perPage, disabledFilter, isPremiumFilter, sortOrder]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const json = await fetchUsers(params);
      setItems(json?.data || []);
      setMeta(json?.meta || meta);
    } catch (err) {
      setError(err?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.page, params.per_page, params.disabled, params.is_premium, params.sort]);

  useEffect(() => {
    function onDocClick(e) {
      if (!filtersOpen) return;
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target)) {
        setFiltersOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setFiltersOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);
  function toLocalInputValue(iso) {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      return `${y}-${m}-${dd}T${hh}:${mm}`;
    } catch {
      return "";
    }
  }

  function openEdit(u) {
    setSelected(u);
    setDisplayName(u.display_name || "");
    setIsPremium(u.is_premium ? "true" : "false");
    setPremiumUntil(toLocalInputValue(u.premium_until));
    setDisabledValue(u.disabled ? "true" : "false");
    setMessage("");
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        displayName,
        isPremium: isPremium === "true",
        premiumUntil: premiumUntil ? new Date(premiumUntil).toISOString() : null,
        disabled: disabledValue === "true",
      };
      await updateUser(selected.id, payload);
      setItems((prev) =>
        prev.map((u) =>
          u.id === selected.id
            ? {
                ...u,
                display_name: displayName,
                is_premium: isPremium === "true",
                disabled: disabledValue === "true",
              }
            : u
        )
      );
      setMessage("Perubahan tersimpan");
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
      await deleteUser(selected.id);
      setItems((prev) => prev.filter((u) => u.id !== selected.id));
      setDeleteOpen(false);
    } catch (err) {
      setMessage(err?.message || "Gagal menghapus user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-zinc-600">
            Daftar pengguna dengan pencarian dan pagination.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 sm:max-w-[520px]">
            <SearchInput
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="email atau nama tampilan"
              className="mt-1"
            />
          </div>
          <div ref={filterWrapRef} className="relative">
            <Button
              variant="outline"
              className="inline-flex h-9 items-center gap-2 rounded-full px-3 py-2"
              onClick={() => setFiltersOpen((v) => !v)}
              title="Filter"
              aria-expanded={filtersOpen ? "true" : "false"}
            >
              <span className="text-zinc-700">
                <Icon name="filter" size={16} />
              </span>
              <span className="text-zinc-800">Filter</span>
            </Button>
            {filtersOpen && (
              <div className="absolute left-0 z-20 mt-2 w-[420px] rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Status disabled</label>
                    <Select
                      value={disabledFilter}
                      onChange={(e) => {
                        setPage(1);
                        setDisabledFilter(e.target.value);
                      }}
                      className="mt-1"
                    >
                      <option value="">Semua</option>
                      <option value="true">Disabled</option>
                      <option value="false">Active</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Premium</label>
                    <Select
                      value={isPremiumFilter}
                      onChange={(e) => {
                        setPage(1);
                        setIsPremiumFilter(e.target.value);
                      }}
                      className="mt-1"
                    >
                      <option value="">Semua</option>
                      <option value="false">Free</option>
                      <option value="true">Premium</option>
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
                  <div>
                    <label className="text-xs font-medium text-zinc-700">Urutkan</label>
                    <Select
                      value={sortOrder}
                      onChange={(e) => {
                        setPage(1);
                        setSortOrder(e.target.value);
                      }}
                      className="mt-1"
                    >
                      <option value="created_at_desc">Terbaru</option>
                      <option value="created_at_asc">Terlama</option>
                      <option value="email_asc">Email A-Z</option>
                      <option value="email_desc">Email Z-A</option>
                      <option value="display_name_asc">Nama A-Z</option>
                      <option value="display_name_desc">Nama Z-A</option>
                      <option value="is_premium_desc">Premium dulu</option>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="sticky top-0 bg-zinc-100 text-zinc-700">
                <th className="px-3 py-2 text-left">Foto</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Premium sampai</th>
                <th className="px-3 py-2 text-left">Dibuat</th>
                <th className="px-3 py-2 text-left">Diubah</th>
                <th className="px-3 py-2 w-[112px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-zinc-600">
                    Memuat...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-zinc-600">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="border-t border-black/5 odd:bg-white even:bg-zinc-50 hover:bg-black/[.02]">
                    <td className="px-3 py-2">
                      {u.photo_url ? (
                        <img
                          src={u.photo_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                          {(u.display_name || u.email || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-[240px] truncate" title={u.email}>{u.email}</td>
                    <td className="px-3 py-2 max-w-[240px] truncate" title={u.display_name || "-"}>{u.display_name || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {u.is_premium ? (
                          <Badge variant="success">Premium</Badge>
                        ) : (
                          <Badge>Free</Badge>
                        )}
                        {u.disabled ? (
                          <Badge variant="danger">Disabled</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {u.premium_until
                        ? <span className="tabular-nums">{new Date(u.premium_until).toLocaleString()}</span>
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {u.created_at
                        ? <span className="tabular-nums">{new Date(u.created_at).toLocaleString()}</span>
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {u.updated_at
                        ? <span className="tabular-nums">{new Date(u.updated_at).toLocaleString()}</span>
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-right w-[112px]">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton name="edit" title="Edit" variant="outline" onClick={() => openEdit(u)} />
                        <IconButton
                          name="trash"
                          title="Hapus"
                          variant="danger"
                          onClick={() => {
                            setSelected(u);
                            setMessage("");
                            setDeleteOpen(true);
                          }}
                        />
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
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              variant="outline"
            >
              Sebelumnya
            </Button>
            <Button
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((p) => p + 1)}
              variant="outline"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit User"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">Nama tampilan</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1"
              placeholder="nama tampilan"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Premium</label>
            <Select
              value={isPremium}
              onChange={(e) => setIsPremium(e.target.value)}
              className="mt-1"
            >
              <option value="false">Tidak</option>
              <option value="true">Ya</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Premium sampai</label>
            <Input
              type="datetime-local"
              value={premiumUntil}
              onChange={(e) => setPremiumUntil(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Disabled</label>
            <Select
              value={disabledValue}
              onChange={(e) => setDisabledValue(e.target.value)}
              className="mt-1"
            >
              <option value="false">Tidak</option>
              <option value="true">Ya</option>
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
        title="Hapus User"
      >
        <div className="space-y-3">
          <div className="text-sm text-zinc-700">
            Apakah Anda yakin ingin menghapus user ini?
          </div>
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
