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
 * 2) BloodworksCore (needs RoleRegistry address)
 */
const deployScript = async (): Promise<void> => {
  // PHASE 1
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

  // PHASE 2
  await deployContract({
    contract: "BloodworksCore",
    contractName: "BloodworksCore",
    constructorArgs: {
      role_registry: roleRegistryAddress, // ✅ now correct
      cooldown_seconds: 86400n,
    },
  });

  await executeDeployCalls();
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
