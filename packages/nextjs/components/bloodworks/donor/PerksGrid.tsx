"use client";

import React, { useState } from "react";
import { useAccount } from "@starknet-react/core";
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
    id: 2, // ✅ FIX: was id: 1 again — must be unique per perk
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

  return (
    <div className="w-full">
      <div className="flex items-end justify-between">
        <div className="text-sm opacity-70">
          Donations: <span className="font-semibold">{donationCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {PERKS.map((perk) => {
          const key = `${perk.partnerId}:${perk.id}`;

          return (
            <PerkCard
              key={key}
              perk={perk}
              donationCount={donationCount}
              donorAddress={donor}
              onRedeemClick={(p) => setSelectedPerk(p)}
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
