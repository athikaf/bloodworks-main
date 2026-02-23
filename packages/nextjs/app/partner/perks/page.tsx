"use client";

export default function PartnerPerksPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Perks</h1>
      <p className="text-sm opacity-70">
        Add, update, or delete perks for your partner account.
      </p>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <p className="opacity-70 text-sm">
            Next: we’ll wire this to{" "}
            <span className="font-semibold">PerksRegistry</span>:
          </p>
          <ul className="list-disc ml-5 text-sm opacity-80 mt-2">
            <li>Create perk (title, description, minDonations, imageUrl)</li>
            <li>Delete perk</li>
            <li>List perks for your partnerId</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
