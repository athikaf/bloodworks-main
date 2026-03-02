import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Perk = {
  perkId: number;
  title: string;
  description?: string;
  image?: string;
  minDonations?: number;
  terms?: string;
  ctaLabel?: string;
  category?: string;
  onchainCreated?: boolean;
};

type PartnerFile = {
  partnerId: number;
  partnerName?: string;
  updatedAt?: string;
  perks: Perk[];
};

export async function GET() {
  const dir = path.join(process.cwd(), "data", "perks");

  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const all: Array<Perk & { partnerId: number; partnerName?: string }> = [];

    for (const f of jsonFiles) {
      const raw = await fs.readFile(path.join(dir, f), "utf-8");
      const parsed = JSON.parse(raw) as PartnerFile;

      const partnerId = Number(parsed.partnerId);
      const partnerName = parsed.partnerName ?? "";

      const perks = Array.isArray(parsed.perks) ? parsed.perks : [];
      for (const perk of perks) {
        if (!perk?.perkId || !perk?.title) continue;
        all.push({ ...perk, partnerId, partnerName });
      }
    }

    return NextResponse.json(
      { ok: true, count: all.length, perks: all },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: true, count: 0, perks: [], warning: String(e?.message ?? e) },
      { status: 200 },
    );
  }
}
