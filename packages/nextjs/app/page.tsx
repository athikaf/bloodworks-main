"use client";

import { useEffect, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useRouter, usePathname } from "next/navigation";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

const ROLE_DONOR = 0;
const ROLE_PARTNER = 1;
const ROLE_BLOODBANK = 2;
const ROLE_PLATFORM_ADMIN = 3;

const Home = () => {
  const router = useRouter();
  const pathname = usePathname();

  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const {
    data: roleRaw,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: [address],
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

  // ✅ redirect once we know role
  useEffect(() => {
    if (!isConnected) return;
    if (isLoading) return;
    if (error) return;
    if (roleNum === undefined) return;

    // Avoid redirect loops (only redirect from "/")
    if (pathname !== "/") return;

    if (roleNum === ROLE_DONOR) router.replace("/donor/dashboard");
    else if (roleNum === ROLE_PARTNER) router.replace("/partner/dashboard");
    else if (roleNum === ROLE_BLOODBANK) router.replace("/bloodbank/dashboard");
    else if (roleNum === ROLE_PLATFORM_ADMIN)
      router.replace("/admin/dashboard");
  }, [isConnected, isLoading, error, roleNum, router, pathname]);

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 max-w-xl w-full">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">Welcome to</span>
          <span className="block text-4xl font-bold">Bloodworks</span>
        </h1>

        {!isConnected ? (
          <>
            <p className="text-center text-lg mt-4">
              Connect your wallet to continue.
            </p>
            <div className="flex justify-center mt-6">
              <CustomConnectButton />
            </div>
          </>
        ) : (
          <>
            <p className="text-center text-lg mt-4">
              Connected:{" "}
              <code className="bg-underline italic text-base font-bold max-w-full break-words break-all inline-block">
                {address}
              </code>
            </p>

            <div className="text-center mt-6">
              {isLoading && <p>Loading your role…</p>}

              {error && (
                <p className="text-error">
                  Error reading role. Check deployedContracts.ts + network.
                </p>
              )}

              {!isLoading && !error && roleNum !== undefined && (
                <p className="opacity-70">
                  Role detected (#{roleNum}). Redirecting to your dashboard…
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
