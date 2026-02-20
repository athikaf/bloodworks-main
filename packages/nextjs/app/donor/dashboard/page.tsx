"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

import { DonorStatusCard } from "~~/components/bloodworks/donor/DonorStatusCard";
import { NextActionCard } from "~~/components/bloodworks/donor/NextActionCard";
import { PerksGrid } from "~~/components/bloodworks/donor/PerksGrid";
import {
  ActivityPanel,
  ActivityItem,
} from "~~/components/bloodworks/donor/ActivityPanel";

export default function DonorDashboardPage() {
  const { address, status } = useAccount();
  const donor = status === "connected" ? address : undefined;

  // Pull donor status from BloodworksCore
  const {
    data: statusTuple,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_status",
    args: [donor],
    enabled: !!donor,
    watch: false,
  });

  /**
   * get_status returns:
   * (issued: bool, donation_count: u32, last_donation_ts: u64, cooldown_end_ts: u64, active: bool)
   */
  const parsed = useMemo(() => {
    if (!statusTuple) return undefined;

    const issued = Boolean((statusTuple as any)[0]);
    const donationCount = Number((statusTuple as any)[1] ?? 0);
    const lastDonationTs = Number((statusTuple as any)[2] ?? 0);
    const cooldownEndTs = Number((statusTuple as any)[3] ?? 0);
    const isActive = Boolean((statusTuple as any)[4]);

    return { issued, donationCount, lastDonationTs, cooldownEndTs, isActive };
  }, [statusTuple]);

  // MVP activity list: derived locally from status (later: index events)
  const activityItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    if (!parsed) return items;

    if (parsed.issued) {
      items.push({
        id: "issued",
        title: "Donor credential issued",
        subtitle: "You’re now recognized as a Bloodworks donor.",
        tsLabel: "—",
      });
    }

    if (parsed.donationCount > 0) {
      items.push({
        id: "donation",
        title: "Donation recorded",
        subtitle: `Total donations: ${parsed.donationCount}`,
        tsLabel: parsed.lastDonationTs ? "On-chain" : "—",
      });
    }

    if (parsed.cooldownEndTs > 0) {
      items.push({
        id: "cooldown",
        title: "Cooldown updated",
        subtitle: parsed.isActive
          ? "Credential active (redeem perks)"
          : "Cooldown running (come back soon)",
        tsLabel: "On-chain",
      });
    }

    return items;
  }, [parsed]);

  if (!donor) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="opacity-70 mt-2">
          Connect your wallet to view your dashboard.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-error mt-2">
          Error reading donor status. Check deployedContracts.ts + network.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* 2) Status card */}
      <DonorStatusCard isLoading={isLoading} status={parsed} />

      {/* 3) Next action card */}
      <NextActionCard isLoading={isLoading} status={parsed} />

      {/* 7) Activity panel (inside dashboard) */}
      <ActivityPanel items={activityItems} />
    </div>
  );
}
