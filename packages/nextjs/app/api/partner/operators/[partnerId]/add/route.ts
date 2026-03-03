import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type OperatorRow = { address: string; label?: string };

function filePathFor(partnerId: string) {
  return path.join(process.cwd(), "data", "operators", `${partnerId}.json`);
}

function normalizeAddr(a: string) {
  return a.trim().toLowerCase();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const { partnerId } = await params;
  const body = (await req.json()) as { address: string; label?: string };

  if (!body?.address?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Missing address" },
      { status: 400 },
    );
  }

  const dir = path.join(process.cwd(), "data", "operators");
  await fs.mkdir(dir, { recursive: true });

  const fp = filePathFor(partnerId);

  let existing: {
    partnerId: number;
    updatedAt: string;
    operators: OperatorRow[];
  } = {
    partnerId: Number(partnerId),
    updatedAt: new Date().toISOString(),
    operators: [],
  };

  try {
    const raw = await fs.readFile(fp, "utf-8");
    existing = JSON.parse(raw);
  } catch {}

  const addr = normalizeAddr(body.address);
  const label = body.label?.trim() || "";

  const already = existing.operators.some(
    (o) => normalizeAddr(o.address) === addr,
  );
  if (!already) existing.operators.push({ address: addr, label });

  existing.updatedAt = new Date().toISOString();

  await fs.writeFile(fp, JSON.stringify(existing, null, 2), "utf-8");

  return NextResponse.json(
    { ok: true, partnerId: Number(partnerId), address: addr },
    { status: 200 },
  );
}
