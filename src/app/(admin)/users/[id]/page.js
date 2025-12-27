"use client";

import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { deleteUser, fetchUser } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const json = await fetchUser(id);
        const u = json?.data;
        setUser(u);
      } catch (err) {
        setError(err?.message || "Gagal memuat user");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const onDelete = async () => {
    if (!confirm("Hapus user ini secara permanen?")) return;
    try {
      await deleteUser(id);
      router.replace("/users");
    } catch (err) {
      alert(err?.message || "Gagal menghapus user");
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => router.back()}
      title="Detail User"
    >
      {loading ? (
        <div className="p-2 text-sm text-zinc-600">Memuat...</div>
      ) : error ? (
        <div className="p-2 text-sm text-red-600">{error}</div>
      ) : !user ? null : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photo_url && !imgErr ? (
                <img
                  src={user.photo_url}
                  alt="Foto"
                  className="h-16 w-16 rounded-full object-cover"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-700">
                  {(user.display_name || user.email || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-black">
                  {user.display_name || "-"}
                </div>
                <div className="text-xs text-zinc-700">{user.email}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {user.is_premium ? (
                    <Badge variant="success">Premium</Badge>
                  ) : (
                    <Badge>Free</Badge>
                  )}
                  {user.disabled ? (
                    <Badge variant="danger">Disabled</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="danger" onClick={onDelete}>
                Hapus
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Tutup
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="text-xs font-medium text-zinc-700">ID</div>
              <div className="text-sm text-black">{user.id}</div>
            </div>
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="text-xs font-medium text-zinc-700">Nama Tampilan</div>
              <div className="text-sm text-black">{user.display_name || "-"}</div>
            </div>
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="text-xs font-medium text-zinc-700">Premium Sampai</div>
              <div className="text-sm text-black">
                {user.premium_until ? new Date(user.premium_until).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="text-xs font-medium text-zinc-700">Dibuat</div>
              <div className="text-sm text-black">
                {user.created_at ? new Date(user.created_at).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="text-xs font-medium text-zinc-700">Diubah</div>
              <div className="text-sm text-black">
                {user.updated_at ? new Date(user.updated_at).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="text-xs font-medium text-zinc-700">Foto</div>
              <div className="text-sm text-black">
                {user.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt="Foto"
                    className="mt-1 h-20 w-20 rounded-md object-cover"
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
