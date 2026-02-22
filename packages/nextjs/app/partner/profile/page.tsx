"use client";

export default function PartnerHistoryPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">History</h1>
      <p className="text-sm opacity-70">
        MVP: local list of recent redeems. Later: on-chain events/indexer.
      </p>
    </div>
  );
}
