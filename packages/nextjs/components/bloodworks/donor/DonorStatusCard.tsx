"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const formatTs = (ts?: bigint) => {
  if (!ts || ts === 0n) return "—";
  // Starknet block timestamps are seconds
  const ms = Number(ts) * 1000;
  const d = new Date(ms);
  return d.toLocaleString();
};

export const DonorStatusCard = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  // get_status returns: (issued, donation_count, last_donation_ts, cooldown_end_ts, active)
  const { data, isLoading, error } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_status",
    args: [address],
    enabled: isConnected,
    watch: false,
  });

  const parsed = useMemo(() => {
    if (!data) return null;

    // Depending on scaffold version, tuples may come as arrays.
    // We’ll handle the common “array tuple” form.
    const arr = data as unknown as [any, any, any, any, any];

    const issued = Boolean(arr[0]);
    const donationCount = Number(arr[1] ?? 0);
    const lastDonationTs = BigInt(arr[2] ?? 0);
    const cooldownEndTs = BigInt(arr[3] ?? 0);
    const active = Boolean(arr[4]);

    return { issued, donationCount, lastDonationTs, cooldownEndTs, active };
  }, [data]);

  return (
    <div className="w-full max-w-xl bg-base-100 rounded-2xl border border-base-300 p-5">
      <h2 className="text-lg font-bold">Your donor status</h2>

      {!isConnected && (
        <p className="mt-3 text-sm opacity-80">
          Connect your wallet to see your status.
        </p>
      )}

      {isConnected && isLoading && (
        <p className="mt-3 text-sm opacity-80">Loading status…</p>
      )}

      {isConnected && error && (
        <p className="mt-3 text-sm text-error">
          Couldn’t read your status from the contract. Check network + deployed
          contracts.
        </p>
      )}

      {isConnected && !isLoading && !error && parsed && (
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="opacity-80">Credential issued</span>
            <span className="font-semibold">
              {parsed.issued ? "Yes" : "No"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-80">Donation count</span>
            <span className="font-semibold">{parsed.donationCount}</span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-80">Active right now</span>
            <span className="font-semibold">
              {parsed.active ? "Yes" : "No"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-80">Last donation</span>
            <span className="font-semibold">
              {formatTs(parsed.lastDonationTs)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-80">Cooldown ends</span>
            <span className="font-semibold">
              {formatTs(parsed.cooldownEndTs)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
