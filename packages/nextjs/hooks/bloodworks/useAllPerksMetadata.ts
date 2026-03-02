"use client";

import { useEffect, useState } from "react";

export type AggregatedPerk = {
  partnerId: number;
  partnerName?: string;

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

export function useAllPerksMetadata() {
  const [perks, setPerks] = useState<AggregatedPerk[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/perks/all", { cache: "no-store" });
      const j = await r.json();
      setPerks(Array.isArray(j?.perks) ? j.perks : []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { perks, loading, err, refresh };
}
