"use client";

import { useMemo, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

type PerkForm = {
  title: string;
  description: string;
  imageUrl: string;
  minDonations: number;
};

function safeNumber(input: unknown): number | undefined {
  if (input === null || input === undefined) return undefined;
  if (typeof input === "number") return input;
  if (typeof input === "bigint") return Number(input);
  if (Array.isArray(input) && input.length > 0) return safeNumber(input[0]);
  if (typeof input === "object" && input && "value" in (input as any)) {
    return safeNumber((input as any).value);
  }
  return undefined;
}

export const PartnerPerksWorkbench = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected" && !!address;

  const { data: partnerIdRaw, isLoading: partnerIdLoading } =
    useScaffoldReadContract({
      contractName: "RoleRegistry",
      functionName: "get_partner_id",
      args: address ? ([address] as const) : undefined,
      enabled: isConnected,
      watch: false,
    } as never);

  const partnerId = useMemo(() => safeNumber(partnerIdRaw), [partnerIdRaw]);

  const [localPerks, setLocalPerks] = useState<
    Array<{
      id: number;
      title: string;
      description: string;
      imageUrl: string;
      minDonations: number;
    }>
  >([]);

  const [form, setForm] = useState<PerkForm>({
    title: "",
    description: "",
    imageUrl: "",
    minDonations: 1,
  });

  const { sendAsync: addPerkAsync, isPending: adding } =
    useScaffoldWriteContract({
      contractName: "PerksRegistry",
      functionName: "add_perk",
    } as never);

  const { sendAsync: deletePerkAsync, isPending: deleting } =
    useScaffoldWriteContract({
      contractName: "PerksRegistry",
      functionName: "delete_perk",
    } as never);

  const canSubmit =
    isConnected &&
    partnerId !== undefined &&
    form.title.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.minDonations >= 1;

  const onAdd = async () => {
    if (!canSubmit) return;

    const newLocalId = Date.now();

    // optimistic local add (MVP)
    setLocalPerks((p) => [
      ...p,
      {
        id: newLocalId,
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        minDonations: form.minDonations,
      },
    ]);

    try {
      await addPerkAsync({
        args: [
          BigInt(partnerId),
          form.title.trim(),
          form.description.trim(),
          form.imageUrl.trim(),
          BigInt(form.minDonations),
        ] as any,
      });

      setForm({ title: "", description: "", imageUrl: "", minDonations: 1 });
    } catch (e) {
      console.error("add_perk failed", e);

      // rollback optimistic add if tx fails
      setLocalPerks((p) => p.filter((x) => x.id !== newLocalId));
    }
  };

  const onDelete = async (perkId: number) => {
    if (!isConnected || partnerId === undefined) return;

    const snapshot = localPerks;
    setLocalPerks((p) => p.filter((x) => x.id !== perkId));

    try {
      await deletePerkAsync({
        args: [BigInt(partnerId), BigInt(perkId)] as any,
      });
    } catch (e) {
      console.error("delete_perk failed", e);
      setLocalPerks(snapshot); // rollback
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body gap-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="card-title text-lg">Create a Perk</h2>
              <p className="text-sm opacity-70">
                Add a new reward. Donors unlock it when they hit the minimum
                donation count.
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs opacity-70">Partner ID</p>
              {partnerIdLoading ? (
                <p className="text-sm">Loading…</p>
              ) : (
                <p className="text-lg font-semibold">{partnerId ?? "—"}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control w-full">
              <span className="label-text text-sm">Title</span>
              <input
                className="input input-bordered m-2 w-full"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Free Tim Hortons Coffee"
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text text-sm">Min donations</span>
              <input
                type="number"
                className="input input-bordered m-2 w-full"
                value={form.minDonations}
                min={1}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minDonations: Number(e.target.value || 1),
                  }))
                }
              />
            </label>

            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-sm">Description</span>
              <textarea
                className="textarea textarea-bordered w-full"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="One coffee on us — thank you for donating."
              />
            </label>

            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-sm">Image URL (MVP)</span>
              <input
                className="input input-bordered m-2 w-full"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
                placeholder="https://…"
              />
              <span className="text-xs opacity-60 mt-2">
                This uses a URL (no uploads). Perfect for MVP.
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              disabled={!canSubmit || adding}
              onClick={onAdd}
            >
              {adding ? "Adding…" : "Add Perk"}
            </button>
          </div>

          <div className="divider my-0" />

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">Current Perks (MVP list)</h3>

            {localPerks.length === 0 ? (
              <p className="text-sm opacity-70">
                No perks yet. Add your first one.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localPerks.map((p) => (
                  <div
                    key={p.id}
                    className="card bg-base-100 border border-base-300"
                  >
                    <div className="card-body gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold">{p.title}</h4>
                          <p className="text-sm opacity-70">{p.description}</p>
                          <p className="text-xs opacity-60 mt-2">
                            Min donations:{" "}
                            <span className="font-medium">
                              {p.minDonations}
                            </span>
                          </p>
                        </div>

                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => onDelete(p.id)}
                          disabled={deleting}
                        >
                          Delete
                        </button>
                      </div>

                      {p.imageUrl ? (
                        <div className="mt-2">
                          <div className="w-full h-36 bg-base-200 rounded-lg overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
