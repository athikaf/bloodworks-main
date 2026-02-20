"use client";

export default function BloodbankDashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Bloodbank Dashboard</h1>
      <p className="text-sm opacity-70">
        Use this area to issue donor credentials and record donations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base">Donor Actions</h2>
            <p className="text-sm opacity-70">
              Search a donor address, issue a credential, and record donations.
            </p>
            <div className="card-actions justify-end">
              <a className="btn btn-primary btn-sm" href="/bloodbank/donors">
                Open
              </a>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base">History</h2>
            <p className="text-sm opacity-70">
              Track recent actions (we’ll start UI-only, then index onchain).
            </p>
            <div className="card-actions justify-end">
              <a className="btn btn-ghost btn-sm" href="/bloodbank/history">
                View
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
