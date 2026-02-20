"use client";

type DonorStatus = {
  issued: boolean;
  donationCount: number;
  lastDonationTs: number;
  cooldownEndTs: number;
  isActive: boolean;
};

export function DonorStatusCard({
  isLoading,
  status,
}: {
  isLoading: boolean;
  status?: DonorStatus;
}) {
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body">
        <h2 className="card-title">Your status</h2>

        {isLoading && <p>Loading status…</p>}

        {!isLoading && !status && (
          <p className="opacity-70">
            No status found yet. (This usually means you haven’t been issued a
            credential on-chain.)
          </p>
        )}

        {!isLoading && status && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-base-200">
              <p className="text-xs opacity-70">Credential</p>
              <p className="font-semibold">
                {status.issued ? "Issued" : "Not issued"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-base-200">
              <p className="text-xs opacity-70">Active</p>
              <p className="font-semibold">
                {status.isActive ? "Yes (perks available)" : "No (cooldown)"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-base-200">
              <p className="text-xs opacity-70">Donation count</p>
              <p className="font-semibold">{status.donationCount}</p>
            </div>

            <div className="p-3 rounded-lg bg-base-200">
              <p className="text-xs opacity-70">Cooldown end</p>
              <p className="font-semibold">
                {status.cooldownEndTs ? `${status.cooldownEndTs}` : "—"}
              </p>
              <p className="text-xs opacity-60">
                (MVP: raw timestamp; we’ll format later)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
