"use client";

import { DonorStatusCard } from "./DonorStatusCard";
import { NextActionCard } from "./NextActionCard";
import { PerksGrid } from "./PerksGrid";

export const DonorDashboardShell = () => {
  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full flex flex-col items-center">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">Bloodworks</span>
          <span className="block text-4xl font-bold">Donor Dashboard</span>
        </h1>

        <p className="text-center text-sm opacity-80 mt-3 max-w-xl">
          This dashboard shows your onchain donor credential status.
        </p>

        <div className="mt-8 w-full flex flex-col items-center gap-6">
          <DonorStatusCard />
          <NextActionCard />
          <PerksGrid />
        </div>
      </div>
    </div>
  );
};
