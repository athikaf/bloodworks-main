"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const links = [
  { label: "Dashboard", href: "/bloodbank/dashboard" },
  { label: "Donor Actions", href: "/bloodbank/donors" },
  { label: "History", href: "/bloodbank/history" },
  { label: "Profile", href: "/bloodbank/profile" },
];

export const BloodbankSidebar = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-2">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`px-3 py-2 rounded-lg text-sm ${
              active ? "bg-primary text-primary-content" : "hover:bg-base-200"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden w-full border-b border-base-300 bg-base-100 px-4 py-3 flex items-center justify-between">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <div className="text-center">
          <p className="text-sm font-bold">Bloodbank</p>
        </div>

        {/* spacer to keep center aligned */}
        <div className="w-10" />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-base-300 bg-base-100 p-4 flex-col fixed top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Bloodbank</h2>
        </div>
        <Nav />
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="left-0 top-0 h-full w-80 max-w-[85vw] bg-base-100 border-r border-base-300 p-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold">Bloodbank</h2>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <Nav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
