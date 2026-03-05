import { PropsWithChildren } from "react";
import { AdminSidebar } from "~~/components/bloodworks/admin/AdminSidebar";
import { AdminGate } from "~~/components/bloodworks/admin/AdminGate";

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 lg:ml-64 p-6 mt-18">
        <AdminGate>{children}</AdminGate>
      </main>
    </div>
  );
}
