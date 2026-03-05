"use client";

import { PropsWithChildren } from "react";
import { useRole } from "~~/hooks/bloodworks/useRole";

const ROLE_PLATFORM_ADMIN = 3;

export function AdminGate({ children }: PropsWithChildren) {
  const { isConnected, isLoadingRole, role } = useRole();

  if (!isConnected) {
    return (
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <p className="text-sm">Connect your wallet to access Admin UI.</p>
        </div>
      </div>
    );
  }

  if (isLoadingRole) {
    return (
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <p className="text-sm">Checking admin role…</p>
        </div>
      </div>
    );
  }

  if (role !== ROLE_PLATFORM_ADMIN) {
    return (
      <div className="alert alert-warning">
        <span className="text-sm">
          Access denied. This area is for Platform Admin only.
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
