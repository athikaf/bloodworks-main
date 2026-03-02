"use client";

import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function toBool(x: unknown): boolean | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === "boolean") return x;
  if (typeof x === "bigint") return x !== 0n;
  try {
    const n = Number(x as any);
    return Number.isFinite(n) ? n !== 0 : undefined;
  } catch {
    return undefined;
  }
}

function toU64Bigint(x: unknown): bigint | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === "bigint") return x;
  try {
    return BigInt(x as any);
  } catch {
    return undefined;
  }
}

export function usePerkOnchainStatus(partnerId?: number, perkId?: number) {
  const enabled = !!partnerId && partnerId > 0 && !!perkId && perkId > 0;

  const existsRead = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "perk_exists",
    args: enabled ? [partnerId!, perkId!] : undefined,
    enabled,
    watch: true,
  });

  const enabledRead = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "perk_enabled",
    args: enabled ? [partnerId!, perkId!] : undefined,
    enabled,
    watch: true,
  });

  const redemptionsRead = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_perk_total_redemptions",
    args: enabled ? [partnerId!, perkId!] : undefined,
    enabled,
    watch: true,
  });

  const perkExists = useMemo(() => toBool(existsRead.data), [existsRead.data]);
  const perkEnabled = useMemo(
    () => toBool(enabledRead.data),
    [enabledRead.data],
  );
  const totalRedemptions = useMemo(
    () => toU64Bigint(redemptionsRead.data),
    [redemptionsRead.data],
  );

  const isLoading =
    existsRead.isLoading || enabledRead.isLoading || redemptionsRead.isLoading;

  return {
    enabled,
    isLoading,
    perkExists,
    perkEnabled,
    totalRedemptions,
    error: existsRead.error ?? enabledRead.error ?? redemptionsRead.error,
  };
}
