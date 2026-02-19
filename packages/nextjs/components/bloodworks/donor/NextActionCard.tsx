"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const fmt = (ts?: bigint) => {
  if (!ts || ts === 0n) return "—";
  return new Date(Number(ts) * 1000).toLocaleString();
};

export const NextActionCard = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const { data, isLoading, error } = useScaffoldReadContract({
    contractName: "BloodworksCore",
    functionName: "get_status",
    args: [address],
    enabled: isConnected,
    watch: false,
  });

  const view = useMemo(() => {
    if (!data) return null;
    const arr = data as unknown as [any, any, any, any, any];

    const issued = Boolean(arr[0]);
    const donationCount = Number(arr[1] ?? 0);
    const lastDonationTs = BigInt(arr[2] ?? 0);
    const cooldownEndTs = BigInt(arr[3] ?? 0);
    const active = Boolean(arr[4]);

    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    const cooldownRunning = cooldownEndTs > nowSec;

    if (!issued) {
      return {
        title: "You’re not onboarded yet",
        body: "Ask the blood bank to issue your Bloodworks credential after your donation.",
        tone: "info",
      };
    }

    if (active) {
      return {
        title: "Perks unlocked ✅",
        body: `You’re active right now. Browse your perks below and redeem at partners.`,
        tone: "success",
      };
    }

    if (cooldownRunning) {
      return {
        title: "Cooldown active ⏳",
        body: `Your perks are disabled during cooldown. Cooldown ends: ${fmt(
          cooldownEndTs,
        )}`,
        tone: "warning",
      };
    }

    // issued, not active, cooldown passed
    return {
      title: "You’re eligible again 💪",
      body: `You can donate again to keep your streak. Last donation: ${fmt(
        lastDonationTs,
      )}`,
      tone: "primary",
    };
  }, [data]);

  const cardClass =
    view?.tone === "success"
      ? "border-success"
      : view?.tone === "warning"
        ? "border-warning"
        : view?.tone === "primary"
          ? "border-primary"
          : "border-base-300";

  return (
    <div
      className={`w-full max-w-xl bg-base-100 rounded-2xl border p-5 ${cardClass}`}
    >
      <h2 className="text-lg font-bold">Next step</h2>

      {!isConnected && (
        <p className="mt-3 text-sm opacity-80">
          Connect your wallet to continue.
        </p>
      )}

      {isConnected && isLoading && (
        <p className="mt-3 text-sm opacity-80">Loading…</p>
      )}

      {isConnected && error && (
        <p className="mt-3 text-sm text-error">
          Couldn’t compute next step (contract read failed).
        </p>
      )}

      {isConnected && !isLoading && !error && view && (
        <div className="mt-3">
          <p className="font-semibold">{view.title}</p>
          <p className="text-sm opacity-80 mt-1">{view.body}</p>
        </div>
      )}
    </div>
  );
};
