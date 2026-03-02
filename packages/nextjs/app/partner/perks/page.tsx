"use client";

import { useMemo, useState } from "react";
// import Image from "next/image";

import { usePartnerContext } from "~~/hooks/bloodworks/usePartnerContext";
import {
  usePartnerPerksMetadata,
  PerkMeta,
} from "~~/hooks/bloodworks/usePartnerPerksMetadata";
import { usePerkOnchainStatus } from "~~/hooks/bloodworks/usePerkOnchainStatus";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

type FormState = {
  perkId?: number; // optional; server can allocate
  title: string;
  description: string;
  image: string;
  minDonations: number;
  terms: string;
  ctaLabel: string;
  category: string;
};

const defaultForm: FormState = {
  perkId: undefined,
  title: "",
  description: "",
  image: "/perks/placeholder.png",
  minDonations: 0,
  terms: "",
  ctaLabel: "Redeem",
  category: "",
};

function parseOptionalInt(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function formatErr(e: any): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e?.message) return String(e.message);
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-1 rounded-md border border-base-300 bg-base-100 text-xs">
      <span className="opacity-70">{label}: </span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function PerkRow({
  partnerId,
  perk,
  onRefresh,
}: {
  partnerId: number;
  perk: PerkMeta;
  onRefresh: () => void;
}) {
  const { perkExists, perkEnabled, totalRedemptions, isLoading, error } =
    usePerkOnchainStatus(partnerId, perk.perkId);

  // Configure writes once, pass args at call time (your hook supports overrides)
  const { sendAsync: createPerkTx, isPending: isCreating } =
    useScaffoldWriteContract({
      contractName: "BloodworksCore",
      functionName: "create_perk",
      args: [], // override per click
    });

  const { sendAsync: setEnabledTx, isPending: isToggling } =
    useScaffoldWriteContract({
      contractName: "BloodworksCore",
      functionName: "set_perk_enabled",
      args: [], // override per click
    });

  const busy = isCreating || isToggling;

  const createOnchain = async () => {
    await createPerkTx({ args: [partnerId, perk.perkId] });

    // mark metadata created
    await fetch(`/api/partner/perks/${partnerId}/mark-onchain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perkId: perk.perkId, onchainCreated: true }),
    });

    onRefresh();
  };

  const setEnabled = async (enabled: boolean) => {
    await setEnabledTx({ args: [partnerId, perk.perkId, enabled] });
    onRefresh();
  };

  return (
    <div className="border border-base-300 bg-base-100 rounded-lg p-4 flex gap-4 items-start">
      <div className="w-16 h-16 rounded-lg overflow-hidden border border-base-300 bg-base-200 flex items-center justify-center">
        {perk.image ? (
          // Use <img> for remote URLs to avoid Next/Image domain config during MVP
          <img
            src={perk.image}
            alt={perk.title}
            className="w-16 h-16 object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-xs opacity-60">No image</div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">{perk.title}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <StatPill label="perkId" value={String(perk.perkId)} />
              <StatPill
                label="minDonations"
                value={String(perk.minDonations ?? 0)}
              />
              <StatPill label="category" value={perk.category || "—"} />
            </div>
          </div>

          <div className="text-right text-xs opacity-80 space-y-1">
            <div>
              Exists:{" "}
              <span className="font-mono">
                {isLoading
                  ? "…"
                  : perkExists === undefined
                    ? "—"
                    : perkExists
                      ? "true"
                      : "false"}
              </span>
            </div>
            <div>
              Enabled:{" "}
              <span className="font-mono">
                {isLoading
                  ? "…"
                  : perkEnabled === undefined
                    ? "—"
                    : perkEnabled
                      ? "true"
                      : "false"}
              </span>
            </div>
            <div>
              Redemptions:{" "}
              <span className="font-mono">
                {isLoading
                  ? "…"
                  : totalRedemptions === undefined
                    ? "—"
                    : totalRedemptions.toString()}
              </span>
            </div>
          </div>
        </div>

        {perk.description ? (
          <div className="mt-2 text-sm opacity-80">{perk.description}</div>
        ) : null}

        {error ? (
          <div className="mt-2 text-xs text-error">
            On-chain read error: {formatErr(error)}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {perkExists === false ? (
            <button
              className={`btn btn-sm btn-primary ${busy ? "btn-disabled" : ""}`}
              onClick={createOnchain}
              disabled={busy}
            >
              {isCreating ? "Creating…" : "Create on-chain"}
            </button>
          ) : (
            <>
              <button
                className={`btn btn-sm btn-outline ${busy ? "btn-disabled" : ""}`}
                onClick={() => setEnabled(true)}
                disabled={busy}
              >
                Enable
              </button>
              <button
                className={`btn btn-sm btn-outline ${busy ? "btn-disabled" : ""}`}
                onClick={() => setEnabled(false)}
                disabled={busy}
              >
                Disable
              </button>
            </>
          )}

          <div className="text-xs opacity-60">
            metadata:onchainCreated={perk.onchainCreated ? "true" : "false"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerPerksPage() {
  const ctx = usePartnerContext();
  const partnerId = ctx.partnerId ?? 0;

  const { data, loading, err, refresh } = usePartnerPerksMetadata(partnerId);
  const perks = useMemo(() => data?.perks ?? [], [data]);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Configure create_perk writer once; override args after metadata upsert.
  const { sendAsync: createPerkTx, isPending: isCreating } =
    useScaffoldWriteContract({
      contractName: "BloodworksCore",
      functionName: "create_perk",
      args: [], // override at call-time
    });

  const submitCreate = async () => {
    if (!partnerId || partnerId <= 0) return;
    if (!form.title.trim()) {
      setToast("Title is required.");
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      // 1) Upsert metadata JSON and get perkId (server allocates if missing)
      const upsertRes = await fetch(`/api/partner/perks/${partnerId}/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perk: {
            perkId: form.perkId,
            title: form.title.trim(),
            description: form.description,
            image: form.image || "/perks/placeholder.png",
            minDonations: Number.isInteger(form.minDonations)
              ? form.minDonations
              : 0,
            terms: form.terms,
            ctaLabel: form.ctaLabel || "Redeem",
            category: form.category,
          },
        }),
      });

      const upsertJson = await upsertRes.json();
      if (!upsertJson?.ok)
        throw new Error(upsertJson?.error ?? "Metadata upsert failed");

      const perkId: number = upsertJson.perkId;

      // 2) Create on-chain with the same perkId
      await createPerkTx({ args: [partnerId, perkId] });

      // 3) Mark metadata as on-chain created
      await fetch(`/api/partner/perks/${partnerId}/mark-onchain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perkId, onchainCreated: true }),
      });

      setToast(`Perk created! perkId=${perkId}`);
      setForm(defaultForm);
      await refresh();
    } catch (e: any) {
      setToast(`Error: ${formatErr(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || isCreating;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Perks</h1>
          <div className="text-sm opacity-70">
            Create metadata (JSON) + create perk on-chain, linked by perkId.
          </div>
        </div>

        <button className="btn btn-sm btn-outline" onClick={refresh}>
          Refresh
        </button>
      </div>

      {toast ? (
        <div className="alert alert-info">
          <span className="text-sm">{toast}</span>
        </div>
      ) : null}

      {/* Create perk form */}
      <div className="border border-base-300 bg-base-100 rounded-lg p-4">
        <div className="font-semibold mb-3">Create a perk</div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="form-control">
            <div className="label">
              <span className="label-text">Perk ID (optional)</span>
            </div>
            <input
              className="input input-bordered"
              placeholder="Leave blank to auto-assign (e.g. 101)"
              value={form.perkId ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  perkId: parseOptionalInt(e.target.value),
                }))
              }
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Title *</span>
            </div>
            <input
              className="input input-bordered"
              placeholder="Free coffee"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </label>

          <label className="form-control md:col-span-2">
            <div className="label">
              <span className="label-text">Description</span>
            </div>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Describe the perk…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Image path</span>
            </div>
            <input
              className="input input-bordered"
              placeholder="/perks/placeholder.png"
              value={form.image}
              onChange={(e) =>
                setForm((f) => ({ ...f, image: e.target.value }))
              }
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Min donations</span>
            </div>
            <input
              className="input input-bordered"
              type="number"
              min={0}
              value={form.minDonations}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  minDonations: Number(e.target.value || 0),
                }))
              }
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">CTA label</span>
            </div>
            <input
              className="input input-bordered"
              placeholder="Redeem"
              value={form.ctaLabel}
              onChange={(e) =>
                setForm((f) => ({ ...f, ctaLabel: e.target.value }))
              }
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Category</span>
            </div>
            <input
              className="input input-bordered"
              placeholder="Food & Drink"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            />
          </label>

          <label className="form-control md:col-span-2">
            <div className="label">
              <span className="label-text">Terms</span>
            </div>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Any terms & conditions…"
              value={form.terms}
              onChange={(e) =>
                setForm((f) => ({ ...f, terms: e.target.value }))
              }
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className={`btn btn-primary ${busy ? "btn-disabled" : ""}`}
            onClick={submitCreate}
            disabled={busy}
          >
            {busy ? "Creating…" : "Create perk (JSON + on-chain)"}
          </button>

          <button
            className="btn btn-outline"
            onClick={() => setForm(defaultForm)}
            disabled={busy}
          >
            Reset
          </button>
        </div>

        <div className="mt-2 text-xs opacity-70">
          Note: JSON file writes persist only on a server with a persistent
          filesystem (local/VPS/Docker). Not reliable on serverless.
        </div>
      </div>

      {/* Perks list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Existing perks</div>
          <div className="text-xs opacity-70">
            {loading
              ? "Loading…"
              : err
                ? `Error: ${err}`
                : `${perks.length} perks`}
          </div>
        </div>

        {data?.error ? (
          <div className="alert alert-warning">
            <span className="text-sm">{data.error}</span>
          </div>
        ) : null}

        {perks.length === 0 ? (
          <div className="border border-base-300 bg-base-100 rounded-lg p-4 text-sm opacity-70">
            No perks yet. Create one above.
          </div>
        ) : (
          perks
            .slice()
            .sort((a, b) => a.perkId - b.perkId)
            .map((perk) => (
              <PerkRow
                key={perk.perkId}
                partnerId={partnerId}
                perk={perk}
                onRefresh={refresh}
              />
            ))
        )}
      </div>
    </div>
  );
}
