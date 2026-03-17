"use client";

import { useMemo, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { isHex } from "starknet";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function isProbablyAddress(v: string): v is `0x${string}` {
  return v.startsWith("0x") && isHex(v) && v.length >= 4;
}

function safeNumber(input: unknown): number | undefined {
  if (input === null || input === undefined) return undefined;
  if (typeof input === "number") return input;
  if (typeof input === "bigint") return Number(input);
  if (Array.isArray(input) && input.length > 0) return safeNumber(input[0]);
  if (typeof input === "object" && input && "value" in (input as any))
    return safeNumber((input as any).value);
  return undefined;
}

export const PartnerOperatorsWorkbench = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const [operator, setOperator] = useState("");
  const [localOperators, setLocalOperators] = useState<string[]>([]);

  // Optional: partnerId for display
  const { data: partnerIdRaw } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_partner_id",
    args: address ? ([address] as const) : undefined,
    enabled: isConnected,
    watch: false,
  } as never);

  const partnerId = useMemo(() => safeNumber(partnerIdRaw), [partnerIdRaw]);

  const { sendAsync: addOperatorAsync, isPending: adding } =
    useScaffoldWriteContract({
      contractName: "RoleRegistry",
      functionName: "add_operator", // ✅ your function
    } as never);

  const { sendAsync: removeOperatorAsync, isPending: removing } =
    useScaffoldWriteContract({
      contractName: "RoleRegistry",
      functionName: "remove_operator", // ✅ your function
    } as never);

  const canAdd = isConnected && isProbablyAddress(operator);

  const onAdd = async () => {
    if (!canAdd) return;
    const op = operator as `0x${string}`;

    setLocalOperators((prev) => (prev.includes(op) ? prev : [op, ...prev]));
    setOperator("");

    try {
      await addOperatorAsync({ args: [op] as const } as never);
    } catch (e) {
      console.error("add_operator failed", e);
    }
  };

  const onRemove = async (op: string) => {
    setLocalOperators((prev) => prev.filter((x) => x !== op));
    try {
      await removeOperatorAsync({
        args: [op as `0x${string}`] as const,
      } as never);
    } catch (e) {
      console.error("remove_operator failed", e);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="card-title text-lg">Operators</h2>
            <p className="text-sm opacity-70">
              Operators are franchise wallets that can redeem perks on behalf of
              the partner.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Partner ID</p>
            <p className="text-lg font-semibold">{partnerId ?? "—"}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input input-bordered m-2 w-full"
            placeholder="Operator wallet address (0x...)"
            value={operator}
            onChange={(e) => setOperator(e.target.value.trim())}
          />
          <button
            className="btn btn-primary"
            disabled={!canAdd || adding}
            onClick={onAdd}
          >
            {adding ? "Adding…" : "Add Operator"}
          </button>
        </div>

        {!isProbablyAddress(operator) && operator.length > 0 ? (
          <p className="text-xs text-error">Invalid address format.</p>
        ) : null}

        <div className="divider my-0" />

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Current Operators (MVP list)</h3>
          {localOperators.length === 0 ? (
            <p className="text-sm opacity-70">No operators added yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {localOperators.map((op) => (
                <div
                  key={op}
                  className="flex items-center justify-between gap-3 bg-base-200 rounded-lg px-3 py-2"
                >
                  <code className="text-xs break-all">{op}</code>
                  <button
                    className="btn btn-xs btn-outline"
                    disabled={removing}
                    onClick={() => onRemove(op)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs opacity-60 mt-2">
            MVP uses local list. Later we’ll read operator lists onchain / via
            indexer.
          </p>
        </div>
      </div>
    </div>
  );
};
