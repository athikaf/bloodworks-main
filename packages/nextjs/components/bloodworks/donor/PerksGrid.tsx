"use client";

import React, { useMemo, useState } from "react";
import { Perk, PerkCard } from "./PerkCard";
import { useAllPerksMetadata } from "~~/hooks/bloodworks/useAllPerksMetadata";

// Optional: keep your modal if you want to show instructions / QR / perk details.
// If you don’t want a modal, delete this import + related code.
import { RedeemModal } from "./RedeemModal";

type Props = {
  donationCount: number;
};

export const PerksGrid: React.FC<Props> = ({ donationCount }) => {
  const { perks, loading, err, refresh } = useAllPerksMetadata();
  const [selectedPerk, setSelectedPerk] = useState<Perk | undefined>(undefined);

  const normalized: Perk[] = useMemo(() => {
    return (perks || []).map((p: any) => ({
      partnerId: Number(p.partnerId),
      partnerName: p.partnerName || "",
      perkId: Number(p.perkId),
      title: p.title,
      description: p.description || "",
      image: p.image || "",
      minDonations: Number(p.minDonations ?? 0),
      category: p.category || "",
      ctaLabel: p.ctaLabel || "How to redeem",
    }));
  }, [perks]);

  // Eligibility filter (client-side)
  const eligibleFirst = useMemo(() => {
    return normalized.slice().sort((a, b) => {
      const aOk = donationCount >= a.minDonations;
      const bOk = donationCount >= b.minDonations;
      if (aOk !== bOk) return aOk ? -1 : 1;
      if (a.partnerId !== b.partnerId) return a.partnerId - b.partnerId;
      return a.perkId - b.perkId;
    });
  }, [normalized, donationCount]);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between">
        <div className="text-sm opacity-70">
          Donations: <span className="font-semibold">{donationCount}</span>
        </div>

        <button className="btn btn-sm btn-outline" onClick={refresh}>
          Refresh
        </button>
      </div>

      {err ? (
        <div className="card bg-base-100 border border-base-300 mt-4">
          <div className="card-body">
            <p className="text-sm text-error">
              Couldn’t load perks metadata: {err}
            </p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="card bg-base-100 border border-base-300 mt-4">
          <div className="card-body">
            <p className="text-sm">Loading perks…</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {eligibleFirst.map((perk) => (
          <PerkCard
            key={`${perk.partnerId}:${perk.perkId}`}
            perk={perk}
            donationCount={donationCount}
            onActionClick={(p) => setSelectedPerk(p)}
          />
        ))}
      </div>

      <RedeemModal
        open={!!selectedPerk}
        perk={selectedPerk}
        onClose={() => setSelectedPerk(undefined)}
      />
    </div>
  );
};
