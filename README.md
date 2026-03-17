# ❤️ OneHeart Protocol

> Turning acts of kindness into verifiable impact.

OneHeart is a decentralized protocol built on Starknet that transforms blood donations into verifiable on-chain impact. It connects donors, blood banks, and partner organizations into a unified ecosystem where generosity is recognized, rewarded, and amplified.

---

## 🌍 Vision

We believe humanity shares **one heart**.

Every act of giving should:

- Be trusted
- Be recognized
- Create compounding impact

OneHeart enables this through blockchain-powered verification and transparent incentive systems.

---

## ⚙️ What OneHeart Does

- 🩸 Verifies blood donations on-chain
- 🎁 Enables donors to redeem real-world perks
- 🏆 Allows brands to compete on measurable social impact
- 📊 Tracks redemption and engagement metrics
- ⏳ Supports seasonal impact leaderboards (6-month cycles)

---

## 🧱 Tech Stack

- **Blockchain:** Starknet (Cairo 2.x)
- **Frontend:** Next.js (App Router)
- **Framework:** Scaffold-Stark
- **Wallet Integration:** starknet-react
- **Architecture:** Hybrid (On-chain + Off-chain analytics)

---

## 🏗️ System Architecture

### 🔐 On-Chain (Starknet)

Stores only **canonical, enforceable data**:

- Donor credentials
- Donation counts
- Perk registry
- Redemption counters
- Role system
- Event emissions

### 📡 Off-Chain

Handles:

- Analytics (unique donors, trends)
- Leaderboards
- Metadata (perk details)
- Aggregation APIs

---

## 👥 Role System

Managed via `RoleRegistry` contract:

| Role           | Description                                 |
| -------------- | ------------------------------------------- |
| Donor          | Receives credentials and redeems perks      |
| Partner        | Brand owning perks and tracking impact      |
| Bloodbank      | Issues credentials and records donations    |
| Operator       | Executes perk redemptions (franchise staff) |
| Platform Admin | Oversees entire ecosystem                   |

---

## 📜 Smart Contracts

### 1. RoleRegistry

Handles:

- Role assignment
- Partner mapping
- Operator management

### 2. OneHeartCore (formerly BloodworksCore)

Handles:

- Credential issuance
- Donation tracking
- Perk lifecycle
- Redemption execution
- Event emission

---

## 🩸 Donation Flow

1. Bloodbank issues credential → `issue_credential`
2. Bloodbank records donation → `record_donation`
3. Donor's on-chain status updates:
   - donation_count
   - cooldown
   - active status

---

## 🎁 Perk System

### Off-Chain Metadata (MVP)

data/{partnerId}/perks.json

### On-Chain State

- `perk_exists`
- `perk_enabled`
- `perk_total_redemptions`
- `partner_total_redemptions`

---

## 🔁 Redemption Flow

1. Operator initiates redemption
2. Contract validates:
   - Operator role
   - Partner association
   - Perk existence + enabled status
3. Updates counters
4. Emits `PerkRedeemed` event

> ⚠️ Eligibility (e.g., min donations) is enforced on the frontend.

---

## 📊 Hybrid Impact Model

### On-Chain

- Minimal counters
- Security enforcement
- Event emission

### Off-Chain

- Unique donors
- Repeat engagement
- Leaderboards
- Time-based analytics

---

## 📡 Events (Source of Truth)

- `CredentialIssued`
- `DonationRecorded`
- `PerkCreated`
- `PerkEnabledChanged`
- `PerkRedeemed`

---

## 🖥️ Frontend Structure

Role-based routing:

/donor
/bloodbank
/partner
/operator

### Donor

- Dashboard
- Perks (aggregated across partners)
- History
- Profile

### Bloodbank

- Issue credentials
- Record donations

### Partner

- Impact dashboard
- Perk management
- Operator assignment

### Operator

- Donor lookup
- Redemption execution

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/oneheart.git
cd oneheart
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Run Starknet Devnet

```bash
yarn chain
```

### 4. Deploy contracts

```bash
yarn deploy
```

### 5. Start local dev

```bash
yarn dev
```
