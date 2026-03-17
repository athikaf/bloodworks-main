"use client";

import { useMemo, useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

function isStarknetAddress(x: string) {
  const t = x.trim();
  return /^0x[0-9a-fA-F]{1,64}$/.test(t);
}

function parseU32(v: string): number | undefined {
  const n = Number(v.trim());
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

function roleLabel(r?: number) {
  switch (r) {
    case 0:
      return "DONOR";
    case 1:
      return "PARTNER";
    case 2:
      return "BLOODBANK";
    case 3:
      return "ADMIN";
    case 4:
      return "OPERATOR";
    default:
      return r === undefined ? "—" : `UNKNOWN (${r})`;
  }
}

export default function AdminOperatorsPage() {
  const [addrInput, setAddrInput] = useState("");
  const operator = useMemo(() => {
    const t = addrInput.trim();
    return isStarknetAddress(t) ? t : undefined;
  }, [addrInput]);

  const [pidInput, setPidInput] = useState("");
  const partnerId = useMemo(() => parseU32(pidInput), [pidInput]);

  // READS
  const roleRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: operator ? [operator] : undefined,
    enabled: !!operator,
  });

  const partnerRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_operator_partner_id",
    args: operator ? [operator] : undefined,
    enabled: !!operator,
  });

  const enabledRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "is_operator_enabled",
    args: operator ? [operator] : undefined,
    enabled: !!operator,
  });

  const role = useMemo(() => {
    try {
      return Number(roleRead.data);
    } catch {
      return undefined;
    }
  }, [roleRead.data]);

  const operatorPartnerId = useMemo(() => {
    try {
      return Number(partnerRead.data);
    } catch {
      return undefined;
    }
  }, [partnerRead.data]);

  const operatorEnabled = useMemo(() => {
    const raw = enabledRead.data;
    if (raw === true) return true;
    if (raw === false) return false;
    if (typeof raw === "bigint") return raw === 1n;
    return undefined;
  }, [enabledRead.data]);

  // WRITES
  const { sendAsync: setOperatorTx, isPending: setting } =
    useScaffoldWriteContract({
      contractName: "RoleRegistry",
      functionName: "set_operator",
      args: [],
    });

  const { sendAsync: enableTx, isPending: enabling } = useScaffoldWriteContract(
    {
      contractName: "RoleRegistry",
      functionName: "enable_operator",
      args: [],
    },
  );

  const { sendAsync: disableTx, isPending: disabling } =
    useScaffoldWriteContract({
      contractName: "RoleRegistry",
      functionName: "disable_operator",
      args: [],
    });

  const [toast, setToast] = useState<string | null>(null);

  async function assignOperator() {
    if (!operator || !partnerId) {
      setToast("Enter valid operator + partnerId.");
      return;
    }

    try {
      const tx = await setOperatorTx({ args: [operator, partnerId] });
      setToast(tx ? `Operator assigned tx=${tx}` : "Submitted.");
    } catch (e: any) {
      setToast(String(e?.message ?? e));
    }
  }

  async function enableOperator() {
    if (!operator) return;

    try {
      const tx = await enableTx({ args: [operator] });
      setToast(tx ? `Enabled tx=${tx}` : "Enable submitted.");
    } catch (e: any) {
      setToast(String(e?.message ?? e));
    }
  }

  async function disableOperator() {
    if (!operator) return;

    try {
      const tx = await disableTx({ args: [operator] });
      setToast(tx ? `Disabled tx=${tx}` : "Disable submitted.");
    } catch (e: any) {
      setToast(String(e?.message ?? e));
    }
  }

  const loading =
    roleRead.isLoading || partnerRead.isLoading || enabledRead.isLoading;

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Operators</h1>
        <p className="text-sm opacity-70">
          Assign operators to partners and manage enable/disable state.
        </p>
      </div>

      {toast && (
        <div className="alert alert-info">
          <span className="text-sm break-all text-white">{toast}</span>
        </div>
      )}

      {/* Operator lookup */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
        <div className="font-semibold">Operator wallet</div>

        <input
          className="input input-bordered m-2 w-full font-mono"
          placeholder="0x... operator wallet"
          value={addrInput}
          onChange={(e) => setAddrInput(e.target.value)}
        />

        {!operator ? (
          <p className="text-xs opacity-60">Enter operator address.</p>
        ) : loading ? (
          <p className="text-xs opacity-70">Reading operator state…</p>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-2 py-1 border rounded">
              role: <span className="font-mono">{roleLabel(role)}</span>
            </div>

            <div className="px-2 py-1 border rounded">
              partnerId:{" "}
              <span className="font-mono">{operatorPartnerId ?? "—"}</span>
            </div>

            <div className="text-xs">
              Status:{" "}
              {operatorEnabled === undefined ? (
                <span className="badge badge-ghost">Loading</span>
              ) : operatorEnabled ? (
                <span className="badge badge-success">Enabled</span>
              ) : (
                <span className="badge badge-warning">Disabled</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign operator */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
        <div className="font-semibold">Assign operator to partner</div>

        <input
          className="input input-bordered font-mono m-4"
          placeholder="partnerId (e.g. 1)"
          value={pidInput}
          onChange={(e) => setPidInput(e.target.value)}
        />

        <button
          className="btn btn-primary"
          disabled={!operator || !partnerId || setting}
          onClick={assignOperator}
        >
          {setting ? "Assigning…" : "Assign Operator"}
        </button>

        <p className="text-xs opacity-60">
          This sets role=OPERATOR and binds operator → partnerId.
        </p>
      </div>

      {/* Enable / Disable */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
        <div className="font-semibold">Operator status</div>

        <div className="flex gap-2">
          <button
            className="btn btn-success"
            disabled={
              !operator ||
              enabling ||
              operatorEnabled === true || // already enabled
              operatorEnabled === undefined // still loading
            }
            onClick={enableOperator}
          >
            Enable
          </button>

          <button
            className="btn btn-error"
            disabled={
              !operator ||
              disabling ||
              operatorEnabled === false || // already disabled
              operatorEnabled === undefined
            }
            onClick={disableOperator}
          >
            Disable
          </button>
        </div>

        <p className="text-xs opacity-60">
          Operators must be enabled before redeeming perks.
        </p>
      </div>
    </div>
  );
}
