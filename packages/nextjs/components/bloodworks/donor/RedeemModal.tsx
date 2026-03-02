"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Perk } from "./PerkCard";

type Props = {
  open: boolean;
  onClose: () => void;
  perk?: Perk;
};

const EXPIRY_SECONDS = 45;

function shortAddr(a?: string) {
  if (!a) return "";
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

// MVP claim token generator (NOT secure, good enough for demo).
function generateClaimCode(donor: string, perk: Perk) {
  const nonce = Math.random().toString(16).slice(2);
  const ts = Date.now().toString(16);
  // use perk.perkId (new model)
  return `BW-${perk.partnerId}-${perk.perkId}-${donor.slice(2, 8)}-${ts}-${nonce}`.toUpperCase();
}

export const RedeemModal: React.FC<Props> = ({ open, onClose, perk }) => {
  const { address, status } = useAccount();
  const donorAddress = status === "connected" ? address : undefined;

  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [claimCode, setClaimCode] = useState<string>("");

  // Can render as long as wallet connected + we have a perk selected
  const canRender = open && !!perk && !!donorAddress;

  useEffect(() => {
    if (!canRender) return;

    setSecondsLeft(EXPIRY_SECONDS);
    setClaimCode(generateClaimCode(donorAddress!, perk!));

    const t = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => clearInterval(t);
  }, [canRender, donorAddress, perk]);

  const expired = secondsLeft === 0;

  const instructions = useMemo(() => {
    if (!perk) return [];
    const partnerLabel = perk.partnerName || `Partner #${perk.partnerId}`;
    return [
      `Show this screen to the operator at ${partnerLabel}.`,
      `They will look up your donor address and redeem the perk in the Operator portal (on-chain).`,
      `If the timer expires, tap “Refresh code”.`,
    ];
  }, [perk]);

  if (!open) return null;

  // If wallet not connected, still show modal but with a clear prompt
  if (!donorAddress || !perk) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          className="absolute inset-0 bg-black/50"
          aria-label="Close modal"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg bg-base-100 border border-base-300 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Redeem perk</h2>
              <p className="text-sm opacity-80 mt-1">
                {perk ? perk.title : "Select a perk"}
              </p>
            </div>
            <button className="btn btn-sm" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="mt-4 card bg-base-100 border border-base-300">
            <div className="card-body">
              <p className="text-sm">
                Connect your wallet to generate a claim code.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close modal"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-base-100 border border-base-300 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Redeem perk</h2>
            <p className="text-sm opacity-80 mt-1">{perk.title}</p>
          </div>
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 bg-base-200 rounded-xl p-4">
          <div className="text-xs opacity-70">Donor</div>
          <div className="font-mono text-sm break-all">
            {shortAddr(donorAddress)}
          </div>
          <button
            className="btn btn-xs btn-outline mt-2"
            onClick={() => navigator.clipboard.writeText(donorAddress)}
          >
            Copy donor address
          </button>
          <div className="mt-3 text-xs opacity-70">Claim code</div>
          <div className="font-mono text-sm break-all mt-1">
            {claimCode || "—"}
          </div>

          <button
            className="btn btn-xs btn-outline mt-2"
            onClick={() => navigator.clipboard.writeText(claimCode)}
            disabled={!claimCode}
          >
            Copy claim code
          </button>

          <div className="mt-3 flex items-center justify-between">
            <div
              className={`text-xs px-2 py-1 rounded-full ${
                expired
                  ? "bg-error/15 text-error"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {expired ? "Expired" : `Expires in ${secondsLeft}s`}
            </div>

            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                setSecondsLeft(EXPIRY_SECONDS);
                setClaimCode(generateClaimCode(donorAddress, perk));
              }}
            >
              Refresh code
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">How this works (MVP)</p>
          <ul className="list-disc ml-5 mt-2 text-sm opacity-80 space-y-1">
            {instructions.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>

          <p className="text-xs opacity-60 mt-3">
            Note: This is a demo claim code. Later we’ll server-sign codes and
            have the operator scan/verify.
          </p>
        </div>
      </div>
    </div>
  );
};
