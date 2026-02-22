import type { Perk } from "~~/types/perk";

type CreatePerkInput = {
  partnerId: number;
  title: string;
  description: string;
  minDonations: number;
};

type UpdatePerkInput = Partial<
  Pick<Perk, "title" | "description" | "minDonations" | "isActive">
>;

const g = globalThis as any;

// Keep store in global so it survives HMR in dev
if (!g.__bloodworks_perks_store__) {
  const initial: Perk[] = [
    {
      partnerId: 101,
      perkId: 1,
      title: "Free Tim Hortons Coffee",
      description: "One coffee on us — thank you for donating.",
      minDonations: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      partnerId: 202,
      perkId: 1,
      title: "VIP Blue Jays Tickets",
      description: "2 VIP tickets after consistent donations.",
      minDonations: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  g.__bloodworks_perks_store__ = {
    perks: initial,
    nextPerkIdByPartner: new Map<number, number>([
      [101, 2],
      [202, 2],
    ]),
  };
}

const store: {
  perks: Perk[];
  nextPerkIdByPartner: Map<number, number>;
} = g.__bloodworks_perks_store__;

function ensurePartnerCounter(partnerId: number) {
  if (!store.nextPerkIdByPartner.has(partnerId)) {
    const maxExisting = store.perks
      .filter((p) => p.partnerId === partnerId)
      .reduce((m, p) => Math.max(m, p.perkId), 0);
    store.nextPerkIdByPartner.set(partnerId, maxExisting + 1);
  }
}

export function listActivePerks(): Perk[] {
  return store.perks.filter((p) => p.isActive);
}

export function listPartnerPerks(partnerId: number): Perk[] {
  return store.perks.filter((p) => p.partnerId === partnerId);
}

export function createPerk(input: CreatePerkInput): Perk {
  ensurePartnerCounter(input.partnerId);

  const perkId = store.nextPerkIdByPartner.get(input.partnerId)!;
  store.nextPerkIdByPartner.set(input.partnerId, perkId + 1);

  const perk: Perk = {
    partnerId: input.partnerId,
    perkId,
    title: input.title,
    description: input.description,
    minDonations: input.minDonations,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  store.perks.unshift(perk);
  return perk;
}

export function updatePerk(
  partnerId: number,
  perkId: number,
  patch: UpdatePerkInput,
): Perk | null {
  const idx = store.perks.findIndex(
    (p) => p.partnerId === partnerId && p.perkId === perkId,
  );
  if (idx === -1) return null;

  store.perks[idx] = { ...store.perks[idx], ...patch };
  return store.perks[idx];
}

export function disablePerk(partnerId: number, perkId: number): Perk | null {
  return updatePerk(partnerId, perkId, { isActive: false });
}
