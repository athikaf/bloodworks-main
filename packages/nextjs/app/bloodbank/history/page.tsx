"use client";

import React, { useEffect, useMemo, useState } from "react";

type ActionType = "issue_credential" | "record_donation";

type HistoryItem = {
  id: string; // random id
  type: ActionType;
  donor: string;
  txHash?: string;
  createdAt: number; // ms timestamp
};

const LS_KEY = "bloodworks:bloodbank:history";

const shortHex = (v?: string, left = 6, right = 4) => {
  if (!v) return "";
  const s = v.toString();
  if (s.length <= left + right) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
};

const timeAgo = (ms: number) => {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
};

export default function BloodbankHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage if it exists (still UI-only; no dependency on workbench)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  // Persist (so you don't lose the UI list on refresh)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, loaded]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.createdAt - a.createdAt);
  }, [items]);

  const addSample = () => {
    const sample: HistoryItem = {
      id: crypto.randomUUID(),
      type: Math.random() > 0.5 ? "issue_credential" : "record_donation",
      donor:
        "0x049dfb8ce986e21d354ac93ea65e6a11f639c1934ea253e5ff14ca62eca0f38e",
      txHash:
        Math.random() > 0.5
          ? "0x071ce920711d8b400ec27698577d8254726fdf202ecb124acc694984aa984a2e"
          : undefined,
      createdAt: Date.now(),
    };
    setItems((prev) => [sample, ...prev]);
  };

  const clearAll = () => {
    setItems([]);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-sm opacity-70 mt-1">
            UI-only for now (local device list).
          </p>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline" onClick={addSample}>
            Add sample
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={clearAll}
            disabled={sorted.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          {!loaded ? (
            <p className="opacity-70">Loading…</p>
          ) : sorted.length === 0 ? (
            <p className="opacity-70">
              No history yet. (You can add a sample entry for UI testing.)
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Donor</th>
                    <th>Tx</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((it) => (
                    <tr key={it.id}>
                      <td className="font-medium">
                        {it.type === "issue_credential"
                          ? "Issue credential"
                          : "Record donation"}
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <code className="text-xs">{shortHex(it.donor)}</code>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => copyToClipboard(it.donor)}
                          >
                            Copy
                          </button>
                        </div>
                      </td>

                      <td>
                        {it.txHash ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs">
                              {shortHex(it.txHash)}
                            </code>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => copyToClipboard(it.txHash!)}
                            >
                              Copy
                            </button>
                          </div>
                        ) : (
                          <span className="opacity-60 text-sm">—</span>
                        )}
                      </td>

                      <td className="text-sm opacity-70">
                        {timeAgo(it.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-xs opacity-60 mt-3">
                Stored locally under <code>{LS_KEY}</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
