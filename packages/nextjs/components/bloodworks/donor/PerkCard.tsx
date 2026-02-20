"use client";

import React from "react";

export type Perk = {
  id: number; // perk_id (u32)
  title: string;
  description: string;
  partnerName: string;
  partnerId: number; // partner_id (u32)
  minDonations: number; // unlock threshold
};

type Props = {
  perk: Perk;
  donationCount: number;
  isRedeemed: boolean;
  isCheckingRedeemed?: boolean;
  onRedeemClick: (perk: Perk) => void;
};

export const PerkCard: React.FC<Props> = ({
  perk,
  donationCount,
  isRedeemed,
  isCheckingRedeemed,
  onRedeemClick,
}) => {
  const unlocked = donationCount >= perk.minDonations;

  const statusLabel = isRedeemed
    ? "Redeemed"
    : unlocked
      ? "Unlocked"
      : `Locked (needs ${perk.minDonations})`;

  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{perk.title}</h3>
          <p className="text-sm opacity-80 mt-1">{perk.description}</p>
          <p className="text-xs opacity-70 mt-2">
            Partner: <span className="font-semibold">{perk.partnerName}</span>
          </p>
        </div>

        <div
          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
            isRedeemed
              ? "bg-success/15 text-success"
              : unlocked
                ? "bg-primary/15 text-primary"
                : "bg-base-200 text-base-content/70"
          }`}
        >
          {isCheckingRedeemed ? "Checking…" : statusLabel}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="text-xs opacity-70">
          Requires: <span className="font-semibold">{perk.minDonations}</span>{" "}
          donations
        </div>

        <button
          className="btn btn-sm btn-primary"
          disabled={!unlocked || isRedeemed}
          onClick={() => onRedeemClick(perk)}
        >
          {isRedeemed ? "Redeemed" : unlocked ? "Redeem" : "Locked"}
        </button>
      </div>
    </div>
  );
};
