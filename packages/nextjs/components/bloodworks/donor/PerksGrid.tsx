"use client";

import React, { useMemo, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { Perk, PerkCard } from "./PerkCard";
import { RedeemModal } from "./RedeemModal";

type Props = {
  donationCount: number; // from get_status / DonorStatusCard
};

const PERKS: Perk[] = [
  {
    id: 1,
    title: "Free Tim Hortons Coffee",
    description: "One coffee on us — thank you for donating.",
    partnerName: "Tim Hortons",
    partnerId: 101,
    minDonations: 1,
  },
  {
    id: 1,
    title: "VIP Blue Jays Tickets",
    description: "2 VIP tickets after consistent donations.",
    partnerName: "Scotiabank / Blue Jays",
    partnerId: 202,
    minDonations: 5,
  },
];

export const PerksGrid: React.FC<Props> = ({ donationCount }) => {
  const { address, status } = useAccount();
  const donor = status === "connected" ? address : undefined;

  const [selectedPerk, setSelectedPerk] = useState<Perk | undefined>(undefined);

  // For MVP: we do individual is_redeemed reads per perk
  // (Later we can batch/index this, but keep it simple now)

  const redeemedReads = PERKS.map((perk) => {
    const enabled = !!donor;

    // NOTE: hooks must be called unconditionally — so we call them for each perk
    // but "enabled" prevents RPC spam when not connected.
    const read = useScaffoldReadContract({
      contractName: "BloodworksCore",
      functionName: "is_redeemed",
      args: donor ? [donor, perk.partnerId, perk.id] : undefined,
      enabled,
      watch: false,
    });

    return { perk, ...read };
  });

  const redeemedMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const r of redeemedReads) {
      const key = `${r.perk.partnerId}:${r.perk.id}`;
      m.set(key, Boolean(r.data));
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redeemedReads.map((r) => r.data).join("|")]);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between">
        <div className="text-sm opacity-70">
          Donations: <span className="font-semibold">{donationCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {redeemedReads.map((r) => {
          const key = `${r.perk.partnerId}:${r.perk.id}`;
          const isRedeemed = redeemedMap.get(key) ?? false;

          return (
            <PerkCard
              key={key}
              perk={r.perk}
              donationCount={donationCount}
              isRedeemed={isRedeemed}
              isCheckingRedeemed={r.isLoading}
              onRedeemClick={(perk) => setSelectedPerk(perk)}
            />
          );
        })}
      </div>

      <RedeemModal
        open={!!selectedPerk}
        perk={selectedPerk}
        donorAddress={donor}
        onClose={() => setSelectedPerk(undefined)}
      />
    </div>
  );
};
