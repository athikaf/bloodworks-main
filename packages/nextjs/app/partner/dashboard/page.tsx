"use client";

import { usePartnerContext } from "~~/hooks/bloodworks/usePartnerContext";
import { usePartnerTotalRedemptions } from "~~/hooks/bloodworks/usePartnerRedemptions";
import { usePartnerPerksMetadata } from "~~/hooks/bloodworks/usePartnerPerksMetadata";

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
  const { totalRedemptions, isLoading, error } =
    usePartnerTotalRedemptions(partnerId);

  const perksMeta = usePartnerPerksMetadata(partnerId);

  const totalPerks = perksMeta.data?.perks?.length ?? 0;
  const onchainLinked =
    perksMeta.data?.perks?.filter((p) => p.onchainCreated).length ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Partner Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          title="Total Redemptions (on-chain)"
          value={
            totalRedemptions !== undefined
              ? totalRedemptions.toString()
              : undefined
          }
          sub={partnerId ? `partnerId = ${partnerId}` : undefined}
          loading={isLoading}
          error={
            error ? "Failed to read get_partner_total_redemptions" : undefined
          }
        />

        <StatCard title="Top Perks (hybrid)" sub="Phase 1: from events API" />
        <StatCard
          title="Unique / Repeat Donors (off-chain)"
          sub="Phase 1: from events API"
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
      </div>
    </div>
  );
}
