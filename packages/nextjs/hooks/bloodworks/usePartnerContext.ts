"use client";

import { useMemo } from "react";
import { useNetwork } from "@starknet-react/core";
import { useRole } from "./useRole";
import { isPartnerLike } from "~~/utils/roles";

export type PartnerContext = {
  address?: string;
  isConnected: boolean;

  role?: number;
  partnerId?: number;

  loading: boolean;
  errors: string[];
};

export function usePartnerContext(): PartnerContext {
  const { chain } = useNetwork();
  const rr = useRole(); // reads role + partnerId

  const loading = rr.isLoadingRole || rr.isLoadingPartnerId;

  const errors = useMemo(() => {
    const e: string[] = [];

    if (!rr.isConnected) return e; // layout will show connect screen

    if (loading) return e; // don’t gate while loading

    if (rr.role === undefined) {
      e.push("Could not read role from RoleRegistry.");
      return e;
    }

    if (!isPartnerLike(rr.role)) {
      e.push("This area is only for Partners (or Platform Admin).");
      return e;
    }

    // Your contract enforces partner_id != 0 when setting partner
    if (rr.partnerId === undefined)
      e.push("Could not read partnerId from RoleRegistry.");
    else if (rr.partnerId === 0)
      e.push("No partnerId is assigned to this address.");

    if (rr.roleError) e.push("Failed to read role (RoleRegistry get_role).");
    if (rr.partnerIdError)
      e.push("Failed to read partnerId (RoleRegistry get_partner_id).");

    // Optional: network check (only if you already have a configured chain expectation)
    // if (chain?.id !== EXPECTED_CHAIN_ID) e.push("Wrong network selected.");

    return e;
  }, [
    rr.isConnected,
    loading,
    rr.role,
    rr.partnerId,
    rr.roleError,
    rr.partnerIdError,
  ]);

  return {
    address: rr.address,
    isConnected: rr.isConnected,
    role: rr.role,
    partnerId: rr.partnerId,
    loading,
    errors,
  };
}
