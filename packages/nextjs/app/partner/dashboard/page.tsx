"use client";

import { useMemo } from "react";
import { usePartnerContext } from "~~/hooks/bloodworks/usePartnerContext";
import { usePartnerTotalRedemptions } from "~~/hooks/bloodworks/usePartnerRedemptions";
import { usePartnerPerksMetadata } from "~~/hooks/bloodworks/usePartnerPerksMetadata";
import { usePartnerOperators } from "~~/hooks/bloodworks/usePartnerOperators";

import { useEnabledOperatorCount } from "~~/hooks/bloodworks/useEnabledOperatorCount";

function StatCard({
  title,
  value,
  sub,
  loading,
  error,
}: {
  title: string;
  value?: string;
  sub?: string;
  loading?: boolean;
  error?: string;
}) {
  return (
    <div className="border border-base-300 bg-base-100 rounded-lg p-4">
      <div className="text-sm opacity-70">{title}</div>
      <div className="mt-2 text-2xl font-bold">
        {loading ? "…" : error ? "—" : (value ?? "—")}
      </div>
      {sub && <div className="mt-1 text-xs opacity-70">{sub}</div>}
      {error && <div className="mt-2 text-xs text-error">{error}</div>}
    </div>
  );
}

export default function PartnerDashboard() {
  const { partnerId } = usePartnerContext();

  // on-chain total redemptions
  const red = usePartnerTotalRedemptions(partnerId);

  // perks metadata
  const perksMeta = usePartnerPerksMetadata(partnerId);
  const totalPerks = perksMeta.data?.perks?.length ?? 0;
  const onchainLinked =
    perksMeta.data?.perks?.filter((p) => p.onchainCreated).length ?? 0;

  // operators list (Phase 1 JSON)
  const ops = usePartnerOperators(partnerId);
  const operatorCount = ops.operators.length;

  const pidLabel = partnerId ? `partnerId = ${partnerId}` : undefined;

  const enabledOps = useEnabledOperatorCount(
    ops.operators.map((o) => o.address),
    { pollMs: 5000 },
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Partner Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          title="Total Redemptions (on-chain)"
          value={
            red.totalRedemptions !== undefined
              ? red.totalRedemptions.toString()
              : undefined
          }
          sub={pidLabel}
          loading={red.isLoading}
          error={
            red.error
              ? "Failed to read get_partner_total_redemptions"
              : undefined
          }
        />

        <StatCard
          title="Operators (listed)"
          value={ops.loading ? undefined : String(operatorCount)}
          sub="From JSON list"
          loading={ops.loading}
          error={ops.err ?? undefined}
        />

        <StatCard
          title="Operators (enabled on-chain)"
          value={
            enabledOps.isLoading ? undefined : String(enabledOps.enabledCount)
          }
          sub="Live from RoleRegistry (polled)"
          loading={enabledOps.isLoading}
          // error={
          //   enabledOps.error && !enabledOps.isLoading
          //     ? "Failed to read is_operator_enabled"
          //     : undefined
          // }
          error={enabledOps.error ?? undefined}
        />

        <StatCard
          title="Perks (metadata)"
          value={perksMeta.loading ? undefined : String(totalPerks)}
          sub="From JSON (Phase 1)"
          loading={perksMeta.loading}
          error={perksMeta.err ?? undefined}
        />

        <StatCard
          title="Perks linked on-chain"
          value={perksMeta.loading ? undefined : String(onchainLinked)}
          sub="From JSON flag onchainCreated"
          loading={perksMeta.loading}
          error={perksMeta.err ?? undefined}
        />

        <StatCard
          title="Top Perks (hybrid)"
          sub="Phase 1: optional (events API later)"
        />
        <StatCard
          title="Unique / Repeat Donors (off-chain)"
          sub="Phase 1: optional (events API later)"
        />
      </div>

      <div className="text-xs opacity-60">
        Note: Redemptions are updated on-chain by operators. Operator counts
        come from a lightweight Phase-1 JSON list.
      </div>
    </div>
  );
}
