"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Perk } from "./PerkCard";

type Props = {
  open: boolean;
  onClose: () => void;
  perk?: Perk;
  donorAddress?: string;
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
  return `BW-${perk.partnerId}-${perk.id}-${donor.slice(2, 8)}-${ts}-${nonce}`.toUpperCase();
}

export const RedeemModal: React.FC<Props> = ({
  open,
  onClose,
  perk,
  donorAddress,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [claimCode, setClaimCode] = useState<string>("");

  const canRender = open && perk && donorAddress;

  useEffect(() => {
    if (!canRender) return;

    // reset every open
    setSecondsLeft(EXPIRY_SECONDS);
    setClaimCode(generateClaimCode(donorAddress!, perk!));

    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [canRender, donorAddress, perk]);

  const expired = secondsLeft === 0;

  const instructions = useMemo(() => {
    if (!perk) return [];
    return [
      `Show this code to the cashier at ${perk.partnerName}.`,
      `They will confirm your redemption in their Partner portal (on-chain).`,
      `If the timer expires, tap “Refresh code”.`,
    ];
  }, [perk]);

  if (!open) return null;

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
            <p className="text-sm opacity-80 mt-1">{perk ? perk.title : ""}</p>
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

          <div className="mt-3 text-xs opacity-70">Claim code</div>
          <div className="font-mono text-sm break-all mt-1">
            {claimCode || "—"}
          </div>

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
                if (!perk || !donorAddress) return;
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
            Note: This is a demo claim code. In the hardened version, the code
            will be server-signed and partner-scanned to prevent misuse.
          </p>
        </div>
      </div>
    </div>
  );
};
