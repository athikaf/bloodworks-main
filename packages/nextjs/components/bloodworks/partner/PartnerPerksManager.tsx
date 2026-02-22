"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Perk } from "~~/types/perk";
import { CreatePerkModal } from "./CreatePerkModal";

type Props = {
  partnerId: number;
};

export const PartnerPerksManager: React.FC<Props> = ({ partnerId }) => {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePerks = useMemo(() => perks.filter((p) => p.isActive), [perks]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/partner/perks?partnerId=${partnerId}`, {
        method: "GET",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load perks.");
      setPerks(json.perks ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load perks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  const createPerk = async (input: {
    title: string;
    description: string;
    minDonations: number;
    imageUrl?: string;
  }) => {
    setError(null);
    const res = await fetch("/api/partner/perks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId,
        title: input.title,
        description: input.description,
        minDonations: input.minDonations,
        imageUrl: input.imageUrl, // ✅
      }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Create failed.");
    await load();
  };

  const disablePerk = async (perkId: number) => {
    setError(null);
    const res = await fetch("/api/partner/perks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, perkId }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Delete failed.");
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your perks</h1>
          <p className="text-sm opacity-70">
            Add perks donors can unlock based on donation count.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>
          + Add perk
        </button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {loading ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">Loading…</div>
        </div>
      ) : activePerks.length === 0 ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="opacity-70">No perks yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activePerks.map((p) => (
            <div
              key={`${p.partnerId}:${p.perkId}`}
              className="card bg-base-100 border border-base-300"
            >
              {/* ✅ Optional image preview */}
              {p.imageUrl ? (
                <figure className="px-4 pt-4">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="rounded-xl max-h-40 w-full object-cover border border-base-300"
                    loading="lazy"
                  />
                </figure>
              ) : null}

              <div className="card-body">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="card-title text-base">{p.title}</h3>
                    <p className="text-sm opacity-80">{p.description}</p>
                    <p className="text-xs opacity-60 mt-2">
                      Unlock at{" "}
                      <span className="font-medium">{p.minDonations}</span>{" "}
                      donations • perkId{" "}
                      <span className="font-mono">{p.perkId}</span>
                    </p>
                  </div>

                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => disablePerk(p.perkId)}
                  >
                    Disable
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreatePerkModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={createPerk}
      />
    </div>
  );
};
