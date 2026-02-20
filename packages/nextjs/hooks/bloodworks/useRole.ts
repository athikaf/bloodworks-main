"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

export const useRole = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const {
    data: roleRaw,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: false,
  });

  const role = useMemo(() => {
    if (roleRaw === undefined || roleRaw === null) return undefined;
    try {
      return Number(roleRaw);
    } catch {
      return undefined;
    }
  }, [roleRaw]);

  return {
    address,
    status,
    isConnected,
    role,
    isLoadingRole: isConnected ? isLoading : false,
    roleError: error,
  };
};
