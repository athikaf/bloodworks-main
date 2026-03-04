"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { PerksGrid } from "~~/components/bloodworks/donor/PerksGrid";

function toBool(x: any): boolean {
  if (x === undefined || x === null) return false;
  if (typeof x === "boolean") return x;
  if (typeof x === "bigint") return x === 1n;
  if (typeof x === "number") return x === 1;
  if (typeof x === "string") return x === "1" || x === "0x1";
  return false;
}

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
    args: donor ? [donor] : undefined,
    enabled,
    watch: false,
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

  const isActive = useMemo(() => {
    if (!statusRaw) return false;
    const rawActive = (statusRaw as any)[4];
    return toBool(rawActive);
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
        <PerksGrid donationCount={donationCount} isActive={isActive} />
      )}
    </div>
  );
}
