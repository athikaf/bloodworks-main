"use client";

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BugAntIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useTheme } from "next-themes";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { devnet } from "@starknet-react/chains";
import { SwitchTheme } from "./SwitchTheme";
import { useAccount, useNetwork, useProvider } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

const ROLE_PLATFORM_ADMIN = 3;

const menuLinks: HeaderMenuLink[] = [
  { label: "Home", href: "/" },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

// Donor sidebar links (used inside mobile header drawer on /donor/*)
const donorLinks: HeaderMenuLink[] = [
  { label: "Dashboard", href: "/donor/dashboard" },
  { label: "Perks", href: "/donor/perks" },
  { label: "History", href: "/donor/history" },
  { label: "Profile", href: "/donor/profile" },
];

// Bloodbank sidebar links (used inside mobile header drawer on /bloodbank/*)
const bloodbankLinks: HeaderMenuLink[] = [
  { label: "Dashboard", href: "/bloodbank/dashboard" },
  { label: "Issue Credential", href: "/bloodbank/issue" },
  { label: "Record Donation", href: "/bloodbank/record" },
  { label: "History", href: "/bloodbank/history" }, // stub ok
  { label: "Profile", href: "/bloodbank/profile" }, // stub ok
];

const HeaderMenuLinks = ({ isPlatformAdmin }: { isPlatformAdmin: boolean }) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);

  // Hide debug unless platform admin
  const visibleLinks = menuLinks.filter((link) => {
    if (link.href === "/debug") return isPlatformAdmin;
    return true;
  });

  return (
    <>
      {visibleLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive
                  ? "bg-gradient-nav text-white! active:bg-gradient-nav shadow-md"
                  : ""
              } py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col hover:bg-gradient-nav hover:text-white`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

const DrawerNav = ({
  links,
  pathname,
  onNavigate,
}: {
  links: HeaderMenuLink[];
  pathname: string;
  onNavigate?: () => void;
}) => {
  return (
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
};

/**
 * Site header
 */
export const Header = () => {
  const pathname = usePathname();
  const isDonorRoute = pathname.startsWith("/donor");
  const isBloodbankRoute = pathname.startsWith("/bloodbank");

  // "role route" = routes where header should NOT show Home (desktop nav),
  // and mobile drawer should show sidebar links + connect button.
  const isRoleRoute = isDonorRoute || isBloodbankRoute;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.network === devnet.network;

  const { provider } = useProvider();
  const { address, status, chainId } = useAccount();
  const isConnected = status === "connected" && !!address;

  // ✅ Read role only when connected; IMPORTANT: only pass args when address exists
  const { data: roleRaw } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: [address], // ✅ always a tuple
    enabled: isConnected,
    watch: false,
  });

  const roleNum = useMemo(() => {
    if (roleRaw === undefined || roleRaw === null) return undefined;
    try {
      return Number(roleRaw);
    } catch {
      return undefined;
    }
  }, [roleRaw]);

  const isPlatformAdmin = isConnected && roleNum === ROLE_PLATFORM_ADMIN;

  const { chain } = useNetwork();
  const [isDeployed, setIsDeployed] = useState(true);

  useEffect(() => {
    if (
      status === "connected" &&
      address &&
      chainId === targetNetwork.id &&
      chain.network === targetNetwork.network
    ) {
      provider
        .getClassHashAt(address)
        .then((classHash) => setIsDeployed(!!classHash))
        .catch((e) => {
          console.error("contract check", e);
          if (e.toString().includes("Contract not found")) setIsDeployed(false);
        });
    }
  }, [
    status,
    address,
    provider,
    chainId,
    targetNetwork.id,
    targetNetwork.network,
    chain.network,
  ]);

  // Desktop nav links visible only on non-role routes (keeps Home for now)
  const desktopLinksVisible = !isRoleRoute;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Choose drawer links based on route
  const drawerLinks = isDonorRoute
    ? donorLinks
    : isBloodbankRoute
      ? bloodbankLinks
      : [];

  return (
    <div
      className={[
        "fixed top-0 navbar min-h-0 shrink-0 justify-between z-50 px-0 sm:px-2 border-b border-base-300",
        scrolled ? "bg-base-100/80 backdrop-blur-sm" : "bg-base-100",
      ].join(" ")}
    >
      <div className="navbar-start w-auto lg:w-1/2 -mr-2">
        {/* Mobile hamburger */}
        <div className="lg:hidden" ref={burgerMenuRef}>
          <button
            className="ml-1 btn btn-ghost 
              [@media(max-width:379px)]:px-3! [@media(max-width:379px)]:py-1! 
              [@media(max-width:379px)]:h-9! [@media(max-width:379px)]:min-h-0!
              [@media(max-width:379px)]:w-10!"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Drawer */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsDrawerOpen(false)}
              />

              {/* Panel */}
              <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-base-100 border-r border-base-300 p-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-9">
                      <Image alt="Bloodworks logo" fill src="/logo.png" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold leading-tight">
                        Bloodworks
                      </span>
                      <span className="text-xs opacity-70">
                        Powered by Trust
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="Close menu"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* ROLE ROUTES: show sidebar links (NO Home) + connect/theme inside drawer */}
                {isRoleRoute ? (
                  <>
                    <DrawerNav
                      links={drawerLinks}
                      pathname={pathname}
                      onNavigate={() => setIsDrawerOpen(false)}
                    />

                    <div className="divider my-4" />

                    <div className="flex flex-col gap-3">
                      <CustomConnectButton />
                      <SwitchTheme
                        className={`pointer-events-auto ${
                          isLocalNetwork ? "mb-1" : ""
                        }`}
                      />
                    </div>

                    {/* Optional debug link for platform admin (kept OUT of normal nav) */}
                    {isPlatformAdmin && (
                      <>
                        <div className="divider my-4" />
                        <Link
                          href="/debug"
                          onClick={() => setIsDrawerOpen(false)}
                          className="px-3 py-2 rounded-lg text-sm hover:bg-base-200 flex items-center gap-2"
                        >
                          <BugAntIcon className="h-4 w-4" />
                          Debug Contracts
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  // NON-role routes: show normal header links + connect/theme in drawer
                  <>
                    <ul className="menu menu-compact p-0">
                      <HeaderMenuLinks isPlatformAdmin={isPlatformAdmin} />
                    </ul>

                    <div className="divider my-4" />

                    <div className="flex flex-col gap-3">
                      <CustomConnectButton />
                      <SwitchTheme
                        className={`pointer-events-auto ${
                          isLocalNetwork ? "mb-1" : ""
                        }`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logo */}
        <Link
          href="/"
          passHref
          className="flex items-center gap-2 ml-2 lg:ml-4 mr-2 lg:mr-6 shrink-0"
        >
          <div className="flex relative w-8 h-10">
            <Image
              alt="Bloodworks logo"
              className="cursor-pointer"
              fill
              src="/logo.png"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold leading-tight">Bloodworks</span>
            <span className="text-xs">Powered by Trust</span>
          </div>
        </Link>

        {/* Desktop header links (keep Home for now, but HIDE inside /donor/* and /bloodbank/*) */}
        {desktopLinksVisible && (
          <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
            <HeaderMenuLinks isPlatformAdmin={isPlatformAdmin} />
          </ul>
        )}
      </div>

      {/* Desktop right side controls (always visible on desktop) */}
      <div className="navbar-end grow mr-2 gap-4 hidden lg:flex">
        {status === "connected" && !isDeployed ? (
          <span className="bg-[#8a45fc] text-[9px] p-1 text-white">
            Wallet Not Deployed
          </span>
        ) : null}
        <CustomConnectButton />
        <SwitchTheme
          className={`pointer-events-auto ${
            isLocalNetwork ? "mb-1 lg:mb-0" : ""
          }`}
        />
      </div>

      {/* On non-role routes, show connect on mobile too (role routes keep it inside the drawer) */}
      {!isRoleRoute && (
        <div className="lg:hidden navbar-end mr-2 gap-2">
          <CustomConnectButton />
        </div>
      )}
    </div>
  );
};
