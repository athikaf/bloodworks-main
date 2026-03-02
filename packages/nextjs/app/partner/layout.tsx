"use client";

import Link from "next/link";
import { usePartnerContext } from "~~/hooks/bloodworks/usePartnerContext";
import { PartnerSidebar } from "~~/components/bloodworks/partner/PartnerSidebar";

function Gate({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold">{title}</h1>
      <ul className="mt-3 list-disc pl-5 space-y-1 text-sm opacity-90">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <div className="mt-5 flex gap-3 text-sm">
        <Link className="underline" href="/">
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = usePartnerContext();

  if (!ctx.isConnected) {
    return (
      <Gate
        title="Connect your wallet"
        lines={["Please connect a wallet to access Partner tools."]}
      />
    );
  }

  if (ctx.loading) {
    return (
      <Gate
        title="Loading…"
        lines={["Reading role + partnerId from RoleRegistry."]}
      />
    );
  }

  if (ctx.errors.length) {
    return <Gate title="Partner access blocked" lines={ctx.errors} />;
  }

  return (
    <div className="min-h-screen mt-14">
      {/* Sidebar matches your donor layout */}
      <PartnerSidebar />

      {/* Main content is offset on lg screens */}
      <main className="p-6 lg:pl-64 ml-6">
        {/* Optional: small context banner */}
        <div className="mb-4 rounded-lg border border-base-300 bg-base-100 p-3 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold">Partner Console</div>
            <div className="opacity-70">
              Manage perks, operators, and impact.
            </div>
          </div>

          <div className="text-xs opacity-80 text-right">
            <div>
              Partner ID: <span className="font-mono">{ctx.partnerId}</span>
            </div>
            <div className="font-mono">
              {ctx.address?.slice(0, 6)}…{ctx.address?.slice(-4)}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
