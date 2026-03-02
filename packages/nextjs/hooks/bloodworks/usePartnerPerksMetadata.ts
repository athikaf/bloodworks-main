"use client";

import { useEffect, useState } from "react";

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

export type PartnerPerksFile = {
  partnerId: number;
  partnerName?: string;
  updatedAt?: string;
  perks: PerkMeta[];
  error?: string;
};

export function usePartnerPerksMetadata(partnerId?: number) {
  const [data, setData] = useState<PartnerPerksFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    if (!partnerId || partnerId <= 0) return;
    setLoading(true);
    setErr(null);

    try {
      const r = await fetch(`/api/perks/${partnerId}`, {
        cache: "no-store",
      });
      const j = (await r.json()) as PartnerPerksFile;
      setData(j);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  return { data, loading, err, refresh };
}
