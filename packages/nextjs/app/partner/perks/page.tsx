"use client";

import { PartnerPerksManager } from "~~/components/bloodworks/partner/PartnerPerksManager";

export default function PartnerPerksPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Manage Perks</h1>
        <p className="text-sm opacity-70 mt-1">
          Add perks for donors. Donors will see them immediately. Redemption is
          still verified on-chain.
        </p>
      </div>

      <PartnerPerksManager />
    </div>
  );
}
