"use client";

import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function toBigIntSafe(x: unknown): bigint | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === "bigint") return x;
  try {
    // scaffold often returns bigint-compatible values; Number() would overflow for u64
    return BigInt(x as any);
  } catch {
    return undefined;
  }
}

export function usePartnerTotalRedemptions(partnerId?: number) {
  const enabled = typeof partnerId === "number" && partnerId > 0;

  const read = useScaffoldReadContract({
    contractName: "BloodworksCore", // ✅ your contractName
    functionName: "get_partner_total_redemptions",
    args: enabled ? [partnerId] : undefined,
    enabled,
    watch: true,
  });

  const value = useMemo(() => toBigIntSafe(read.data), [read.data]);

  return {
    totalRedemptions: value, // bigint | undefined
    isLoading: enabled ? read.isLoading : false,
    error: read.error,
    enabled,
  };
}
