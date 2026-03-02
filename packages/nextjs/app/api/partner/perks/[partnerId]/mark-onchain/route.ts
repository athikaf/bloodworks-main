import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> }, // ✅ async params
) {
  try {
    const { partnerId: partnerIdStr } = await params; // ✅ await params
    const partnerId = Number(partnerIdStr);

    const body = (await req.json()) as {
      perkId: number;
      onchainCreated?: boolean;
    };

    if (!Number.isInteger(partnerId) || partnerId <= 0)
      throw new Error("Invalid partnerId");
    if (!Number.isInteger(body.perkId) || body.perkId <= 0)
      throw new Error("Invalid perkId");

    const filePath = path.join(
      process.cwd(),
      "data",
      "perks",
      `${partnerId}.json`,
    );
    const raw = await fs.readFile(filePath, "utf-8");
    const file = JSON.parse(raw);

    const perks = Array.isArray(file.perks) ? file.perks : [];
    const idx = perks.findIndex((p: any) => Number(p.perkId) === body.perkId);
    if (idx < 0) throw new Error("Perk not found in JSON");

    perks[idx].onchainCreated = body.onchainCreated ?? true;
    file.updatedAt = new Date().toISOString();

    await fs.writeFile(filePath, JSON.stringify(file, null, 2), "utf-8");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}