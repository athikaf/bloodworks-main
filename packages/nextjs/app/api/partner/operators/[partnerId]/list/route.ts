import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function filePathFor(partnerId: string) {
  return path.join(process.cwd(), "data", "operators", `${partnerId}.json`);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const { partnerId } = await params;

  const fp = filePathFor(partnerId);
  try {
    const raw = await fs.readFile(fp, "utf-8");
    return NextResponse.json(JSON.parse(raw), { status: 200 });
  } catch {
    return NextResponse.json(
      {
        partnerId: Number(partnerId),
        updatedAt: new Date().toISOString(),
        operators: [],
      },
      { status: 200 },
    );
  }
}
