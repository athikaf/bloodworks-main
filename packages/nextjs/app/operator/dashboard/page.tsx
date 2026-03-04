"use client";

import Link from "next/link";
import { useOperatorContext } from "~~/hooks/bloodworks/useOperatorContext";

export default function OperatorDashboardPage() {
  const ctx = useOperatorContext();

  if (!ctx.isConnected) {
    return (
      <div className="max-w-3xl space-y-3">
        <h1 className="text-2xl font-semibold">Operator Dashboard</h1>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm">
              Connect your wallet to access Operator tools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (ctx.loading) {
    return (
      <div className="max-w-3xl space-y-3">
        <h1 className="text-2xl font-semibold">Operator Dashboard</h1>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm">Loading operator status…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ctx.isOperator) {
    return (
      <div className="max-w-3xl space-y-3">
        <h1 className="text-2xl font-semibold">Operator Dashboard</h1>
        <div className="alert alert-warning">
          <span className="text-sm">This wallet is not an Operator.</span>
        </div>
      </div>
    );
  }

  if (ctx.operatorEnabled === false) {
    return (
      <div className="max-w-3xl space-y-3">
        <h1 className="text-2xl font-semibold">Operator Dashboard</h1>
        <div className="alert alert-error">
          <span className="text-sm">
            Operator is disabled. Ask your Partner to enable you.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Operator Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border border-base-300 bg-base-100 rounded-lg p-4">
          <div className="text-sm opacity-70">Partner ID</div>
          <div className="mt-2 text-2xl font-bold">
            {ctx.operatorPartnerId ?? "—"}
          </div>
          <div className="mt-1 text-xs opacity-70">
            Derived from RoleRegistry
          </div>
        </div>

        <div className="border border-base-300 bg-base-100 rounded-lg p-4">
          <div className="text-sm opacity-70">Status</div>
          <div className="mt-2 text-2xl font-bold">Enabled</div>
          <div className="mt-1 text-xs opacity-70">
            Can redeem perks on-chain
          </div>
        </div>

        <div className="border border-base-300 bg-base-100 rounded-lg p-4">
          <div className="text-sm opacity-70">Next action</div>
          <div className="mt-3">
            <Link className="btn btn-sm btn-primary" href="/operator/redeem">
              Redeem a perk
            </Link>
          </div>
        </div>
      </div>

      <div className="text-xs opacity-60">
        Reminder: Donors do not redeem on-chain. Operators redeem on-chain after
        verifying eligibility in the UI.
      </div>
    </div>
  );
}
