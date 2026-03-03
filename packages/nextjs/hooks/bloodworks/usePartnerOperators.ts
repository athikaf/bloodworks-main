"use client";

import { useEffect, useState } from "react";

export type OperatorMeta = {
  address: string;
  label?: string;
};

export function usePartnerOperators(partnerId?: number) {
  const [operators, setOperators] = useState<OperatorMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    if (!partnerId || partnerId <= 0) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/partner/operators/${partnerId}/list`, {
        cache: "no-store",
      });
      const j = await r.json();
      setOperators(Array.isArray(j?.operators) ? j.operators : []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const add = async (address: string, label?: string) => {
    if (!partnerId || partnerId <= 0)
      return { ok: false, error: "Missing partnerId" };
    const r = await fetch(`/api/partner/operators/${partnerId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, label }),
    });
    const j = await r.json();
    await refresh();
    return j;
  };

  const remove = async (address: string) => {
    if (!partnerId || partnerId <= 0)
      return { ok: false, error: "Missing partnerId" };
    const r = await fetch(`/api/partner/operators/${partnerId}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const j = await r.json();
    await refresh();
    return j;
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  return { operators, loading, err, refresh, add, remove };
}
