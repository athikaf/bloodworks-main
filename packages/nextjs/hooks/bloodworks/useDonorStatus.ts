"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function toBool(x: unknown): boolean | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === "boolean") return x;
  if (typeof x === "bigint") return x !== 0n;
  try {
    return Number(x as any) !== 0;
  } catch {
    return undefined;
  }
}

function toNum(x: unknown): number | undefined {
  if (x === undefined || x === null) return undefined;
  try {
    const n = Number(x as any);
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

/**
 * get_status returns: (issued, donation_count, last_donation_ts, cooldown_end_ts, active)
 */
export function useDonorStatus() {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const read = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_status",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: true,
  });

  const parsed = useMemo(() => {
    const d = read.data as any;
    if (!d) return undefined;

    // Support tuple arrays or object-like returns
    const issuedRaw = Array.isArray(d) ? d[0] : d.issued;
    const countRaw = Array.isArray(d) ? d[1] : d.donation_count;
    const lastRaw = Array.isArray(d) ? d[2] : d.last_donation_ts;
    const endRaw = Array.isArray(d) ? d[3] : d.cooldown_end_ts;
    const activeRaw = Array.isArray(d) ? d[4] : d.active;

    return {
      issued: toBool(issuedRaw),
      donationCount: toNum(countRaw) ?? 0,
      lastDonationTs: toNum(lastRaw) ?? 0,
      cooldownEndTs: toNum(endRaw) ?? 0,
      active: toBool(activeRaw),
    };
  }, [read.data]);

  return {
    address,
    isConnected,
    isLoading: isConnected ? read.isLoading : false,
    error: read.error,
    status: parsed,
  };
}
