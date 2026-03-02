import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const { partnerId } = await params;

  const filePath = path.join(
    process.cwd(),
    "data",
    "perks",
    `${partnerId}.json`,
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw);
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        partnerId: Number(partnerId),
        partnerName: "",
        updatedAt: new Date().toISOString(),
        perks: [],
        error: "Perks file not found. Create perks from Partner UI.",
      },
      { status: 200 },
    );
  }
}
