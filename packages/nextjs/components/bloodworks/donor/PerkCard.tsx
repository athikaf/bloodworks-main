"use client";

import React, { useMemo } from "react";
import { usePerkOnchainStatus } from "~~/hooks/bloodworks/usePerkOnchainStatus";

export type Perk = {
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
  donorAddress?: string; // optional, modal uses wallet anyway
  isActive: boolean; // ✅ needed for Option A cooldown-window UX
  onActionClick?: (perk: Perk) => void; // ✅ match what PerksGrid uses
};

export const PerkCard: React.FC<Props> = ({
  perk,
  donationCount,
  isActive,
  onActionClick,
}) => {
  const isUnlocked = donationCount >= (perk.minDonations ?? 0);

  // On-chain: exists/enabled + live redemption counter
  const { perkExists, perkEnabled, totalRedemptions, isLoading, error } =
    usePerkOnchainStatus(perk.partnerId, perk.perkId);

  const exists = perkExists === true;
  const enabled = perkEnabled === true;

  const badge = useMemo(() => {
    if (isLoading) return { text: "Checking…", cls: "badge-ghost" };
    if (!exists) return { text: "Not created on-chain", cls: "badge-ghost" };
    if (!enabled) return { text: "Disabled", cls: "badge-warning" };
    if (!isUnlocked)
      return {
        text: `Locked — needs ${perk.minDonations}`,
        cls: "badge-ghost",
      };
    if (!isActive) return { text: "Not in redeem window", cls: "badge-ghost" };
    return { text: "Eligible", cls: "badge-success" };
  }, [isLoading, exists, enabled, isUnlocked, isActive, perk.minDonations]);

  // Donor never redeems on-chain. CTA is just "show instructions/code".
  // We still disable it if perk isn't unlocked OR donor isn't in active window (Option A),
  // but we DO NOT hide perks.
  const canAction = isUnlocked && isActive;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200">
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
                On-chain:{" "}
                <span className="font-mono">
                  {isLoading
                    ? "…"
                    : exists
                      ? enabled
                        ? "enabled"
                        : "disabled"
                      : "not-created"}
                </span>
                {" · "}
                Redemptions:{" "}
                <span className="font-mono">
                  {totalRedemptions === undefined
                    ? "—"
                    : totalRedemptions.toString()}
                </span>
              </p>

              {error ? (
                <p className="text-xs text-error mt-1">On-chain read failed.</p>
              ) : null}
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

        {!isActive ? (
          <p className="text-xs opacity-60 mt-2">
            Redeem window opens after your next verified donation (cooldown
            active).
          </p>
        ) : (
          <p className="text-xs opacity-60 mt-2">
            Redemption is completed by an operator at the partner location.
          </p>
        )}
      </div>
    </div>
  );
};
