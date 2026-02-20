"use client";

import React from "react";

export type ActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
  tsLabel: string; // "Today", "2d ago", etc (MVP)
};

type Props = {
  items?: ActivityItem[];
};

export const ActivityPanel: React.FC<Props> = ({ items = [] }) => {
  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Activity</h3>
        <span className="text-xs opacity-60">MVP</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm opacity-70 mt-3">
          No activity yet. After your first donation is recorded, you’ll see it
          here.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-4 bg-base-200 rounded-xl p-3"
            >
              <div>
                <p className="text-sm font-semibold">{a.title}</p>
                {a.subtitle ? (
                  <p className="text-xs opacity-70 mt-0.5">{a.subtitle}</p>
                ) : null}
              </div>
              <div className="text-xs opacity-60 whitespace-nowrap">
                {a.tsLabel}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs opacity-60 mt-4">
        Later we’ll replace this with on-chain event indexing (DonationRecorded,
        PerkRedeemed).
      </p>
    </div>
  );
};
