export type Perk = {
  partnerId: number;
  perkId: number; // unique per partner
  title: string;
  description: string;
  minDonations: number;
  isActive: boolean;
  imageUrl?: string; // ✅ optional
};