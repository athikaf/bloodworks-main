"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

function toNum(x: unknown): number | undefined {
  if (x === undefined || x === null) return undefined;
  try {
    return Number(x);
  } catch {
    return undefined;
  }
}

export const useRole = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const roleRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: true, // ✅ Partner UI benefits from live updates
  });

  const partnerIdRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_partner_id",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: true,
  });

  const role = useMemo(() => toNum(roleRead.data), [roleRead.data]);
  const partnerId = useMemo(
    () => toNum(partnerIdRead.data),
    [partnerIdRead.data],
  );

  return {
    address,
    status,
    isConnected,

    role,
    partnerId,

    isLoadingRole: isConnected ? roleRead.isLoading : false,
    isLoadingPartnerId: isConnected ? partnerIdRead.isLoading : false,

    roleError: roleRead.error,
    partnerIdError: partnerIdRead.error,
  };
};
