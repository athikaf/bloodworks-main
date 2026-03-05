"use client";

import { useMemo, useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function isStarknetAddress(x: string) {
  return /^0x[0-9a-fA-F]{1,64}$/.test(x.trim());
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
      return "PLATFORM_ADMIN";
    case 4:
      return "OPERATOR";
    default:
      return r === undefined ? "—" : `UNKNOWN (${r})`;
  }
}

export function AddressInspector() {
  const [input, setInput] = useState("");

  const addr = useMemo(() => {
    const t = input.trim();
    return isStarknetAddress(t) ? t : undefined;
  }, [input]);

  const roleRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: addr ? [addr] : undefined,
    enabled: !!addr,
  });

  const partnerRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_partner_id",
    args: addr ? [addr] : undefined,
    enabled: !!addr,
  });

  const operatorPartnerRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_operator_partner_id",
    args: addr ? [addr] : undefined,
    enabled: !!addr,
  });

  const operatorEnabledRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "is_operator_enabled",
    args: addr ? [addr] : undefined,
    enabled: !!addr,
  });

  const role = useMemo(() => {
    try {
      return Number(roleRead.data);
    } catch {
      return undefined;
    }
  }, [roleRead.data]);

  const partnerId = useMemo(() => {
    try {
      return Number(partnerRead.data);
    } catch {
      return undefined;
    }
  }, [partnerRead.data]);

  const operatorPartnerId = useMemo(() => {
    try {
      return Number(operatorPartnerRead.data);
    } catch {
      return undefined;
    }
  }, [operatorPartnerRead.data]);

  const operatorEnabled = operatorEnabledRead.data;

  return (
    <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
      <div className="font-semibold">Address Inspector</div>

      <input
        className="input input-bordered w-full font-mono"
        placeholder="Paste wallet address..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {!addr ? (
        <p className="text-xs opacity-60">Enter a Starknet wallet.</p>
      ) : (
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-2 py-1 border rounded">
            role: <span className="font-mono">{roleLabel(role)}</span>
          </div>

          <div className="px-2 py-1 border rounded">
            partner_id: <span className="font-mono">{partnerId ?? "—"}</span>
          </div>

          <div className="px-2 py-1 border rounded">
            operator_partner_id:{" "}
            <span className="font-mono">{operatorPartnerId ?? "—"}</span>
          </div>

          <div className="px-2 py-1 border rounded">
            operator_enabled:{" "}
            <span className="font-mono">
              {operatorEnabled === undefined
                ? "—"
                : operatorEnabled
                  ? "true"
                  : "false"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
