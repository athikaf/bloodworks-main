export const ROLE_DONOR = 0;
export const ROLE_PARTNER = 1;
export const ROLE_BLOODBANK = 2;
export const ROLE_PLATFORM_ADMIN = 3;
export const ROLE_OPERATOR = 4;

export function isPartnerLike(role: number | null | undefined) {
  return role === ROLE_PARTNER || role === ROLE_PLATFORM_ADMIN;
}

export const ROLE_LABEL: Record<number, string> = {
  0: "Donor",
  1: "Partner",
  2: "Bloodbank",
  3: "Platform Admin",
  4: "Operator",
};
