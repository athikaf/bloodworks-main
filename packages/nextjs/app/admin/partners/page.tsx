"use client";

import { useMemo, useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

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

function parseU32(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  // u32 safe range in JS (fits in number)
  if (!Number.isInteger(n) || n <= 0) return undefined;
  if (n > 0xffffffff) return undefined;
  return n;
}

export default function AdminPartnersPage() {
  const [addrInput, setAddrInput] = useState("");
  const target = useMemo(() => {
    const t = addrInput.trim();
    return isStarknetAddress(t) ? t : undefined;
  }, [addrInput]);

  const [pidInput, setPidInput] = useState("");
  const partnerId = useMemo(() => parseU32(pidInput), [pidInput]);

  // Reads
  const roleRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: target ? [target] : undefined,
    enabled: !!target,
    watch: false,
  });

  const partnerIdRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_partner_id",
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

  const existingPid = useMemo(() => {
    const raw = partnerIdRead.data as any;
    if (raw === undefined || raw === null) return undefined;
    try {
      return Number(raw);
    } catch {
      return undefined;
    }
  }, [partnerIdRead.data]);

  // Write
  const { sendAsync: setPartnerTx, isPending } = useScaffoldWriteContract({
    contractName: "RoleRegistry",
    functionName: "set_partner",
    args: [], // override at call-time
  });

  const [toast, setToast] = useState<string | null>(null);

  async function assignPartner() {
    if (!target) {
      setToast("Enter a valid Starknet address.");
      return;
    }
    if (!partnerId) {
      setToast("Enter a valid partnerId (> 0).");
      return;
    }

    setToast(null);
    try {
      const txHash = await setPartnerTx({ args: [target, partnerId] });
      setToast(
        txHash
          ? `Partner assigned. tx=${txHash}`
          : "Partner assignment submitted.",
      );
      // Optional: trigger a manual refresh if your wrapper exposes refetch.
      roleRead.refetch?.();
      partnerIdRead.refetch?.();
    } catch (e: any) {
      setToast(`Error: ${fmtErr(e)}`);
    }
  }

  const loading = roleRead.isLoading || partnerIdRead.isLoading;
  const readError = roleRead.error || partnerIdRead.error;

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Assign Partner</h1>
        <p className="text-sm opacity-70 mt-1">
          Admin-only. This calls <span className="font-mono">set_partner</span>{" "}
          which sets role=PARTNER and writes partnerId on-chain.
        </p>
      </div>

      {toast ? (
        <div className="alert alert-info">
          <span className="text-sm break-all">{toast}</span>
        </div>
      ) : null}

      {/* Target */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
        <div className="font-semibold">Partner wallet address</div>

        <input
          className="input input-bordered w-full font-mono"
          placeholder="0x... partner wallet address"
          value={addrInput}
          onChange={(e) => setAddrInput(e.target.value)}
        />

        {!addrInput.trim() ? (
          <p className="text-xs opacity-60">
            Enter a wallet address to lookup and assign.
          </p>
        ) : !target ? (
          <p className="text-xs text-error">Invalid Starknet address.</p>
        ) : loading ? (
          <p className="text-xs opacity-70">Reading current state…</p>
        ) : readError ? (
          <p className="text-xs text-error">
            Failed to read RoleRegistry. Check network + deployedContracts.ts.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-2 py-1 rounded-md border border-base-300 bg-base-100">
              role: <span className="font-mono">{roleLabel(roleNum)}</span>
            </div>
            <div className="px-2 py-1 rounded-md border border-base-300 bg-base-100">
              partnerId:{" "}
              <span className="font-mono">
                {existingPid === undefined ? "—" : String(existingPid)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Assign */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
        <div className="font-semibold">Assign partnerId</div>

        <label className="form-control">
          <div className="label">
            <span className="label-text">partnerId (u32, &gt; 0)</span>
          </div>
          <input
            className="input input-bordered font-mono"
            placeholder="e.g. 1"
            value={pidInput}
            onChange={(e) => setPidInput(e.target.value)}
          />
        </label>

        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            disabled={!target || !partnerId || isPending}
            onClick={assignPartner}
          >
            {isPending ? "Assigning…" : "Assign partner"}
          </button>

          <button
            className="btn btn-outline"
            disabled={isPending}
            onClick={() => {
              setAddrInput("");
              setPidInput("");
              setToast(null);
            }}
          >
            Reset
          </button>
        </div>

        <div className="text-xs opacity-70">
          Note: Your contract enforces{" "}
          <span className="font-mono">partnerId != 0</span>. Partners can later
          manage their own operators, but cannot change their partnerId without
          admin.
        </div>
      </div>
    </div>
  );
}
