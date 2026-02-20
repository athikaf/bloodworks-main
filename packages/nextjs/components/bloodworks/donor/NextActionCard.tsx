"use client";

type DonorStatus = {
  issued: boolean;
  donationCount: number;
  lastDonationTs: number;
  cooldownEndTs: number;
  isActive: boolean;
};

function getNextAction(status?: DonorStatus) {
  if (!status)
    return {
      title: "No on-chain status yet",
      body: "Ask the bloodbank to issue your donor credential.",
    };

  if (!status.issued) {
    return {
      title: "Get your donor credential",
      body: "Your credential isn’t issued yet. Ask the bloodbank/admin to issue it after your donation.",
    };
  }

  if (status.isActive) {
    return {
      title: "You can redeem perks",
      body: "Your credential is active. Open Perks to see what’s unlocked for your donation count.",
    };
  }

  return {
    title: "Cooldown in progress",
    body: "Your credential is inactive during cooldown. We’ll notify you when it’s time to donate again.",
  };
}

export function NextActionCard({
  isLoading,
  status,
}: {
  isLoading: boolean;
  status?: DonorStatus;
}) {
  const next = getNextAction(status);

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body">
        <h2 className="card-title">Next action</h2>

        {isLoading ? (
          <p>Deriving next step…</p>
        ) : (
          <>
            <p className="font-semibold">{next.title}</p>
            <p className="opacity-70">{next.body}</p>
          </>
        )}
      </div>
    </div>
  );
}
