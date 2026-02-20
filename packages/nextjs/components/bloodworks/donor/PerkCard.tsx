"use client";

import React, { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

export type Perk = {
  id: number;
  title: string;
  description: string;
  partnerName: string;
  partnerId: number;
  minDonations: number;
};

type Props = {
  perk: Perk;
  donationCount: number;
  donorAddress?: string;
  onRedeemClick?: (perk: Perk) => void;
};

export const PerkCard: React.FC<Props> = ({
  perk,
  donationCount,
  donorAddress,
  onRedeemClick,
}) => {
  // 🚦 Unlock condition
  console.log("[PerkCard]", perk.title, {
    donationCount,
    donationCountType: typeof donationCount,
    minDonations: perk.minDonations,
    minType: typeof perk.minDonations,
  });
  const isUnlocked = donationCount >= perk.minDonations;

  /**
   * 🧠 Read onchain redemption status
   * Only runs when:
   *  - wallet connected
   *  - perk unlocked
   */
  const { data: redeemedRaw, isLoading } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "is_redeemed",
    args: [donorAddress, perk.partnerId, perk.id], // ✅ always a tuple
    enabled: !!donorAddress && isUnlocked,
    watch: false,
  });

  /**
   * 🔐 Safe Starknet bool parsing
   * Handles:
   *  - boolean
   *  - "0"/"1"
   *  - 0n/1n
   *  - ["0"]/["1"]
   */
  const isRedeemed = useMemo(() => {
    if (redeemedRaw === undefined || redeemedRaw === null) return false;

    if (typeof redeemedRaw === "boolean") return redeemedRaw;

    if (typeof redeemedRaw === "string") {
      return redeemedRaw === "1" || redeemedRaw === "0x1";
    }

    if (typeof redeemedRaw === "bigint") {
      return redeemedRaw === 1n;
    }

    if (Array.isArray(redeemedRaw) && redeemedRaw.length > 0) {
      const v = redeemedRaw[0];

      if (typeof v === "bigint") return v === 1n;
      if (typeof v === "string") return v === "1" || v === "0x1";
    }

    return false;
  }, [redeemedRaw]);

  const showRedeemButton =
    !!donorAddress && isUnlocked && !isRedeemed && !isLoading;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="card-title text-base">{perk.title}</h3>
            <p className="text-sm opacity-80">{perk.description}</p>

            <p className="text-xs opacity-60 mt-2">
              Partner: <span className="font-medium">{perk.partnerName}</span>
            </p>
          </div>

          {/* Status Badge */}
          {!isUnlocked ? (
            <span className="badge badge-ghost">
              Locked — needs {perk.minDonations}
            </span>
          ) : isLoading ? (
            <span className="badge badge-ghost">Checking…</span>
          ) : isRedeemed ? (
            <span className="badge badge-success">Redeemed</span>
          ) : (
            <span className="badge badge-primary">Unlocked</span>
          )}
        </div>

        {/* Action */}
        <div className="mt-4 flex justify-end">
          <button
            className="btn btn-sm btn-primary"
            disabled={!showRedeemButton}
            onClick={() => onRedeemClick?.(perk)}
          >
            Redeem
          </button>
        </div>

        {/* Wallet hint */}
        {!donorAddress && (
          <p className="text-xs opacity-60 mt-2">
            Connect wallet to see redemption status.
          </p>
        )}
      </div>
    </div>
  );
};
