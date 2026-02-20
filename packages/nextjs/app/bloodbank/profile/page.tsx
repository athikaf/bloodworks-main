"use client";

import { useAccount } from "@starknet-react/core";

export default function BloodbankProfilePage() {
  const { address, status } = useAccount();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="text-sm opacity-70 mt-0">
        Wallet + role + network details will live here.
      </p>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base">Connected Wallet</h2>
          {status === "connected" && address ? (
            <code className="bg-underline italic text-sm font-bold break-all">
              {address}
            </code>
          ) : (
            <p className="text-sm opacity-70">Not connected</p>
          )}
        </div>
      </div>
    </div>
  );
}
