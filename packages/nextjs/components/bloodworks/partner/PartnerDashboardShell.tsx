"use client";

import { useMemo } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const ROLE_LABEL: Record<number, string> = {
  0: "donor",
  1: "partner",
  2: "bloodbank",
  3: "bloodworks",
  4: "partner_operator", // adjust if needed
};

function safeNumber(input: unknown): number | undefined {
  if (input === null || input === undefined) return undefined;
  if (typeof input === "number") return input;
  if (typeof input === "bigint") return Number(input);
  if (Array.isArray(input) && input.length > 0) return safeNumber(input[0]);
  if (typeof input === "object" && input && "value" in (input as any))
    return safeNumber((input as any).value);
  return undefined;
}

export const PartnerDashboardShell = () => {
  const { address, status } = useAccount();
  const { chain } = useNetwork();
  const isConnected = status === "connected" && !!address;

  // Read role
  const { data: roleRaw, isLoading: roleLoading } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: address ? ([address] as const) : undefined,
    enabled: isConnected,
    watch: false,
  } as never);

  const roleNum = useMemo(() => safeNumber(roleRaw), [roleRaw]);
  const roleLabel = roleNum !== undefined ? ROLE_LABEL[roleNum] : undefined;

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6">
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body gap-3">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h2 className="card-title text-xl">Partner Dashboard</h2>
              <p className="text-sm opacity-70">
                Manage perks and operators. Track real-world impact.
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-xs opacity-70">
                {chain?.name ?? "Unknown network"}
              </span>
              {isConnected && (
                <code className="text-xs bg-base-200 px-2 py-1 rounded break-all">
                  {address}
                </code>
              )}
            </div>
          </div>

          <div className="divider my-2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <p className="text-xs opacity-70">Role</p>
                {roleLoading ? (
                  <p className="text-sm">Loading…</p>
                ) : (
                  <p className="text-lg font-semibold">
                    {roleLabel ?? "unknown"}
                  </p>
                )}
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <p className="text-xs opacity-70">Perks Redeemed (6 months)</p>
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs opacity-60">
                  Wire later: from events / counts.
                </p>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <p className="text-xs opacity-70">Impact Rank (partners)</p>
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs opacity-60">
                  Wire later: leaderboard view.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 text-sm opacity-70">
            Next: go to <span className="font-semibold">Perks</span> to add
            rewards or <span className="font-semibold">Operators</span> to add
            franchises.
          </div>
        </div>
      </div>
    </div>
  );
};
