"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "@starknet-react/core";
import { DonorSidebar } from "~~/components/bloodworks/donor/DonorSidebar";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const ROLE_DONOR = 0;

export default function DonorLayout({ children }: { children: ReactNode }) {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  // Read role from RoleRegistry only when connected
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

  // ✅ Not connected → block (keep styles simple, don't render donor shell)
  if (!isConnected) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="max-w-md w-full bg-base-100 border border-base-300 rounded-2xl p-6">
          <h1 className="text-xl font-bold">Connect your wallet</h1>
          <p className="mt-2 opacity-80">
            Please connect a wallet to access the donor dashboard.
          </p>
          <Link href="/" className="link mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Loading role → block to avoid UI flash
  if (isLoading || roleNum === undefined) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="max-w-md w-full bg-base-100 border border-base-300 rounded-2xl p-6">
          <h1 className="text-xl font-bold">Checking access…</h1>
          <p className="mt-2 opacity-80">
            Verifying your role on-chain. Please wait.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Error reading role → block
  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="max-w-md w-full bg-base-100 border border-base-300 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-error">Role check failed</h1>
          <p className="mt-2 opacity-80">
            Couldn’t read your role from the RoleRegistry. Make sure you’re on
            the correct network and your deployedContracts.ts addresses match.
          </p>
          <Link href="/" className="link mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Not donor → block
  if (roleNum !== ROLE_DONOR) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="max-w-md w-full bg-base-100 border border-base-300 rounded-2xl p-6">
          <h1 className="text-xl font-bold">Not authorized</h1>
          <p className="mt-2 opacity-80">
            This section is only for donors. Your current role is{" "}
            <span className="font-semibold">{roleNum}</span>.
          </p>
          <Link href="/" className="link mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Donor → render original layout (styles preserved)
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar handles mobile topbar + drawer + desktop sidebar */}
      <DonorSidebar />

      {/* Main content */}
      <main className="flex-1 w-full p-4 lg:p-6 lg:ml-64 mt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
