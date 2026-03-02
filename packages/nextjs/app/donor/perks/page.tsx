"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { PerksGrid } from "~~/components/bloodworks/donor/PerksGrid";

export default function DonorPerksPage() {
  const { address, status } = useAccount();
  const donor = status === "connected" ? address : undefined;
  const enabled = status === "connected" && !!donor;

  const {
    data: statusRaw,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_status",
    args: donor ? [donor] : undefined, // ✅ safer
    enabled,
    watch: false, // keep false for now (optional)
  });

  const donationCount = useMemo(() => {
    if (!statusRaw) return 0;
    const rawDonation = (statusRaw as any)[1];
    try {
      return Number(rawDonation ?? 0);
    } catch {
      return 0;
    }
  }, [statusRaw]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Perks</h1>
      <p className="text-sm opacity-70 mt-0">
        Your perks unlock as your donation count increases.
      </p>

      {!enabled ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm">Connect your wallet to view your perks.</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm">Loading your donation status…</p>
          </div>
        </div>
      ) : error ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm text-error">
              Couldn’t read status from BloodworksCore. Check network +
              deployedContracts.ts.
            </p>
          </div>
        </div>
      ) : (
        <PerksGrid donationCount={donationCount} />
      )}
    </div>
  );
}
