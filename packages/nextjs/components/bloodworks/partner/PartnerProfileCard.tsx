"use client";

import { useMemo } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const ROLE_LABEL: Record<number, string> = {
  0: "donor",
  1: "partner_admin",
  2: "bloodbank",
  3: "platform_admin",
  4: "partner_operator",
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

export const PartnerProfileCard = () => {
  const { address, status } = useAccount();
  const { chain } = useNetwork();
  const isConnected = status === "connected" && !!address;

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
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="card-title text-lg">Partner Profile</h2>
            <p className="text-sm opacity-70">
              Wallet, role, and network info.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Network</p>
            <p className="text-sm font-semibold">{chain?.name ?? "Unknown"}</p>
          </div>
        </div>

        <div className="divider my-2" />

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm opacity-70">Wallet</p>
            <code className="text-xs bg-base-200 px-2 py-1 rounded break-all">
              {address ?? "—"}
            </code>
          </div>

          <div className="flex items-start justify-between gap-3">
            <p className="text-sm opacity-70">Role</p>
            {roleLoading ? (
              <p className="text-sm">Loading…</p>
            ) : (
              <span className="badge badge-ghost">
                {roleLabel ?? "unknown"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
