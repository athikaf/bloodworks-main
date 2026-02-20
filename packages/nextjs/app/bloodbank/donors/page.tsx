"use client";

export default function BloodbankDonorsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Donor Actions</h1>
      <p className="text-sm opacity-70 mt-0">
        Paste a donor wallet address to view status, issue credentials, and
        record donations.
      </p>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base">Coming next</h2>
          <ul className="list-disc pl-5 text-sm opacity-80 space-y-1">
            <li>Donor lookup input</li>
            <li>Read donor status (get_status)</li>
            <li>Issue credential</li>
            <li>Record donation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
