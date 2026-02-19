"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { PERKS } from "./perks";

export const PerksGrid = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  // We need donation_count + active from get_status to know what’s unlocked/displayable
  const { data: statusData, isLoading: statusLoading } =
    useScaffoldReadContract({
      contractName: "BloodworksCore",
      functionName: "get_status",
      args: [address],
      enabled: isConnected,
      watch: false,
    });

  const parsed = useMemo(() => {
    if (!statusData) return null;
    const arr = statusData as unknown as [any, any, any, any, any];
    return {
      issued: Boolean(arr[0]),
      donationCount: Number(arr[1] ?? 0),
      active: Boolean(arr[4]),
    };
  }, [statusData]);

  if (!isConnected) {
    return (
      <div className="w-full max-w-xl mt-8 bg-base-100 rounded-2xl border border-base-300 p-5">
        <h2 className="text-lg font-bold">Perks</h2>
        <p className="mt-3 text-sm opacity-80">
          Connect your wallet to see perks.
        </p>
      </div>
    );
  }

  if (statusLoading || !parsed) {
    return (
      <div className="w-full max-w-xl mt-8 bg-base-100 rounded-2xl border border-base-300 p-5">
        <h2 className="text-lg font-bold">Perks</h2>
        <p className="mt-3 text-sm opacity-80">Loading perks…</p>
      </div>
    );
  }

  if (!parsed.issued) {
    return (
      <div className="w-full max-w-xl mt-8 bg-base-100 rounded-2xl border border-base-300 p-5">
        <h2 className="text-lg font-bold">Perks</h2>
        <p className="mt-3 text-sm opacity-80">
          You don’t have a credential yet — perks appear after the blood bank
          issues it.
        </p>
      </div>
    );
  }

  // For Phase 1: we can show perks even during cooldown, but mark “Not usable”
  const usableNow = parsed.active;

  return (
    <div className="w-full max-w-xl mt-8 bg-base-100 rounded-2xl border border-base-300 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Perks</h2>
        <span
          className={`text-xs px-2 py-1 rounded-full ${usableNow ? "bg-success text-success-content" : "bg-warning text-warning-content"}`}
        >
          {usableNow ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {PERKS.map((perk) => (
          <PerkCard
            key={`${perk.partnerId}:${perk.perkId}`}
            donor={address!}
            donationCount={parsed.donationCount}
            active={usableNow}
            partnerId={perk.partnerId}
            perkId={perk.perkId}
            title={perk.title}
            description={perk.description}
            minDonations={perk.minDonations}
          />
        ))}
      </div>
    </div>
  );
};

const PerkCard = (props: {
  donor: string;
  donationCount: number;
  active: boolean;
  partnerId: number;
  perkId: number;
  title: string;
  description: string;
  minDonations: number;
}) => {
  const unlocked = props.donationCount >= props.minDonations;

  const { data: redeemedRaw, isLoading } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "is_redeemed",
    args: [props.donor, props.partnerId, props.perkId],
    enabled: unlocked, // don’t waste calls for locked perks
    watch: false,
  });

  const redeemed = Boolean(redeemedRaw);

  let badge = "Locked";
  let badgeClass = "bg-base-200 text-base-content";

  if (unlocked && isLoading) {
    badge = "Checking…";
  } else if (unlocked && redeemed) {
    badge = "Redeemed ✅";
    badgeClass = "bg-success text-success-content";
  } else if (unlocked && !props.active) {
    badge = "Unlocked (inactive)";
    badgeClass = "bg-warning text-warning-content";
  } else if (unlocked) {
    badge = "Unlocked";
    badgeClass = "bg-primary text-primary-content";
  }

  return (
    <div className="border border-base-300 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{props.title}</p>
          <p className="text-sm opacity-80 mt-1">{props.description}</p>
          <p className="text-xs opacity-60 mt-2">
            Requires {props.minDonations}+ donations
          </p>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
};
