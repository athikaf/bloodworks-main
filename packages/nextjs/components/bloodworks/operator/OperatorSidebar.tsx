"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Dashboard", href: "/operator/dashboard" },
  { label: "Redeem", href: "/operator/redeem" },
  { label: "History", href: "/operator/history" },
  { label: "Profile", href: "/operator/profile" },
];

export const OperatorSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 border-r border-base-300 bg-base-100 p-4 flex-col fixed top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold">Operator</h2>
        <p className="text-xs opacity-60">Redeem perks on-chain</p>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm ${
                active ? "bg-primary text-primary-content" : "hover:bg-base-200"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
