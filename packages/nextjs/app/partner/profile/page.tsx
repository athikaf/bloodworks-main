"use client";

import { useMemo } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

export default function PartnerProfilePage() {
  const { address, status } = useAccount();
  const { chain } = useNetwork();
  const isConnected = status === "connected" && !!address;

  const contractName = "RoleRegistry" as const;
  const functionName = "get_role" as const;

  const { data: roleRaw, isLoading } = useScaffoldReadContract({
    contractName,
    functionName,
    // ✅ tuple args; enabled ensures we don't actually run when address is undefined
    args: [address] as const,
    enabled: isConnected,
    watch: false,
  } as any); // <- keeps TS from collapsing config to `never` in your setup

  const roleNum = useMemo(() => {
    if (roleRaw === undefined || roleRaw === null) return undefined;
    try {
      return Number(roleRaw);
    } catch {
      return undefined;
    }
  }, [roleRaw]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base">Connected Account</h2>

          <div className="text-sm mt-2">
            <div className="flex gap-2">
              <span className="opacity-70">Wallet:</span>
              <span className="font-mono break-all">{address ?? "—"}</span>
            </div>

            <div className="flex gap-2 mt-1">
              <span className="opacity-70">Role:</span>
              <span className="font-semibold">{roleNum ?? "—"}</span>
            </div>

            <div className="flex gap-2 mt-1">
              <span className="opacity-70">Network:</span>
              <span className="font-semibold">{chain?.name ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
