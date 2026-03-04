"use client";

import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function toBool(x: any): boolean | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === "boolean") return x;
  if (typeof x === "bigint") return x === 1n;
  if (typeof x === "number") return x === 1;
  if (typeof x === "string") return x === "1" || x === "0x1";
  if (Array.isArray(x) && x.length > 0) return toBool(x[0]);
  return undefined;
}

export function usePerkEnabled(
  partnerId: number,
  perkId: number,
  enabled: boolean,
) {
  const existsRead = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "perk_exists",
    args: [partnerId, perkId],
    enabled,
    watch: true,
  });

  const enabledRead = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "perk_enabled",
    args: [partnerId, perkId],
    enabled,
    watch: true,
  });

  const perkExists = useMemo(() => toBool(existsRead.data), [existsRead.data]);
  const perkEnabled = useMemo(
    () => toBool(enabledRead.data),
    [enabledRead.data],
  );

  return {
    perkExists,
    perkEnabled,
    isLoading: existsRead.isLoading || enabledRead.isLoading,
    error: existsRead.error || enabledRead.error,
  };
}
