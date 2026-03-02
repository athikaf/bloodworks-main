"use client";

import { useState } from "react";

type Item = { ts: number; title: string; detail?: string };

export const PartnerHistoryPanel = () => {
  const [items] = useState<Item[]>([
    {
      ts: Date.now() - 1000 * 60 * 5,
      title: "Added perk",
      detail: "Free Coffee",
    },
    {
      ts: Date.now() - 1000 * 60 * 20,
      title: "Added operator",
      detail: "0xabc…123",
    },
  ]);

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-lg">Recent Activity</h2>
        <p className="text-sm opacity-70">
          MVP: local activity. Later: indexed on-chain events.
        </p>

        <div className="divider" />

        {items.length === 0 ? (
          <p className="text-sm opacity-70">No activity yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((it) => (
              <div key={it.ts} className="p-3 rounded-lg bg-base-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm">{it.title}</p>
                  <p className="text-xs opacity-60">
                    {new Date(it.ts).toLocaleString()}
                  </p>
                </div>
                {it.detail ? (
                  <p className="text-sm opacity-70 mt-1">{it.detail}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
