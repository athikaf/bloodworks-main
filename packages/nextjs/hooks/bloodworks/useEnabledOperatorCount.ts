"use client";

import { useEffect, useMemo, useState } from "react";
import { Contract } from "starknet";
import { useProvider } from "@starknet-react/core";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";

function norm(a: string) {
  return a.trim().toLowerCase();
}

function parseBoolReturn(x: any): boolean {
  if (x === true) return true;
  if (x === false) return false;

  if (typeof x === "bigint") return x === 1n;
  if (typeof x === "number") return x === 1;
  if (typeof x === "string")
    return x === "1" || x === "0x1" || x.toLowerCase() === "true";

  if (Array.isArray(x) && x.length > 0) return parseBoolReturn(x[0]);

  if (typeof x === "object" && x) {
    if ("enabled" in x) return Boolean((x as any).enabled);
    if ("res" in x) return Boolean((x as any).res);
    if (0 in (x as any)) return Boolean((x as any)[0]);
  }

  return false;
}

async function readIsEnabled(contract: any, addr: string) {
  try {
    return await contract.call("is_operator_enabled", [addr]);
  } catch (e1) {
    // fallback to named args (ABI-dependent)
    try {
      return await contract.call("is_operator_enabled", { operator: addr });
    } catch (e2) {
      throw e2 ?? e1;
    }
  }
}

export function useEnabledOperatorCount(
  addresses: string[],
  opts?: { pollMs?: number },
) {
  const pollMs = opts?.pollMs ?? 5000;

  const { provider } = useProvider();
  const { data: rr } = useDeployedContractInfo("RoleRegistry");

  const [enabledCount, setEnabledCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniq = useMemo(() => {
    const s = new Set(addresses.map(norm).filter(Boolean));
    return Array.from(s);
  }, [addresses]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // don’t throw scary errors while booting
      if (!provider || !rr?.abi || !rr?.address) return;

      if (uniq.length === 0) {
        setEnabledCount(0);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // ✅ YOUR starknet.js typing: Contract(abi, provider)
        const contract = new Contract(rr.abi as any, rr.address, provider);
        // ✅ attach address
        contract.address = rr.address;

        const results = await Promise.all(
          uniq.map(async (addr) => {
            const res = await readIsEnabled(contract, addr);
            return parseBoolReturn(res);
          }),
        );

        if (!cancelled) setEnabledCount(results.filter(Boolean).length);
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.message ??
            e?.toString?.() ??
            "Unknown error calling is_operator_enabled";
          setError(String(msg));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    const interval = setInterval(run, pollMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [provider, rr?.abi, rr?.address, uniq, pollMs]); // ✅ include uniq properly

  return { enabledCount, isLoading, error };
}
