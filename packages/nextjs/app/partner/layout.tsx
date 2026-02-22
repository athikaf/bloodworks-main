"use client";

import { ReactNode } from "react";
import { RequireRole } from "~~/components/bloodworks/guards/RequireRole";
import { PartnerSidebar } from "~~/components/bloodworks/partner/PartnerSidebar";

const ROLE_PARTNER = 1;

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole allowedRole={ROLE_PARTNER} redirectTo="/">
      <div className="flex min-h-[calc(100vh-64px)]">
        <PartnerSidebar />
        <main className="flex-1 w-full p-4 lg:p-6">{children}</main>
      </div>
    </RequireRole>
  );
}
