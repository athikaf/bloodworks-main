import { BlockIdentifier, ProviderInterface } from "starknet";

export class ContractClassHashCache {
  private static instance: ContractClassHashCache;
  private cache = new Map<string, string>();
  private pendingRequests = new Map<string, Promise<string | undefined>>();

  private constructor() {}

  public static getInstance(): ContractClassHashCache {
    if (!ContractClassHashCache.instance) {
      ContractClassHashCache.instance = new ContractClassHashCache();
    }
    return ContractClassHashCache.instance;
  }

  public async getClassHash(
    publicClient: ProviderInterface,
    address: string,
    blockIdentifier: BlockIdentifier = "pre_confirmed",
  ): Promise<string | undefined> {
    const cacheKey = `${address}-${blockIdentifier}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const pendingRequest = this.fetchClassHash(
      publicClient,
      address,
      blockIdentifier,
      cacheKey,
    );
    this.pendingRequests.set(cacheKey, pendingRequest);

    try {
      return await pendingRequest;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async fetchClassHash(
    publicClient: ProviderInterface,
    address: string,
    blockIdentifier: BlockIdentifier,
    cacheKey: string,
  ): Promise<string | undefined> {
    try {
      const normalizeBlockId = (blockId: any) => {
        // Some clients emit "pre_confirmed", devnet RPC rejects it.
        // Some clients reject "pending" (your error: unmanaged: pending).
        // So for devnet reads: force "latest".
        if (blockId === "pre_confirmed") return "latest";
        if (blockId === "pending") return "latest";

        // Also handle object-style identifiers (depending on client versions)
        if (blockId && typeof blockId === "object") {
          const tag =
            blockId.block_tag ??
            blockId.blockTag ??
            blockId.tag ??
            blockId.block_id;
          if (tag === "pre_confirmed" || tag === "pending") return "latest";
        }

        return blockId ?? "latest";
      };

      const normalizedBlockIdentifier = normalizeBlockId(blockIdentifier);

      const classHash = await publicClient.getClassHashAt(
        address,
        normalizedBlockIdentifier,
      );
      this.cache.set(cacheKey, classHash);
      return classHash;
    } catch (error) {
      console.error("Failed to fetch class hash:", error);
      return undefined;
    }
  }

  public clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}
