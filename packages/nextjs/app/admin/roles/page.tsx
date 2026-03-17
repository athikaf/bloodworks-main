"use client";

import { useMemo, useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const ROLE_DONOR = 0;
const ROLE_BLOODBANK = 2;
const ROLE_PLATFORM_ADMIN = 3;

function isStarknetAddress(x: string) {
  const t = x.trim();
  return /^0x[0-9a-fA-F]{1,64}$/.test(t);
}

function roleLabel(r?: number) {
  switch (r) {
    case 0:
      return "DONOR (0)";
    case 1:
      return "PARTNER (1)";
    case 2:
      return "BLOODBANK (2)";
    case 3:
      return "PLATFORM_ADMIN (3)";
    case 4:
      return "OPERATOR (4)";
    default:
      return r === undefined ? "—" : `UNKNOWN (${r})`;
  }
}

function fmtErr(e: any) {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  return String(e?.message ?? e);
}

export default function AdminRolesPage() {
  const [input, setInput] = useState("");
  const target = useMemo(() => {
    const t = input.trim();
    return isStarknetAddress(t) ? t : undefined;
  }, [input]);

  // ---- Lookup role ----
  const roleRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: target ? [target] : undefined,
    enabled: !!target,
    watch: false,
  });

  const roleNum = useMemo(() => {
    const raw = roleRead.data as any;
    if (raw === undefined || raw === null) return undefined;
    try {
      return Number(raw);
    } catch {
      return undefined;
    }
  }, [roleRead.data]);

  // ---- Write: set_role ----
  const { sendAsync: setRoleTx, isPending } = useScaffoldWriteContract({
    contractName: "RoleRegistry",
    functionName: "set_role",
    args: [], // override at call-time
  });

  const [toast, setToast] = useState<string | null>(null);

  async function setRole(role: number) {
    if (!target) {
      setToast("Enter a valid Starknet address.");
      return;
    }
    setToast(null);
    try {
      const txHash = await setRoleTx({ args: [target, role] });
      setToast(
        txHash ? `Role updated. tx=${txHash}` : "Role update submitted.",
      );
      // optionally refresh:
      roleRead.refetch?.();
    } catch (e: any) {
      setToast(`Error: ${fmtErr(e)}`);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Assign Roles</h1>
        <p className="text-sm opacity-70 mt-1">
          Admin-only. Use this for DONOR / BLOODBANK / PLATFORM_ADMIN.
          <br />
          Partners + Operators must be set via{" "}
          <span className="font-mono">set_partner</span> /{" "}
          <span className="font-mono">set_operator</span>.
        </p>
      </div>

      {toast ? (
        <div className="alert alert-info">
          <span className="text-sm break-all text-white">{toast}</span>
        </div>
      ) : null}

      {/* Address input */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
        <div className="font-semibold">Target address</div>

        <input
          className="input input-bordered m-2 w-full font-mono"
          placeholder="0x... address"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {!input.trim() ? (
          <p className="text-xs opacity-60">
            Enter an address to lookup + set role.
          </p>
        ) : !target ? (
          <p className="text-xs text-error">Invalid Starknet address.</p>
        ) : roleRead.isLoading ? (
          <p className="text-xs opacity-70">Reading current role…</p>
        ) : roleRead.error ? (
          <p className="text-xs text-error">
            Failed to read get_role. Check network + deployedContracts.ts.
          </p>
        ) : (
          <div className="text-sm">
            Current role:{" "}
            <span className="font-mono font-semibold">
              {roleLabel(roleNum)}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
        <div className="font-semibold">Set role</div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-outline"
            disabled={!target || isPending}
            onClick={() => setRole(ROLE_DONOR)}
          >
            Set DONOR
          </button>

          <button
            className="btn btn-sm btn-primary"
            disabled={!target || isPending}
            onClick={() => setRole(ROLE_BLOODBANK)}
          >
            Set BLOODBANK
          </button>

          <button
            className="btn btn-sm btn-warning"
            disabled={!target || isPending}
            onClick={() => setRole(ROLE_PLATFORM_ADMIN)}
          >
            Set PLATFORM_ADMIN
          </button>
        </div>

        <div className="text-xs opacity-70">
          Note: You cannot set PARTNER or OPERATOR from here. Use the Admin
          pages:
          <span className="font-mono"> /admin/partners</span> and{" "}
          <span className="font-mono"> /admin/operators</span>.
        </div>
      </div>
    </div>
  );
}
