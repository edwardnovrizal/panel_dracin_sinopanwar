"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PaymentsRootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/payments/actions");
  }, [router]);
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-sm text-zinc-700">Mengalihkan ke Payment Actions…</div>
    </div>
  );
}
