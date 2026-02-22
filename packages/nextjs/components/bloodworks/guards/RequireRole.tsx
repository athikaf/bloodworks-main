"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

type Props = {
  allowedRoles: number[]; // e.g. [2] for bloodbank, [1,4] etc.
  redirectTo: string;
  children: ReactNode;
};

export const RequireRole = ({ allowedRoles, redirectTo, children }: Props) => {
  const router = useRouter();
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  // ✅ IMPORTANT: make these literals, not `string`
  const contractName = "RoleRegistry" as const;
  const functionName = "get_role" as const;

  const { data: roleRaw, isLoading } = useScaffoldReadContract({
    contractName,
    functionName,
    // ✅ tuple args; enabled ensures we don't actually run when address is undefined
    args: [address] as const,
    enabled: isConnected,
    watch: false,
  } as any); // <- keeps TS from collapsing config to `never` in your setup

  const roleNum = useMemo(() => {
    if (roleRaw === undefined || roleRaw === null) return undefined;
    try {
      return Number(roleRaw);
    } catch {
      return undefined;
    }
  }, [roleRaw]);

  const isAllowed = roleNum !== undefined && allowedRoles.includes(roleNum);

  useEffect(() => {
    if (!isConnected) return;
    if (isLoading) return;
    if (!isAllowed) router.replace(redirectTo);
  }, [isConnected, isLoading, isAllowed, redirectTo, router, allowedRoles]);

  if (!isConnected) return null;
  if (isLoading) return null;
  if (!isAllowed) return null;

  return <>{children}</>;
};
