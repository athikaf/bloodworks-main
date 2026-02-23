"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

export default function PartnerDashboardPage() {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const { data: partnerIdRaw, isLoading } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_partner_id",
    args: [address],
    enabled: isConnected,
    watch: false,
  });

  const partnerId = useMemo(() => {
    if (partnerIdRaw === undefined || partnerIdRaw === null) return undefined;
    try {
      return Number(partnerIdRaw);
    } catch {
      return undefined;
    }
  }, [partnerIdRaw]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Partner Dashboard</h1>
        <p className="text-sm opacity-70">
          Track perk redemptions and manage operators.
        </p>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base">Your Partner Identity</h2>

          {isLoading ? (
            <p>Loading partner details…</p>
          ) : (
            <div className="text-sm">
              <div className="flex gap-2">
                <span className="opacity-70">Partner ID:</span>
                <span className="font-semibold">{partnerId ?? "—"}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="opacity-70">Wallet:</span>
                <span className="font-mono break-all">{address ?? "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MVP Stats placeholders (we’ll hook to events/index later) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm opacity-70">Total Redemptions</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs opacity-60">Hook to on-chain events next.</p>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm opacity-70">Active Perks</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs opacity-60">Will read from PerksRegistry.</p>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm opacity-70">Operators</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs opacity-60">Will read operator count.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
