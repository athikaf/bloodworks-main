"use client";

import { ReactNode, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { BloodbankSidebar } from "~~/components/bloodworks/bloodbank/BloodbankSidebar";

const ROLE_BLOODBANK = 2;

function Unauthorized() {
  return (
    <div className="max-w-xl mx-auto mt-10 card bg-base-100 border border-base-300">
      <div className="card-body">
        <h2 className="card-title">Unauthorized</h2>
        <p className="opacity-80 text-sm">
          This section is only for Bloodbank accounts.
        </p>
        <div className="card-actions justify-end">
          <a className="btn btn-primary btn-sm" href="/">
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BloodbankLayout({ children }: { children: ReactNode }) {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const {
    data: roleRaw,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: [address], // ✅ always a tuple
    enabled: isConnected,
    watch: false,
  });

  const roleNum = useMemo(() => {
    if (roleRaw === undefined || roleRaw === null) return undefined;
    try {
      return Number(roleRaw);
    } catch {
      return undefined;
    }
  }, [roleRaw]);

  // Not connected: we don't render sidebar pages (prevents weird UI states)
  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto mt-10 card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Connect Wallet</h2>
          <p className="opacity-80 text-sm">
            Please connect your wallet to access Bloodbank tools.
          </p>
          <p className="text-xs opacity-60">
            (Use the connect button in the header.)
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto mt-10 card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Loading</h2>
          <p className="opacity-80 text-sm">Checking your role…</p>
        </div>
      </div>
    );
  }

  if (error || roleNum === undefined) {
    return (
      <div className="max-w-xl mx-auto mt-10 card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Role Lookup Failed</h2>
          <p className="opacity-80 text-sm">
            Could not read your role from RoleRegistry. Check deployedContracts
            + network.
          </p>
        </div>
      </div>
    );
  }

  const isBloodbank = roleNum === ROLE_BLOODBANK;
  if (!isBloodbank) return <Unauthorized />;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <BloodbankSidebar />
      <main className="flex-1 w-full p-4 lg:p-6">{children}</main>
    </div>
  );
}
