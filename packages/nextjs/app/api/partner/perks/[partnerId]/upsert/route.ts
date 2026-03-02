import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type PerkMeta = {
  perkId?: number;
  title: string;
  description?: string;
  image?: string;
  minDonations?: number;
  terms?: string;
  ctaLabel?: string;
  category?: string;
  onchainCreated?: boolean;
};

type PartnerPerksFile = {
  partnerId: number;
  partnerName?: string;
  updatedAt: string;
  perks: Array<
    Required<Pick<PerkMeta, "perkId" | "title">> &
      Omit<PerkMeta, "perkId" | "title">
  >;
};

function assertValidPartnerId(partnerId: number) {
  if (!Number.isInteger(partnerId) || partnerId <= 0)
    throw new Error("Invalid partnerId");
}

function assertValidPerkInput(p: PerkMeta) {
  if (!p.title || typeof p.title !== "string")
    throw new Error("title is required");
  if (
    p.perkId !== undefined &&
    (!Number.isInteger(p.perkId) || p.perkId <= 0)
  ) {
    throw new Error("perkId must be a positive integer");
  }
  if (
    p.minDonations !== undefined &&
    (!Number.isInteger(p.minDonations) || p.minDonations < 0)
  ) {
    throw new Error("minDonations must be a non-negative integer");
  }
}

async function readJsonOrDefault(
  filePath: string,
  partnerId: number,
): Promise<PartnerPerksFile> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw);
    return {
      partnerId: Number(json.partnerId ?? partnerId),
      partnerName: json.partnerName ?? "",
      updatedAt: json.updatedAt ?? new Date().toISOString(),
      perks: Array.isArray(json.perks) ? json.perks : [],
    };
  } catch {
    return {
      partnerId,
      partnerName: "",
      updatedAt: new Date().toISOString(),
      perks: [],
    };
  }
}

function allocateNextPerkId(existing: PartnerPerksFile["perks"]): number {
  const maxId = existing.reduce((m, p) => (p.perkId > m ? p.perkId : m), 100);
  return maxId + 1;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> }, // ✅ params is async in your Next.js
) {
  try {
    const { partnerId: partnerIdStr } = await params; // ✅ await params
    const partnerId = Number(partnerIdStr);
    assertValidPartnerId(partnerId);

    const body = (await req.json()) as { perk: PerkMeta; partnerName?: string };
    if (!body?.perk) throw new Error("Missing body.perk");
    assertValidPerkInput(body.perk);

    const dir = path.join(process.cwd(), "data", "perks");
    const filePath = path.join(dir, `${partnerId}.json`);
    await fs.mkdir(dir, { recursive: true });

    const file = await readJsonOrDefault(filePath, partnerId);
    if (body.partnerName !== undefined) file.partnerName = body.partnerName;

    const perkId = body.perk.perkId ?? allocateNextPerkId(file.perks);

    const idx = file.perks.findIndex((p) => p.perkId === perkId);
    const next = {
      perkId,
      title: body.perk.title,
      description: body.perk.description ?? "",
      image: body.perk.image ?? "/perks/placeholder.png",
      minDonations: body.perk.minDonations ?? 0,
      terms: body.perk.terms ?? "",
      ctaLabel: body.perk.ctaLabel ?? "Redeem",
      category: body.perk.category ?? "",
      onchainCreated: body.perk.onchainCreated ?? false,
    };

    if (idx >= 0) file.perks[idx] = { ...file.perks[idx], ...next };
    else file.perks.push(next);

    file.updatedAt = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(file, null, 2), "utf-8");

    return NextResponse.json(
      { ok: true, partnerId, perkId, file },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}
