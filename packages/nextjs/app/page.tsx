// import Link from "next/link";
// import Image from "next/image";
// import { ConnectedAddress } from "~~/components/ConnectedAddress";

// const Home = () => {
//   return (
//     <div className="flex items-center flex-col grow pt-10">
//       <div className="px-5">
//         <h1 className="text-center">
//           <span className="block text-2xl mb-2">Welcome to</span>
//           <span className="block text-4xl font-bold">Scaffold-Stark 2</span>
//         </h1>
//         <ConnectedAddress />
//         <p className="text-center text-lg">
//           Edit your smart contract{" "}
//           <code className="bg-underline italic text-base font-bold max-w-full break-words break-all inline-block">
//             your_contract.cairo
//           </code>{" "}
//           in{" "}
//           <code className="bg-underline italic text-base font-bold max-w-full break-words break-all inline-block">
//             packages/snfoundry/contracts/src
//           </code>
//         </p>
//       </div>

//       <div className="bg-container grow w-full mt-16 px-8 py-12">
//         <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
//           <div className="flex flex-col bg-base-100 relative text-[12px] px-10 py-10 text-center items-center max-w-xs rounded-3xl border border-gradient">
//             <div className="trapeze"></div>
//             <Image
//               src="/debug-icon.svg"
//               alt="icon"
//               width={26}
//               height={30}
//             ></Image>
//             <p>
//               Tinker with your smart contract using the{" "}
//               <Link href="/debug" passHref className="link">
//                 Debug Contracts
//               </Link>{" "}
//               tab.
//             </p>
//           </div>
//           <div className="flex flex-col bg-base-100 relative text-[12px] px-10 py-10 text-center items-center max-w-xs rounded-3xl border border-gradient">
//             <div className="trapeze"></div>
//             <Image
//               src="/explorer-icon.svg"
//               alt="icon"
//               width={20}
//               height={32}
//             ></Image>
//             <p>
//               Play around with Multiwrite transactions using
//               useScaffoldMultiWrite() hook
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { DonorDashboardShell } from "~~/components/bloodworks/donor/DonorDashboardShell";

const ROLE_LABEL: Record<number, string> = {
  0: "donor",
  1: "partner",
  2: "bloodbank",
  3: "bloodworks",
};

const Home = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  // Read role from RoleRegistry only when connected
  const {
    data: roleRaw,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "RoleRegistry",
    functionName: "get_role",
    args: [address], // ✅ always a tuple
    watch: false,
    enabled: isConnected, // ✅ prevents call when address undefined
  });

  const roleNum = useMemo(() => {
    if (roleRaw === undefined || roleRaw === null) return undefined;
    try {
      return Number(roleRaw);
    } catch {
      return undefined;
    }
  }, [roleRaw]);

  const roleLabel = roleNum !== undefined ? ROLE_LABEL[roleNum] : undefined;

  const router = useRouter();

  useEffect(() => {
    if (isConnected && roleLabel === "donor") {
      router.push("/donor/dashboard");
    }
  }, [isConnected, roleLabel, router]);

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5">
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
              {!isLoading && !error && roleLabel && roleLabel !== "donor" && (
                <h2 className="text-2xl font-bold">Welcome {roleLabel}</h2>
              )}

              {!isLoading && !error && roleLabel === undefined && (
                <p className="text-error">
                  Role not recognized (got: {String(roleNum)}). Update
                  ROLE_LABEL mapping.
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
