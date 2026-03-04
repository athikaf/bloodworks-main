"use client";

import { OperatorSidebar } from "~~/components/bloodworks/operator/OperatorSidebar";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <OperatorSidebar />
      <main className="pt-[64px] lg:pl-64 p-4 mt-6 ml-6">{children}</main>
    </div>
  );
}
