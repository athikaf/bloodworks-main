"use client";

import { ReactNode } from "react";
import { BloodbankSidebar } from "~~/components/bloodworks/bloodbank/BloodbankSidebar";
import { RequireRole } from "~~/components/bloodworks/guards/RequireRole";

const ROLE_BLOODBANK = 2;

export default function BloodbankLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole allowedRole={ROLE_BLOODBANK} redirectTo="/">
      <div className="flex min-h-[calc(100vh-64px)]">
        <BloodbankSidebar />
        <main className="flex-1 w-full p-4 lg:p-6 lg:ml-64 mt-16">
          {children}
        </main>
      </div>
    </RequireRole>
  );
}
