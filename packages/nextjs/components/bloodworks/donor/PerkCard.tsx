"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

export type Perk = {
  id: number;
  title: string;
  description: string;
  partnerName: string;
  partnerId: number;
  minDonations: number;
  imageUrl?: string;
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
  const isUnlocked = donationCount >= perk.minDonations;

  const { data: redeemedRaw, isLoading } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "is_redeemed",
    args: donorAddress ? [donorAddress, perk.partnerId, perk.id] : undefined,
    enabled: !!donorAddress && isUnlocked,
    watch: false,
  });

  const isRedeemed = useMemo(() => {
    if (redeemedRaw === undefined || redeemedRaw === null) return false;
    return Boolean(redeemedRaw);
  }, [redeemedRaw]);

  const showRedeem = !!donorAddress && isUnlocked && !isRedeemed;

  // ✅ Image error / load state
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const showImage = perk.imageUrl && !imgError;

  return (
    <div className="card bg-base-100 border border-base-300 overflow-hidden">
      {/* ---------------- IMAGE SECTION ---------------- */}
      <div className="relative w-full h-44 bg-base-200">
        {showImage ? (
          <>
            {/* skeleton shimmer until loaded */}
            {!imgLoaded && (
              <div className="absolute inset-0 animate-pulse bg-base-300" />
            )}

            <Image
              src={perk.imageUrl!}
              alt={perk.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-cover transition-opacity duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          // ✅ Fallback placeholder
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="text-3xl mb-2">🩸</div>
            <div className="text-sm font-semibold">{perk.title}</div>
            <div className="text-xs opacity-60 mt-1">
              Reward by {perk.partnerName}
            </div>
          </div>
        )}
      </div>
      {/* ---------------- END IMAGE ---------------- */}

      <div className="card-body">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="card-title text-base">{perk.title}</h3>
            <p className="text-sm opacity-80">{perk.description}</p>

            <p className="text-xs opacity-60 mt-2">
              Partner: <span className="font-medium">{perk.partnerName}</span>
            </p>

            <p className="text-xs opacity-60 mt-1">
              Unlocks at{" "}
              <span className="font-medium">{perk.minDonations}</span> donation
              {perk.minDonations === 1 ? "" : "s"}
            </p>
          </div>

          {!isUnlocked ? (
            <span className="badge badge-ghost shrink-0">
              Locked — needs {perk.minDonations}
            </span>
          ) : isLoading ? (
            <span className="badge badge-ghost shrink-0">Checking…</span>
          ) : isRedeemed ? (
            <span className="badge badge-success shrink-0">Redeemed</span>
          ) : (
            <span className="badge badge-primary shrink-0">Unlocked</span>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="btn btn-sm btn-primary"
            disabled={!showRedeem}
            onClick={() => onRedeemClick?.(perk)}
          >
            Redeem
          </button>
        </div>

        {!donorAddress && (
          <p className="text-xs opacity-60 mt-2">
            Connect wallet to see redemption status.
          </p>
        )}
      </div>
    </div>
  );
};
