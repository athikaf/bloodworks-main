"use client";

import { useRole } from "~~/hooks/bloodworks/useRole";
import { AddressInspector } from "~~/components/bloodworks/admin/AddressInspector";

export default function AdminDashboardPage() {
  const { address, role } = useRole();

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-semibold">Platform Admin Dashboard</h1>

      <div className="border border-base-300 bg-base-100 rounded-lg p-4">
        <div className="text-sm opacity-70">Connected wallet</div>
        <div className="mt-1 font-mono text-sm break-all">{address}</div>
        <div className="mt-3 text-sm opacity-70">
          Role: <span className="font-mono">{String(role ?? "—")}</span>
        </div>
      </div>

      {/* ✅ Address Inspector (Admin Debug Tool) */}
      <AddressInspector />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border border-base-300 bg-base-100 rounded-lg p-4">
          <div className="text-sm opacity-70">Next</div>
          <div className="mt-2 font-semibold">Assign Bloodbanks</div>
          <div className="mt-1 text-xs opacity-70">
            Use /admin/roles → set_role(address, BLOODBANK)
          </div>
        </div>

        <div className="border border-base-300 bg-base-100 rounded-lg p-4">
          <div className="text-sm opacity-70">Next</div>
          <div className="mt-2 font-semibold">Assign Partners</div>
          <div className="mt-1 text-xs opacity-70">
            Use /admin/partners → set_partner(address, partnerId)
          </div>
        </div>

        <div className="border border-base-300 bg-base-100 rounded-lg p-4">
          <div className="text-sm opacity-70">Next</div>
          <div className="mt-2 font-semibold">Assign Operators</div>
          <div className="mt-1 text-xs opacity-70">
            Use /admin/operators → set_operator(operator, partnerId)
          </div>
        </div>
      </div>
    </div>
  );
}
