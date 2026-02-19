export type PerkDefinition = {
  partnerId: number; // must match RoleRegistry partner_id for that partner wallet
  perkId: number; // unique per partner (or global if you want)
  title: string;
  description: string;
  minDonations: number; // donation_count threshold
};

export const PERKS: PerkDefinition[] = [
  {
    partnerId: 1,
    perkId: 1,
    title: "Free Tim Hortons coffee",
    description: "Claim 1 regular coffee after you donate.",
    minDonations: 1,
  },
  {
    partnerId: 2,
    perkId: 1,
    title: "VIP Tickets (Scotiabank / Blue Jays)",
    description: "Unlock VIP tickets after sustained donations.",
    minDonations: 5,
  },
];
