"use client";

import React from "react";
import { DonorProfileCard } from "~~/components/bloodworks/donor/DonorProfileCard";

export default function DonorProfilePage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="text-sm opacity-70 mt-0">
        Wallet + role + network details.
      </p>
      <DonorProfileCard />
    </div>
  );
}
