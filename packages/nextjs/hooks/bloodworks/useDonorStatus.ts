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

export type DonorStatusParsed = {
  issued?: boolean;
  donationCount: number;
  lastDonationTs: number;
  cooldownEndTs: number;
  active?: boolean;
};

/**
 * Generic: read status for ANY donor address (operator redeem uses this)
 * get_status returns: (issued, donation_count, last_donation_ts, cooldown_end_ts, active)
 */
export function useDonorStatusByAddress(donor?: string) {
  const enabled = !!donor;

  const read = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_status",
    args: donor ? [donor] : undefined,
    enabled,
    watch: true,
  });

  const parsed = useMemo<DonorStatusParsed | undefined>(() => {
    const d = read.data as any;
    if (!d) return undefined;

    const getAt = (idx: number, named?: string[]) => {
      // 1) array tuple
      if (Array.isArray(d)) return d[idx];

      // 2) object tuple with numeric keys
      if (typeof d === "object") {
        if (idx in d) return d[idx];
        const k = String(idx);
        if (k in d) return d[k];

        // 3) object with named keys (ABI-dependent)
        if (named) {
          for (const name of named) {
            if (name in d) return d[name];
          }
        }
      }

      return undefined;
    };

    const issuedRaw = getAt(0, ["issued", "issued_", "is_issued"]);
    const countRaw = getAt(1, [
      "donation_count",
      "donationCount",
      "count",
      "count_",
    ]);
    const lastRaw = getAt(2, ["last_donation_ts", "lastDonationTs", "last_"]);
    const endRaw = getAt(3, [
      "cooldown_end_ts",
      "cooldownEndTs",
      "end_",
      "cooldown_",
    ]);
    const activeRaw = getAt(4, ["active", "is_active", "isActive", "active_"]);

    return {
      issued: toBool(issuedRaw),
      donationCount: toNum(countRaw) ?? 0,
      lastDonationTs: toNum(lastRaw) ?? 0,
      cooldownEndTs: toNum(endRaw) ?? 0,
      active: toBool(activeRaw),
    };
  }, [read.data]);

  return {
    donor,
    enabled,
    isLoading: enabled ? read.isLoading : false,
    error: read.error,
    status: parsed,
  };
}

/**
 * Wrapper: preserves your existing behavior/API for the connected wallet.
 * This keeps donor dashboard etc. unchanged.
 */
export function useDonorStatus() {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const byAddr = useDonorStatusByAddress(isConnected ? address : undefined);

  return {
    address,
    isConnected,
    isLoading: isConnected ? byAddr.isLoading : false,
    error: byAddr.error,
    status: byAddr.status,
  };
}
