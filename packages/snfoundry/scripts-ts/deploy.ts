import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  assertDeployerDefined,
  assertRpcNetworkActive,
  assertDeployerSignable,
  resetDeployCalls,
} from "./deploy-contract";
import { green, red } from "./helpers/colorize-log";

/**
 * Deploy contracts in order:
 * 1) RoleRegistry
 * 2) PerksRegistry (needs RoleRegistry address if your constructor uses it)
 * 3) BloodworksCore (needs RoleRegistry + PerksRegistry addresses)
 */
const deployScript = async (): Promise<void> => {
  // ---------------------------
  // PHASE 1: RoleRegistry
  // ---------------------------
  await deployContract({
    contract: "RoleRegistry",
    contractName: "RoleRegistry",
    constructorArgs: {
      owner: deployer.address,
    },
  });

  const deployed1 = await executeDeployCalls();
  resetDeployCalls();

  const roleRegistryAddress = deployed1["RoleRegistry"].address; // ✅ REAL address from receipt

  // ---------------------------
  // PHASE 2: PerksRegistry
  // ---------------------------
  // If your PerksRegistry constructor DOES NOT need role_registry, remove it.
  await deployContract({
    contract: "PerksRegistry",
    contractName: "PerksRegistry",
    constructorArgs: {
      role_registry: roleRegistryAddress, // ✅ keep only if your PerksRegistry expects it
    },
  });

  const deployed2 = await executeDeployCalls();
  resetDeployCalls();

  const perksRegistryAddress = deployed2["PerksRegistry"].address; // ✅ REAL address from receipt

  // ---------------------------
  // PHASE 3: BloodworksCore
  // ---------------------------
  await deployContract({
    contract: "BloodworksCore",
    contractName: "BloodworksCore",
    constructorArgs: {
      role_registry: roleRegistryAddress,

      cooldown_seconds: 86400n, // ✅ u64 => BigInt
    },
  });

  await executeDeployCalls();

  // Export once at the end (file will contain all contracts)
  exportDeployments();
};

const main = async (): Promise<void> => {
  try {
    assertDeployerDefined();
    await Promise.all([assertRpcNetworkActive(), assertDeployerSignable()]);

    await deployScript();

    console.log(green("All Setup Done!"));
  } catch (err) {
    if (err instanceof Error) {
      console.error(red(err.message));
    } else {
      console.error(err);
    }
    process.exit(1);
  }
};

main();
