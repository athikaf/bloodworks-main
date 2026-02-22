"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "@starknet-react/core";
import type { Perk } from "~~/types/perk";
import { PerkCard } from "./PerkCard";
import { RedeemModal } from "./RedeemModal";

type Props = {
  donationCount: number;
};

export const PerksGrid: React.FC<Props> = ({ donationCount }) => {
  const { address, status } = useAccount();
  const donor = status === "connected" ? address : undefined;

  const [perks, setPerks] = useState<Perk[]>([]);
  const [loadingPerks, setLoadingPerks] = useState(true);
  const [selectedPerk, setSelectedPerk] = useState<Perk | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoadingPerks(true);
        const res = await fetch("/api/perks", { cache: "no-store" });
        const json = await res.json();
        if (!mounted) return;
        setPerks(Array.isArray(json?.perks) ? json.perks : []);
      } catch {
        if (!mounted) return;
        setPerks([]);
      } finally {
        if (!mounted) return;
        setLoadingPerks(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const sorted = useMemo(() => {
    // Optional: unlocked perks first
    return [...perks].sort((a, b) => {
      const au = donationCount >= a.minDonations ? 1 : 0;
      const bu = donationCount >= b.minDonations ? 1 : 0;
      return bu - au;
    });
  }, [perks, donationCount]);

  if (loadingPerks) {
    return <div className="text-sm opacity-70">Loading perks…</div>;
  }

  if (!sorted.length) {
    return <div className="text-sm opacity-70">No perks available yet.</div>;
  }

  return (
    <div className="w-full">
      <div className="text-sm opacity-70">
        Donations: <span className="font-semibold">{donationCount}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {sorted.map((perk) => (
          <PerkCard
            key={`${perk.partnerId}:${perk.perkId}`}
            perk={perk}
            donationCount={donationCount}
            donorAddress={donor}
            onRedeemClick={() => setSelectedPerk(perk)}
          />
        ))}
      </div>

      <RedeemModal
        open={!!selectedPerk}
        perk={selectedPerk as any} // we’ll align types in a second if needed
        donorAddress={donor}
        onClose={() => setSelectedPerk(undefined)}
      />
    </div>
  );
};
