"use client";

import { useAccount } from "@starknet-react/core";

export default function DonorProfilePage() {
  const { address, status } = useAccount();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
        <p className="text-sm opacity-70">Connected wallet</p>
        <p className="mt-2 font-mono break-all">
          {status === "connected" ? address : "Not connected"}
        </p>
      </div>
    </div>
  );
}
