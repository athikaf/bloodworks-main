"use client";

import { useMemo, useState } from "react";
import { useOperatorContext } from "~~/hooks/bloodworks/useOperatorContext";
import { usePartnerPerksForOperator } from "~~/hooks/bloodworks/usePartnerPerksForOperator";
import { useDonorStatusByAddress } from "~~/hooks/bloodworks/useDonorStatus";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import { usePerkEnabled } from "~~/hooks/bloodworks/usePerkEnabled";

function shortAddr(a?: string) {
  if (!a) return "";
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

function isStarknetAddress(x: string) {
  const t = x.trim();
  return /^0x[0-9a-fA-F]{1,64}$/.test(t);
}

function PerkTile({
  partnerId,
  perk,
  donor,
  issued,
  donationCount,
  redeeming,
  onRedeem,
}: {
  partnerId: number;
  perk: any;
  donor?: string;
  issued: boolean;
  donationCount: number;
  redeeming: boolean;
  onRedeem: (perkId: number) => void;
}) {
  const gate = usePerkEnabled(partnerId, perk.perkId, true);

  // While loading, you can either hide or show skeleton.
  // For a clean PoC: hide until we know.
  if (gate.isLoading) return null;

  // Hard filter: must exist + enabled
  if (gate.perkExists !== true) return null;
  if (gate.perkEnabled !== true) return null;

  const min = Number(perk.minDonations ?? 0);
  const eligible = !!donor && issued && donationCount >= min;

  return (
    <div className="border border-base-300 rounded-lg p-4 bg-base-100">
      <div className="flex items-start justify-between gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden border border-base-300 bg-base-200 flex items-center justify-center">
          {perk.image ? (
            <img
              src={perk.image}
              alt={perk.title}
              className="w-14 h-14 object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-xs opacity-60">No image</div>
          )}
        </div>
        <div>
          <div className="font-semibold">{perk.title}</div>
          {perk.description ? (
            <div className="text-sm opacity-80 mt-1">{perk.description}</div>
          ) : null}
          <div className="text-xs opacity-60 mt-2">
            perkId: <span className="font-mono">{perk.perkId}</span> ·
            minDonations: <span className="font-mono">{min}</span>
          </div>
        </div>

        <div className="text-xs">
          {eligible ? (
            <span className="badge badge-success">Eligible</span>
          ) : (
            <span className="badge badge-ghost">Not eligible</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          className="btn btn-sm btn-primary"
          disabled={!eligible || redeeming}
          onClick={() => onRedeem(perk.perkId)}
        >
          {redeeming ? "Redeeming…" : "Redeem on-chain"}
        </button>
      </div>
    </div>
  );
}

export default function OperatorRedeemPage() {
  const ctx = useOperatorContext();

  const partnerId = ctx.operatorPartnerId ?? 0;

  const {
    perks,
    loading: perksLoading,
    err: perksErr,
    refresh,
  } = usePartnerPerksForOperator(partnerId);

  const [donorInput, setDonorInput] = useState("");
  const donor = useMemo(() => {
    const t = donorInput.trim();
    return isStarknetAddress(t) ? t : undefined;
  }, [donorInput]);

  const donorStatus = useDonorStatusByAddress(donor);

  // ✅ derived fields (what you actually want in UI + eligibility)
  const issued = donorStatus.status?.issued === true;
  const donationCount = donorStatus.status?.donationCount ?? 0;
  const active = donorStatus.status?.active === true;

  const { sendAsync: redeemTx, isPending: redeeming } =
    useScaffoldWriteContract({
      contractName: "BloodworksCore",
      functionName: "redeem_perk",
      args: [], // override on click
    });

  const [toast, setToast] = useState<string | null>(null);

  const gatedOut =
    !ctx.isConnected ||
    ctx.loading ||
    !ctx.isOperator ||
    ctx.operatorEnabled === false ||
    !partnerId;

  const eligiblePerks = useMemo(() => {
    return perks.map((p) => {
      const min = Number(p.minDonations ?? 0);
      const eligible =
        !!donor && issued && donationCount >= min && p.onchainCreated !== false; // if undefined/true, allow
      return { perk: p, eligible, min };
    });
  }, [perks, donor, issued, donationCount]);

  const doRedeem = async (perkId: number) => {
    if (!donor) {
      setToast("Enter a valid donor address.");
      return;
    }
    setToast(null);
    try {
      const txHash = await redeemTx({ args: [donor, perkId] });
      setToast(txHash ? `Redeemed! tx=${txHash}` : "Redeem submitted.");
    } catch (e: any) {
      setToast(String(e?.message ?? e));
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Redeem</h1>
          <p className="text-sm opacity-70">
            Operator redeems on-chain for their partner.
          </p>
        </div>

        <button className="btn btn-sm btn-outline" onClick={refresh}>
          Refresh perks
        </button>
      </div>

      {toast ? (
        <div className="alert alert-info">
          <span className="text-sm break-all text-white">{toast}</span>
        </div>
      ) : null}

      {gatedOut ? (
        <div className="alert alert-warning">
          <span className="text-sm">
            Connect as an enabled Operator to redeem.
          </span>
        </div>
      ) : (
        <>
          {/* Operator context summary */}
          <div className="border border-base-300 bg-base-100 rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm opacity-70">
              Partner ID: <span className="font-mono">{partnerId}</span>
            </div>
            <div className="text-sm opacity-70">
              Operator:{" "}
              <span className="font-mono">{shortAddr(ctx.address)}</span>
            </div>
          </div>

          <div className="text-xs opacity-60">
            Debug:{" "}
            <a
              className="link"
              href={`/api/partner/perks/${partnerId}`}
              target="_blank"
              rel="noreferrer"
            >
              view /api/perks/{partnerId}
            </a>
          </div>

          {/* Donor lookup */}
          <div className="border border-base-300 bg-base-100 rounded-lg p-4 space-y-3">
            <div className="font-semibold">Donor lookup</div>

            <input
              className="input input-bordered m-2 w-full font-mono"
              placeholder="0x... donor address"
              value={donorInput}
              onChange={(e) => setDonorInput(e.target.value)}
            />

            {!donorInput.trim() ? (
              <p className="text-xs opacity-60">
                Enter donor wallet address to verify status + eligibility.
              </p>
            ) : !donor ? (
              <p className="text-xs text-error">Invalid Starknet address.</p>
            ) : donorStatus.isLoading ? (
              <p className="text-xs opacity-70">Reading donor status…</p>
            ) : donorStatus.error ? (
              <p className="text-xs text-error">
                Failed to read donor status (check network + deployedContracts).
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="px-2 py-1 rounded-md border border-base-300 bg-base-100">
                    issued:{" "}
                    <span className="font-mono">
                      {issued ? "true" : "false"}
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded-md border border-base-300 bg-base-100">
                    donationCount:{" "}
                    <span className="font-mono">{donationCount}</span>
                  </div>
                  <div className="px-2 py-1 rounded-md border border-base-300 bg-base-100">
                    active:{" "}
                    <span className="font-mono">
                      {active ? "true" : "false"}
                    </span>
                  </div>
                </div>

                {/* Optional: clear hint */}
                {!issued ? (
                  <p className="text-xs text-warning">
                    This wallet has no credential yet (issued=false). Ask the
                    bloodbank to issue the credential first.
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Perks list */}
          <div className="border border-base-300 bg-base-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Partner perks</div>
              <div className="text-xs opacity-70">
                {perksLoading
                  ? "Loading…"
                  : perksErr
                    ? `Error: ${perksErr}`
                    : `${perks.length} perks`}
              </div>
            </div>

            {perks.length === 0 ? (
              <div className="mt-3 text-sm opacity-70">
                No perks found for this partner.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {perks.map((perk) => (
                  <PerkTile
                    key={perk.perkId}
                    partnerId={partnerId}
                    perk={perk}
                    donor={donor}
                    issued={issued}
                    donationCount={donationCount}
                    redeeming={redeeming}
                    onRedeem={doRedeem}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="text-xs opacity-60">
            MVP note: eligibility checks are UI-side (minDonations). On-chain
            enforces operator + enabled + perk exists/enabled.
          </div>
        </>
      )}
    </div>
  );
}
