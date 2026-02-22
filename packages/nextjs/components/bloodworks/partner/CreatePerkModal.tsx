"use client";

import React, { useMemo, useState } from "react";

type CreatePerkInput = {
  title: string;
  description: string;
  minDonations: number;
  imageUrl?: string; // ✅
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreatePerkInput) => Promise<void> | void;
};

export const CreatePerkModal: React.FC<Props> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minDonations, setMinDonations] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return (
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      minDonations >= 1
    );
  }, [title, description, minDonations]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setMinDonations(1);
    setImageUrl("");
    setErr(null);
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    setErr(null);
    if (!canSave) return;

    // Optional basic validation for URL
    const url = imageUrl.trim();
    if (url && !(url.startsWith("http://") || url.startsWith("https://"))) {
      setErr("Image URL must start with http:// or https://");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        minDonations,
        imageUrl: url || undefined,
      });
      close();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create perk.");
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-base-100 border border-base-300 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Create a perk</h3>
          <button className="btn btn-ghost btn-sm" onClick={close}>
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <label className="form-control">
            <span className="label-text text-sm">Title</span>
            <input
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Free coffee"
            />
          </label>

          <label className="form-control">
            <span className="label-text text-sm">Description</span>
            <textarea
              className="textarea textarea-bordered w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What the donor gets…"
            />
          </label>

          <label className="form-control">
            <span className="label-text text-sm">Min donations to unlock</span>
            <input
              className="input input-bordered w-full"
              type="number"
              min={1}
              value={minDonations}
              onChange={(e) => setMinDonations(Number(e.target.value))}
            />
          </label>

          {/* ✅ NEW */}
          <label className="form-control">
            <span className="label-text text-sm">Image URL (optional)</span>
            <input
              className="input input-bordered w-full"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
            <span className="text-xs opacity-60 mt-1">
              MVP: URL only (no file uploads yet).
            </span>
          </label>

          {err && <p className="text-sm text-error">{err}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={close} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!canSave || saving}
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};
