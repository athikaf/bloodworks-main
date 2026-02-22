import { NextResponse } from "next/server";
import { updatePerk } from "~~/lib/perksStore";

export async function PATCH(req: Request, ctx: { params: { perkId: string } }) {
  const perkId = Number(ctx.params.perkId);
  const body = await req.json().catch(() => null);

  const partnerId = Number(body?.partnerId);
  if (Number.isNaN(partnerId) || Number.isNaN(perkId)) {
    return NextResponse.json(
      { error: "Invalid partnerId/perkId" },
      { status: 400 },
    );
  }

  // Allowed patch fields
  const patch: any = {};
  if (body?.title !== undefined) patch.title = String(body.title);
  if (body?.description !== undefined)
    patch.description = String(body.description);
  if (body?.minDonations !== undefined)
    patch.minDonations = Number(body.minDonations);
  if (body?.isActive !== undefined) patch.isActive = Boolean(body.isActive);

  const updated = updatePerk(partnerId, perkId, patch);
  if (!updated)
    return NextResponse.json({ error: "Perk not found" }, { status: 404 });

  return NextResponse.json({ perk: updated });
}
