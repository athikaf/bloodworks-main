import { NextResponse } from "next/server";
import { listActivePerks } from "~~/lib/perksStore";

export async function GET() {
  return NextResponse.json({ perks: listActivePerks() });
}
