"use client";

import { useMemo, useState } from "react";
import { usePartnerContext } from "~~/hooks/bloodworks/usePartnerContext";
import { usePartnerOperators } from "~~/hooks/bloodworks/usePartnerOperators";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

function formatAddr(a: string) {
  const t = a.trim();
  if (t.length < 12) return t;
  return `${t.slice(0, 8)}…${t.slice(-6)}`;
}

function parseU32(x: any): number | undefined {
  if (x === undefined || x === null) return undefined;
  try {
    const n = Number(x);
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

function parseBool(x: any): boolean | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === "boolean") return x;
  if (typeof x === "bigint") return x === 1n;
  if (typeof x === "number") return x === 1;
  if (typeof x === "string")
    return x === "1" || x === "0x1" || x.toLowerCase() === "true";
  return undefined;
}

function OperatorRow({
  partnerId,
  address,
  label,
  onRemove,
}: {
  partnerId: number;
  address: string;
  label?: string;
  onRemove: (addr: string) => void;
}) {
  const enabled = !!address;

  const opPid = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_operator_partner_id",
    args: enabled ? [address] : undefined,
    enabled,
    watch: true,
  });

  const opEnabled = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "is_operator_enabled",
    args: enabled ? [address] : undefined,
    enabled,
    watch: true,
  });

  const boundPartnerId = useMemo(() => parseU32(opPid.data), [opPid.data]);
  const isEnabled = useMemo(() => parseBool(opEnabled.data), [opEnabled.data]);

  const { sendAsync: setOperatorTx, isPending: isAssigning } =
    useScaffoldWriteContract({
      contractName: "RoleRegistry",
      functionName: "set_operator",
      args: [],
    });

  const { sendAsync: enableTx, isPending: isEnabling } =
    useScaffoldWriteContract({
      contractName: "RoleRegistry",
      functionName: "enable_operator",
      args: [],
    });

  const { sendAsync: disableTx, isPending: isDisabling } =
    useScaffoldWriteContract({
      contractName: "RoleRegistry",
      functionName: "disable_operator",
      args: [],
    });

  const busy = isAssigning || isEnabling || isDisabling;

  const isBoundToMe = boundPartnerId === partnerId;
  const isBoundSomewhere = !!boundPartnerId && boundPartnerId > 0;

  return (
    <div className="border border-base-300 bg-base-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-sm">{formatAddr(address)}</div>
          <div className="text-xs opacity-70">{label || "—"}</div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="badge badge-ghost">
              boundPid: {boundPartnerId ?? "—"}
            </span>
            <span className="badge badge-ghost">
              enabled:{" "}
              {isEnabled === undefined ? "—" : isEnabled ? "true" : "false"}
            </span>

            {isBoundSomewhere && !isBoundToMe ? (
              <span className="badge badge-warning">
                Bound to another partner
              </span>
            ) : null}

            {isBoundToMe ? (
              <span className="badge badge-success">Your operator</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {!isBoundSomewhere ? (
            <button
              className="btn btn-sm btn-primary"
              disabled={busy}
              onClick={() => setOperatorTx({ args: [address, partnerId] })}
            >
              {isAssigning ? "Assigning…" : "Assign operator"}
            </button>
          ) : null}

          {isBoundToMe ? (
            <>
              <button
                className="btn btn-sm btn-primary"
                disabled={busy || isEnabled === true}
                onClick={() => enableTx({ args: [address] })}
              >
                {isEnabling ? "Enabling…" : isEnabled ? "Enabled" : "Enable"}
              </button>

              <button
                className="btn btn-sm btn-outline"
                disabled={busy || isEnabled === false}
                onClick={() => disableTx({ args: [address] })}
              >
                {isDisabling
                  ? "Disabling…"
                  : isEnabled === false
                    ? "Disabled"
                    : "Disable"}
              </button>
            </>
          ) : null}

          <button
            className="btn btn-xs btn-ghost"
            onClick={() => onRemove(address)}
            disabled={busy}
          >
            Remove from list
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs opacity-60">
        Note: binding is permanent (operator can only be assigned once).
        Enable/disable is reversible.
      </div>
    </div>
  );
}

export default function PartnerOperatorsPage() {
  const ctx = usePartnerContext();
  const partnerId = ctx.partnerId ?? 0;

  const { operators, loading, err, refresh, add, remove } =
    usePartnerOperators(partnerId);

  const [addr, setAddr] = useState("");
  const [label, setLabel] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const a = addr.trim();
    if (!a) return setToast("Enter an operator address.");
    setSaving(true);
    setToast(null);
    try {
      const res = await add(a, label.trim());
      if (!res?.ok) throw new Error(res?.error ?? "Failed to add operator");
      setAddr("");
      setLabel("");
      setToast("Operator added to list. Now assign on-chain.");
    } catch (e: any) {
      setToast(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (a: string) => {
    try {
      await remove(a);
      setToast("Removed from list.");
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Operators</h1>
          <div className="text-sm opacity-70">
            Manage operators for your partnerId. Assignment and enable/disable
            are on-chain.
          </div>
        </div>

        <button className="btn btn-sm btn-outline" onClick={refresh}>
          Refresh
        </button>
      </div>

      {toast ? (
        <div className="alert alert-info">
          <span className="text-sm">{toast}</span>
        </div>
      ) : null}

      {/* Add operator form */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4">
        <div className="font-semibold mb-3">Add operator</div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="form-control md:col-span-2">
            <div className="label">
              <span className="label-text">Operator address</span>
            </div>
            <input
              className="input input-bordered font-mono"
              placeholder="0x..."
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Label (optional)</span>
            </div>
            <input
              className="input input-bordered"
              placeholder="Downtown cashier"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="btn btn-primary"
            disabled={saving || !partnerId}
            onClick={submit}
          >
            {saving ? "Saving…" : "Add to list"}
          </button>
          <button
            className="btn btn-outline"
            disabled={saving}
            onClick={() => {
              setAddr("");
              setLabel("");
            }}
          >
            Reset
          </button>
        </div>

        <div className="mt-2 text-xs opacity-70">
          Phase 1 uses a lightweight JSON list for display. On-chain state is
          still the source of truth.
        </div>
      </div>

      {/* Operator list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Existing operators</div>
          <div className="text-xs opacity-70">
            {loading
              ? "Loading…"
              : err
                ? `Error: ${err}`
                : `${operators.length} operators`}
          </div>
        </div>

        {operators.length === 0 ? (
          <div className="border border-base-300 bg-base-100 rounded-lg p-4 text-sm opacity-70">
            No operators added yet.
          </div>
        ) : (
          operators.map((o) => (
            <OperatorRow
              key={o.address}
              partnerId={partnerId}
              address={o.address}
              label={o.label}
              onRemove={removeRow}
            />
          ))
        )}
      </div>
    </div>
  );
}
