"use client";

import React, { useMemo, useState } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const ROLE_LABEL: Record<number, string> = {
  0: "Donor",
  1: "Partner",
  2: "Bloodbank",
  3: "Bloodworks (Platform Admin)",
};

const shortHex = (v?: string, left = 8, right = 6) => {
  if (!v) return "";
  const s = v.toString();
  if (s.length <= left + right) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
};

export const DonorProfileCard: React.FC = () => {
  const { address, status } = useAccount();
  const { chain } = useNetwork();
  const isConnected = status === "connected" && !!address;

  const {
    data: roleRaw,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: false,
  });

  const roleNum = useMemo(() => {
    if (roleRaw === undefined || roleRaw === null) return undefined;
    try {
      return Number(roleRaw);
    } catch {
      return undefined;
    }
  }, [roleRaw]);

  const roleLabel = roleNum !== undefined ? ROLE_LABEL[roleNum] : undefined;

  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!address) return;
    await copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="card-title">Profile</h2>
            <p className="text-sm opacity-70">Wallet, role and network info.</p>
          </div>

          <span
            className={`badge ${isConnected ? "badge-success" : "badge-ghost"}`}
          >
            {isConnected ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-base-300 bg-base-100">
            <p className="text-xs uppercase opacity-60">Wallet</p>

            {!isConnected ? (
              <p className="mt-2 text-sm opacity-70">Connect a wallet.</p>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2">
                <code className="text-xs break-all">{address}</code>
                <button className="btn btn-xs btn-outline" onClick={onCopy}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}

            {isConnected && (
              <p className="mt-2 text-xs opacity-60">
                Short: <code>{shortHex(address)}</code>
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl border border-base-300 bg-base-100">
            <p className="text-xs uppercase opacity-60">Role</p>

            {!isConnected ? (
              <p className="mt-2 text-sm opacity-70">—</p>
            ) : isLoading ? (
              <p className="mt-2 text-sm opacity-70">Loading role…</p>
            ) : error ? (
              <p className="mt-2 text-sm text-error">
                Error reading role. Check network + deployedContracts.
              </p>
            ) : roleLabel ? (
              <p className="mt-2 text-sm font-semibold">{roleLabel}</p>
            ) : (
              <p className="mt-2 text-sm text-error">
                Unknown role ({String(roleNum)})
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl border border-base-300 bg-base-100 md:col-span-2">
            <p className="text-xs uppercase opacity-60">Network</p>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <p>
                <span className="opacity-70">Chain:</span>{" "}
                <span className="font-medium">{chain?.name ?? "Unknown"}</span>
              </p>
              <p>
                <span className="opacity-70">Chain ID:</span>{" "}
                <code className="text-xs">{chain?.id ?? "—"}</code>
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs opacity-60 mt-4">
          Later: donor metadata, blood type, notification preferences, etc.
        </p>
      </div>
    </div>
  );
};
