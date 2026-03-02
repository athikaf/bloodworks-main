"use client";

import React, { useMemo } from "react";
import { usePerkOnchainStatus } from "~~/hooks/bloodworks/usePerkOnchainStatus";

export type Perk = {
  // Align to your metadata model
  perkId: number;
  title: string;
  description?: string;
  image?: string;
  partnerName?: string;
  partnerId: number;
  minDonations: number;
  category?: string;
  ctaLabel?: string;
};

type Props = {
  perk: Perk;
  donationCount: number;
  onActionClick?: (perk: Perk) => void; // optional (open modal / show instructions)
};

export const PerkCard: React.FC<Props> = ({
  perk,
  donationCount,
  onActionClick,
}) => {
  const isUnlocked = donationCount >= (perk.minDonations ?? 0);

  // On-chain: exists/enabled + live redemption counter
  const { perkExists, perkEnabled, totalRedemptions, isLoading } =
    usePerkOnchainStatus(perk.partnerId, perk.perkId);

  // Only show perks that are actually enabled on-chain
  const isLiveEnabled = perkExists === true && perkEnabled === true;

  const badge = useMemo(() => {
    if (isLoading) return { text: "Checking…", cls: "badge-ghost" };
    if (!isLiveEnabled) return { text: "Not active", cls: "badge-ghost" };
    if (!isUnlocked)
      return {
        text: `Locked — needs ${perk.minDonations}`,
        cls: "badge-ghost",
      };
    return { text: "Eligible", cls: "badge-success" };
  }, [isLoading, isLiveEnabled, isUnlocked, perk.minDonations]);

  // In this protocol, donor doesn't execute redeem tx; operator does.
  const canAction = isLiveEnabled && isUnlocked;

  // If you prefer hiding inactive perks entirely, PerksGrid will already filter.
  // This is just extra safety:
  if (!isLiveEnabled) return null;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200">
      <span className="badge badge-outline text-xs">Live</span>
      <div className="card-body">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-base-300 bg-base-200 flex items-center justify-center">
              {perk.image ? (
                <img
                  src={perk.image}
                  alt={perk.title}
                  className="w-14 h-14 object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-xs opacity-60">No image</div>
              )}
            </div>

            <div>
              <h3 className="card-title text-base">{perk.title}</h3>
              {perk.description ? (
                <p className="text-sm opacity-80">{perk.description}</p>
              ) : null}

              <p className="text-xs opacity-60 mt-2">
                Partner:{" "}
                <span className="font-medium">
                  {perk.partnerName || `#${perk.partnerId}`}
                </span>
                {perk.category ? <> • {perk.category}</> : null}
              </p>

              <p className="text-xs opacity-60 mt-1">
                Live redemptions:{" "}
                <span className="font-mono">
                  {totalRedemptions === undefined
                    ? "—"
                    : totalRedemptions.toString()}
                </span>
              </p>
            </div>
          </div>

          <span className={`badge ${badge.cls}`}>{badge.text}</span>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="btn btn-sm btn-primary"
            disabled={!canAction}
            onClick={() => onActionClick?.(perk)}
          >
            {perk.ctaLabel || "How to redeem"}
          </button>
        </div>

        <p className="text-xs opacity-60 mt-2">
          Redemption is completed by an operator at the partner location.
        </p>
      </div>
    </div>
  );
};
