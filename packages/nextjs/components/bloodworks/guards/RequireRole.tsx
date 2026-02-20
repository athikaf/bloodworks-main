"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useRole } from "~~/hooks/bloodworks/useRole";

type Props = {
  allowedRole: number;
  redirectTo?: string;
  children: ReactNode;
};

export const RequireRole = ({
  allowedRole,
  redirectTo = "/",
  children,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, isLoadingRole, role, roleError } = useRole();

  useEffect(() => {
    if (!isConnected) return;
    if (isLoadingRole) return;
    if (role === undefined) return;

    if (role !== allowedRole) {
      router.replace(redirectTo);
    }
  }, [
    isConnected,
    isLoadingRole,
    role,
    allowedRole, // ✅ added
    router,
    redirectTo,
  ]);
  if (!isConnected) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="text-2xl font-bold">Connect wallet</h1>
        <p className="opacity-70 mt-2">
          This area is for authorized users only.
        </p>
        <div className="mt-4">
          <CustomConnectButton />
        </div>
      </div>
    );
  }

  if (isLoadingRole) {
    return (
      <div className="p-6 max-w-xl">
        <p>Checking access…</p>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="p-6 max-w-xl">
        <p className="text-error">
          Error reading role. Check your deployedContracts.ts + selected
          network.
        </p>
      </div>
    );
  }

  // If role mismatched, we’ll redirect; render nothing briefly to avoid flicker
  if (role !== allowedRole) return null;

  return <>{children}</>;
};
