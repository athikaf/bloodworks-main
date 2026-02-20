"use client";

export default function BloodbankHistoryPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">History</h1>
      <p className="text-sm opacity-70 mt-0">
        We’ll start with local UI history and later replace with indexed
        on-chain events.
      </p>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <p className="text-sm opacity-70">No history yet.</p>
        </div>
      </div>
    </div>
  );
}
