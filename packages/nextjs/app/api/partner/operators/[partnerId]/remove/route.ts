import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function fp(partnerId: string) {
  return path.join(process.cwd(), "data", "operators", `${partnerId}.json`);
}
const norm = (a: string) => a.trim().toLowerCase();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const { partnerId } = await params;
  const body = (await req.json()) as { address: string };
  if (!body?.address?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Missing address" },
      { status: 400 },
    );
  }

  try {
    const raw = await fs.readFile(fp(partnerId), "utf-8");
    const json = JSON.parse(raw) as {
      operators: { address: string; label?: string }[];
      updatedAt: string;
      partnerId: number;
    };

    json.operators = (json.operators || []).filter(
      (o) => norm(o.address) !== norm(body.address),
    );
    json.updatedAt = new Date().toISOString();

    await fs.writeFile(fp(partnerId), JSON.stringify(json, null, 2), "utf-8");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
