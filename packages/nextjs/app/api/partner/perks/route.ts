import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Perk } from "~~/types/perk";

const DATA_DIR = path.join(process.cwd(), "data");
const PERKS_FILE = path.join(DATA_DIR, "perks.json");

type StoreShape = {
  perks: Perk[];
};

// ---------- helpers ----------
function ensureStoreFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PERKS_FILE)) {
    const initial: StoreShape = { perks: [] };
    fs.writeFileSync(PERKS_FILE, JSON.stringify(initial, null, 2));
  }
}

function readStore(): StoreShape {
  ensureStoreFile();
  const raw = fs.readFileSync(PERKS_FILE, "utf8");
  return JSON.parse(raw) as StoreShape;
}

function writeStore(store: StoreShape) {
  ensureStoreFile();
  fs.writeFileSync(PERKS_FILE, JSON.stringify(store, null, 2));
}

function isValidHttpUrl(s: string): boolean {
  if (!s) return false;
  return s.startsWith("http://") || s.startsWith("https://");
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// ---------- routes ----------

// GET /api/partner/perks?partnerId=101
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partnerIdStr = searchParams.get("partnerId");
  if (!partnerIdStr) return jsonError("Missing partnerId in query params.");

  const partnerId = Number(partnerIdStr);
  if (!Number.isFinite(partnerId) || partnerId <= 0) {
    return jsonError("partnerId must be a positive number.");
  }

  const store = readStore();
  const perks = store.perks.filter((p) => p.partnerId === partnerId);

  return NextResponse.json({ ok: true, perks });
}

// POST /api/partner/perks
// body: { partnerId, title, description, minDonations, imageUrl? }
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const partnerId = Number(body?.partnerId);
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const minDonations = Number(body?.minDonations);
  const imageUrlRaw = String(body?.imageUrl ?? "").trim();
  const imageUrl = imageUrlRaw ? imageUrlRaw : undefined;

  if (!Number.isFinite(partnerId) || partnerId <= 0) {
    return jsonError("partnerId must be a positive number.");
  }
  if (!title) return jsonError("title is required.");
  if (!description) return jsonError("description is required.");
  if (!Number.isFinite(minDonations) || minDonations < 1) {
    return jsonError("minDonations must be >= 1.");
  }
  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    return jsonError("imageUrl must start with http:// or https://");
  }

  const store = readStore();

  // Generate a perkId unique per partner (simple increment)
  const partnerPerks = store.perks.filter((p) => p.partnerId === partnerId);
  const nextPerkId =
    partnerPerks.length === 0
      ? 1
      : Math.max(...partnerPerks.map((p) => p.perkId)) + 1;

  const newPerk: Perk = {
    partnerId,
    perkId: nextPerkId,
    title,
    description,
    minDonations,
    isActive: true,
    imageUrl,
  };

  store.perks.push(newPerk);
  writeStore(store);

  return NextResponse.json({ ok: true, perk: newPerk });
}

// DELETE /api/partner/perks
// body: { partnerId, perkId } -> soft delete (isActive=false)
export async function DELETE(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const partnerId = Number(body?.partnerId);
  const perkId = Number(body?.perkId);

  if (!Number.isFinite(partnerId) || partnerId <= 0) {
    return jsonError("partnerId must be a positive number.");
  }
  if (!Number.isFinite(perkId) || perkId <= 0) {
    return jsonError("perkId must be a positive number.");
  }

  const store = readStore();
  const idx = store.perks.findIndex(
    (p) => p.partnerId === partnerId && p.perkId === perkId,
  );

  if (idx === -1) return jsonError("Perk not found.", 404);

  store.perks[idx] = { ...store.perks[idx], isActive: false };
  writeStore(store);

  return NextResponse.json({ ok: true });
}
