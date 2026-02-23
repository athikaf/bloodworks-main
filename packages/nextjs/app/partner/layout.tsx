"use client";

import { ReactNode } from "react";
import { RequireRole } from "~~/components/bloodworks/guards/RequireRole";
import { PartnerSidebar } from "~~/components/bloodworks/partner/PartnerSidebar";

// Update these to match your contracts
const ROLE_PARTNER_ADMIN = 1;
const ROLE_PARTNER_OPERATOR = 4; // <-- change if your operator role id differs

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole
      allowedRoles={[ROLE_PARTNER_ADMIN, ROLE_PARTNER_OPERATOR]}
      redirectTo="/"
    >
      <div className="flex min-h-[calc(100vh-64px)] pt-[64px]">
        <PartnerSidebar />
        <main className="flex-1 w-full p-4 lg:p-6">{children}</main>
      </div>
    </RequireRole>
  );
}
