"use client";

import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const ROLE_OPERATOR = 4;

function toNum(x: any): number | undefined {
  if (x === undefined || x === null) return undefined;
  try {
    return Number(x);
  } catch {
    return undefined;
  }
}

function toBool(x: any): boolean | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === "boolean") return x;
  if (typeof x === "bigint") return x === 1n;
  if (typeof x === "number") return x === 1;
  if (typeof x === "string")
    return x === "1" || x === "0x1" || x.toLowerCase() === "true";
  if (Array.isArray(x) && x.length > 0) return toBool(x[0]);
  return undefined;
}

export function useOperatorContext() {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const roleRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: false,
  });

  const enabledRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "is_operator_enabled",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: true,
  });

  const partnerRead = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_operator_partner_id",
    args: address ? [address] : undefined,
    enabled: isConnected,
    watch: true,
  });

  const role = useMemo(() => toNum(roleRead.data), [roleRead.data]);
  const isOperator = role === ROLE_OPERATOR;

  const operatorEnabled = useMemo(
    () => toBool(enabledRead.data),
    [enabledRead.data],
  );
  const operatorPartnerId = useMemo(
    () => toNum(partnerRead.data),
    [partnerRead.data],
  );

  const loading =
    roleRead.isLoading || enabledRead.isLoading || partnerRead.isLoading;

  return {
    address,
    status,
    isConnected,
    role,
    isOperator,
    operatorEnabled,
    operatorPartnerId,
    loading,
    error: roleRead.error || enabledRead.error || partnerRead.error,
  };
}
