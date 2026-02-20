"use client";

import { PerksGrid } from "~~/components/bloodworks/donor/PerksGrid";

export default function DonorPerksPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Perks</h1>
      <p className="text-sm opacity-70 mt-0">
        Your perks unlock as your donation count increases.
      </p>
      <PerksGrid />
    </div>
  );
}
