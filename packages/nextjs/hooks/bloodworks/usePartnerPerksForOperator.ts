"use client";

import { useCallback, useEffect, useState } from "react";

export type PerkMeta = {
  perkId: number;
  title: string;
  description?: string;
  image?: string;
  minDonations?: number;
  terms?: string;
  ctaLabel?: string;
  category?: string;
  onchainCreated?: boolean;
};

export function usePartnerPerksForOperator(partnerId?: number) {
  const [perks, setPerks] = useState<PerkMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!partnerId || partnerId <= 0) {
      setPerks([]);
      setErr(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/perks/${partnerId}`, {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json();
      const p = Array.isArray(json?.perks) ? json.perks : [];
      setPerks(p);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setPerks([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { perks, loading, err, refresh };
}
