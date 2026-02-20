"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

type DonorStatus = {
  issued: boolean;
  donationCount: number;
  lastDonationTs: number;
  cooldownEndTs: number;
  isActive: boolean;
};

type RecentAction = {
  ts: number;
  action: "ISSUE_CREDENTIAL" | "RECORD_DONATION";
  donor: string;
  txHash?: string;
  ok: boolean;
  note?: string;
};

const STORAGE_KEY = "bloodworks_recent_bloodbank_actions_v1";

const normalizeHexAddress = (v: string): string | null => {
  const raw = (v || "").trim();
  if (!raw) return null;

  const with0x = raw.startsWith("0x") ? raw : `0x${raw}`;
  const lower = with0x.toLowerCase();

  // basic format check
  if (!/^0x[0-9a-f]+$/.test(lower)) return null;

  try {
    const bi = BigInt(lower);
    if (bi === 0n) return null;
  } catch {
    return null;
  }

  // Starknet addresses can be shorter; keeping as-is is fine.
  return lower;
};

const formatTs = (ts: number) => {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
};

export const DonorActionsWorkbench: React.FC = () => {
  // 1) Input + validation
  const [input, setInput] = useState("");
  const [donor, setDonor] = useState<string | undefined>(undefined);

  const donorNormalized = useMemo(() => normalizeHexAddress(input), [input]);
  const isValid = !!donorNormalized;

  // Apply validated donor when user clicks "Load"
  const onLoad = () => {
    if (!donorNormalized) return;
    setDonor(donorNormalized);
  };

  // 2) get_status read
  const {
    data: statusRaw,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_status",
    args: donor ? [donor] : undefined,
    enabled: !!donor,
    watch: false,
  });

  const status: DonorStatus | undefined = useMemo(() => {
    if (!statusRaw) return undefined;

    // ABI output: (bool, u32, u64, u64, bool)
    // Order you showed earlier:
    // (issued, donation_count, last_donation_ts, cooldown_end_ts, is_active)
    try {
      const tuple = statusRaw as any;
      const issued = Boolean(tuple[0]);
      const donationCount = Number(tuple[1]);
      const lastDonationTs = Number(tuple[2]);
      const cooldownEndTs = Number(tuple[3]);
      const isActive = Boolean(tuple[4]);

      return { issued, donationCount, lastDonationTs, cooldownEndTs, isActive };
    } catch {
      return undefined;
    }
  }, [statusRaw]);

  const nowSec = Math.floor(Date.now() / 1000);
  const isCoolingDown = !!status && status.cooldownEndTs > nowSec;

  // 3) issue_credential write
  const {
    sendAsync: issueAsync,
    isPending: isIssuing,
    error: issueError,
  } = useScaffoldWriteContract({
    contractName: "BloodworksCore",
    functionName: "issue_credential",
    args: donor ? [donor] : undefined,
  });

  // 4) record_donation write
  const {
    sendAsync: recordAsync,
    isPending: isRecording,
    error: recordError,
  } = useScaffoldWriteContract({
    contractName: "BloodworksCore",
    functionName: "record_donation",
    args: donor ? [donor] : undefined,
  });

  // 5) local recent actions list
  const [recent, setRecent] = useState<RecentAction[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecent(parsed.slice(0, 10));
    } catch {
      // ignore
    }
  }, []);

  const pushRecent = (a: RecentAction) => {
    setRecent((prev) => {
      const next = [a, ...prev].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleIssue = async () => {
    if (!donor) return;

    try {
      const res = await issueAsync();
      // res shape varies by Scaffold-Stark version; tx hash usually on `transaction_hash` or `txHash`
      const txHash =
        (res as any)?.transaction_hash || (res as any)?.txHash || undefined;

      pushRecent({
        ts: nowSec,
        action: "ISSUE_CREDENTIAL",
        donor,
        txHash,
        ok: true,
      });

      await refetchStatus?.();
    } catch (e: any) {
      pushRecent({
        ts: nowSec,
        action: "ISSUE_CREDENTIAL",
        donor,
        ok: false,
        note: e?.message || "Issue failed",
      });
    }
  };

  const handleRecord = async () => {
    if (!donor) return;

    try {
      const res = await recordAsync();
      const txHash =
        (res as any)?.transaction_hash || (res as any)?.txHash || undefined;

      pushRecent({
        ts: nowSec,
        action: "RECORD_DONATION",
        donor,
        txHash,
        ok: true,
      });

      await refetchStatus?.();
    } catch (e: any) {
      pushRecent({
        ts: nowSec,
        action: "RECORD_DONATION",
        donor,
        ok: false,
        note: e?.message || "Record failed",
      });
    }
  };

  const canIssue = !!donor && !!status && !status.issued;
  const canRecord = !!donor && !!status && status.issued && !isCoolingDown;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-5">
        {/* Step 1: Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Donor Address</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input input-bordered w-full"
              placeholder="0x0123…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="btn btn-primary"
              disabled={!isValid}
              onClick={onLoad}
            >
              Load
            </button>
          </div>

          {!input ? (
            <p className="text-xs opacity-60">
              Paste the donor’s Starknet address.
            </p>
          ) : isValid ? (
            <p className="text-xs opacity-60">
              Normalized: <code className="break-all">{donorNormalized}</code>
            </p>
          ) : (
            <p className="text-xs text-error">
              Invalid address. Must be hex (0x…).
            </p>
          )}
        </div>

        {/* Step 2: get_status */}
        <div className="divider my-0" />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Status</h3>
            <button
              className="btn btn-ghost btn-sm"
              disabled={!donor}
              onClick={() => refetchStatus?.()}
            >
              Refresh
            </button>
          </div>

          {!donor ? (
            <p className="opacity-70 text-sm">
              Load a donor address to view status.
            </p>
          ) : isLoadingStatus ? (
            <p className="text-sm">Loading status…</p>
          ) : statusError ? (
            <p className="text-sm text-error">
              Error reading get_status. Check BloodworksCore address + network.
            </p>
          ) : !status ? (
            <p className="text-sm text-error">
              Could not parse status response.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg border border-base-300">
                <p className="opacity-60 text-xs">Credential</p>
                <p className="font-semibold">
                  {status.issued ? "Issued" : "Not issued"}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-base-300">
                <p className="opacity-60 text-xs">Donation Count</p>
                <p className="font-semibold">{status.donationCount}</p>
              </div>

              <div className="p-3 rounded-lg border border-base-300">
                <p className="opacity-60 text-xs">Last Donation</p>
                <p className="font-semibold">
                  {formatTs(status.lastDonationTs)}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-base-300">
                <p className="opacity-60 text-xs">Cooldown Ends</p>
                <p className="font-semibold">
                  {formatTs(status.cooldownEndTs)}
                </p>
                {isCoolingDown && (
                  <p className="text-xs text-warning mt-1">
                    Still cooling down.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 3/4: Actions */}
        <div className="divider my-0" />

        <div className="flex flex-col gap-3">
          <h3 className="font-bold">Actions</h3>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              className="btn btn-outline"
              disabled={!canIssue || isIssuing}
              onClick={handleIssue}
            >
              {isIssuing ? "Issuing…" : "Issue Credential"}
            </button>

            <button
              className="btn btn-primary"
              disabled={!canRecord || isRecording}
              onClick={handleRecord}
            >
              {isRecording ? "Recording…" : "Record Donation"}
            </button>
          </div>

          {issueError && (
            <p className="text-xs text-error">
              Issue error: {(issueError as any)?.message || String(issueError)}
            </p>
          )}
          {recordError && (
            <p className="text-xs text-error">
              Record error:{" "}
              {(recordError as any)?.message || String(recordError)}
            </p>
          )}

          {!!status && status.issued && isCoolingDown && (
            <p className="text-xs opacity-70">
              You can record again after cooldown ends (enforced on-chain).
            </p>
          )}
        </div>

        {/* Step 5: Recent actions */}
        <div className="divider my-0" />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Recent Actions</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setRecent([]);
                try {
                  localStorage.removeItem(STORAGE_KEY);
                } catch {}
              }}
              disabled={recent.length === 0}
            >
              Clear
            </button>
          </div>

          {recent.length === 0 ? (
            <p className="text-sm opacity-70">No recent actions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((a, idx) => (
                <div
                  key={`${a.ts}-${idx}`}
                  className="p-3 rounded-lg border border-base-300 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {a.action === "ISSUE_CREDENTIAL"
                        ? "Issued Credential"
                        : "Recorded Donation"}
                    </p>
                    <span
                      className={`badge ${a.ok ? "badge-success" : "badge-error"}`}
                    >
                      {a.ok ? "OK" : "FAIL"}
                    </span>
                  </div>

                  <p className="text-xs opacity-70 mt-1">
                    {new Date(a.ts * 1000).toLocaleString()}
                  </p>

                  <p className="text-xs opacity-70 mt-1 break-all">
                    Donor: <code>{a.donor}</code>
                  </p>

                  {a.txHash && (
                    <p className="text-xs opacity-70 mt-1 break-all">
                      Tx: <code>{a.txHash}</code>
                    </p>
                  )}

                  {a.note && (
                    <p className="text-xs text-error mt-1">{a.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
