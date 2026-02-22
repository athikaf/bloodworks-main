// SPDX-License-Identifier: MIT
// contracts/src/bloodworks_core.cairo

use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_block_timestamp;
use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess};

#[starknet::contract]
mod BloodworksCore {
    use super::*;

    // -------------------------
    // Roles (must match RoleRegistry)
    // -------------------------
    pub const ROLE_PARTNER_ADMIN: u8 = 1;
    pub const ROLE_BLOODBANK_ADMIN: u8 = 2;
    pub const ROLE_PARTNER_OPERATOR: u8 = 4;

    // -------------------------
    // Errors
    // -------------------------
    pub const ERR_NOT_BLOODBANK: felt252 = 'NOT_BLOODBANK';
    pub const ERR_NOT_PARTNER: felt252 = 'NOT_PARTNER';
    pub const ERR_NOT_ISSUED: felt252 = 'NOT_ISSUED';
    pub const ERR_COOLDOWN: felt252 = 'COOLDOWN';
    pub const ERR_ALREADY_REDEEMED: felt252 = 'ALREADY_REDEEMED';
    pub const ERR_NO_PARTNER_ID: felt252 = 'NO_PARTNER_ID';

    // -------------------------
    // RoleRegistry interface
    // -------------------------
    #[starknet::interface]
    trait IRoleRegistry<TContractState> {
        fn get_role(self: @TContractState, account: ContractAddress) -> u8;
        fn get_partner_id(self: @TContractState, account: ContractAddress) -> u32;
    }

    // -------------------------
    // Storage
    // -------------------------
    #[storage]
    struct Storage {
        role_registry: ContractAddress,
        cooldown_seconds: u64,

        // Donor status
        issued: Map<ContractAddress, bool>,
        donation_count: Map<ContractAddress, u32>,
        last_donation_ts: Map<ContractAddress, u64>,
        cooldown_end_ts: Map<ContractAddress, u64>,

        // Redemption status
        redeemed: Map<(ContractAddress, u32, u32), bool>, // (donor, partner_id, perk_id) => bool

        // Impact metrics (for partner competition)
        perk_redemption_count: Map<(u32, u32), u32>, // (partner_id, perk_id) => count
        partner_total_redemptions: Map<u32, u32>,    // partner_id => total redeemed
    }

    // -------------------------
    // Events
    // -------------------------
    #[derive(Drop, starknet::Event)]
    #[event]
    enum Event {
        CredentialIssued: CredentialIssued,
        DonationRecorded: DonationRecorded,
        PerkRedeemed: PerkRedeemed,
    }

    #[derive(Drop, starknet::Event)]
    struct CredentialIssued {
        donor: ContractAddress,
        issued_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct DonationRecorded {
        donor: ContractAddress,
        donation_count: u32,
        last_donation_ts: u64,
        cooldown_end_ts: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PerkRedeemed {
        donor: ContractAddress,
        partner_id: u32,
        perk_id: u32,
        redeemed_at: u64,
    }

    // -------------------------
    // Constructor
    // -------------------------
    #[constructor]
    fn constructor(
        ref self: ContractState,
        role_registry: ContractAddress,
        cooldown_seconds: u64
    ) {
        self.role_registry.write(role_registry);
        self.cooldown_seconds.write(cooldown_seconds);
    }

    // -------------------------
    // Internal helpers
    // -------------------------
    fn rr(self: @ContractState) -> IRoleRegistryDispatcher {
        IRoleRegistryDispatcher { contract_address: self.role_registry.read() }
    }

    fn assert_bloodbank(self: @ContractState) {
        let caller = get_caller_address();
        let role = rr(self).get_role(caller);
        assert(role == ROLE_BLOODBANK_ADMIN, ERR_NOT_BLOODBANK);
    }

    fn assert_partner_or_operator(self: @ContractState) -> u32 {
        let caller = get_caller_address();
        let role = rr(self).get_role(caller);
        assert(
            role == ROLE_PARTNER_ADMIN || role == ROLE_PARTNER_OPERATOR,
            ERR_NOT_PARTNER
        );

        let pid = rr(self).get_partner_id(caller);
        assert(pid != 0, ERR_NO_PARTNER_ID);
        pid
    }

    // -------------------------
    // Reads
    // -------------------------
    #[external(v0)]
    fn get_role_registry(self: @ContractState) -> ContractAddress {
        self.role_registry.read()
    }

    #[external(v0)]
    fn is_redeemed(self: @ContractState, donor: ContractAddress, partner_id: u32, perk_id: u32) -> bool {
        self.redeemed.read((donor, partner_id, perk_id))
    }

    /// Returns:
    /// (issued, donation_count, last_donation_ts, cooldown_end_ts, is_active)
    #[external(v0)]
    fn get_status(self: @ContractState, donor: ContractAddress) -> (bool, u32, u64, u64, bool) {
        let issued = self.issued.read(donor);
        let dc = self.donation_count.read(donor);
        let last_ts = self.last_donation_ts.read(donor);
        let end_ts = self.cooldown_end_ts.read(donor);

        let now = get_block_timestamp();
        let active = issued && (end_ts == 0 || now >= end_ts);

        (issued, dc, last_ts, end_ts, active)
    }

    #[external(v0)]
    fn is_active(self: @ContractState, donor: ContractAddress) -> bool {
        let issued = self.issued.read(donor);
        if !issued {
            return false;
        }
        let end_ts = self.cooldown_end_ts.read(donor);
        let now = get_block_timestamp();
        end_ts == 0 || now >= end_ts
    }

    // Partner competition metrics
    #[external(v0)]
    fn get_partner_total_redemptions(self: @ContractState, partner_id: u32) -> u32 {
        self.partner_total_redemptions.read(partner_id)
    }

    #[external(v0)]
    fn get_perk_redemption_count(self: @ContractState, partner_id: u32, perk_id: u32) -> u32 {
        self.perk_redemption_count.read((partner_id, perk_id))
    }

    // -------------------------
    // Writes (bloodbank)
    // -------------------------
    #[external(v0)]
    fn issue_credential(ref self: ContractState, donor: ContractAddress) {
        assert_bloodbank(@self);

        self.issued.write(donor, true);

        // initialize if first time
        if self.donation_count.read(donor) == 0 {
            self.donation_count.write(donor, 0);
        }
        if self.last_donation_ts.read(donor) == 0 {
            self.last_donation_ts.write(donor, 0);
        }
        if self.cooldown_end_ts.read(donor) == 0 {
            self.cooldown_end_ts.write(donor, 0);
        }

        self.emit(Event::CredentialIssued(CredentialIssued {
            donor,
            issued_at: get_block_timestamp()
        }));
    }

    #[external(v0)]
    fn record_donation(ref self: ContractState, donor: ContractAddress) {
        assert_bloodbank(@self);

        // no "== true" comparisons
        assert(self.issued.read(donor), ERR_NOT_ISSUED);

        let now = get_block_timestamp();
        let end_ts = self.cooldown_end_ts.read(donor);

        // If cooldown set and not finished, block
        if end_ts != 0 {
            assert(now >= end_ts, ERR_COOLDOWN);
        }

        let dc = self.donation_count.read(donor);
        let new_dc = dc + 1;

        let cd = self.cooldown_seconds.read();
        let new_end = now + cd;

        self.donation_count.write(donor, new_dc);
        self.last_donation_ts.write(donor, now);
        self.cooldown_end_ts.write(donor, new_end);

        self.emit(Event::DonationRecorded(DonationRecorded {
            donor,
            donation_count: new_dc,
            last_donation_ts: now,
            cooldown_end_ts: new_end
        }));
    }

    // -------------------------
    // Writes (partner / operator)
    // -------------------------
    #[external(v0)]
    fn redeem_perk(ref self: ContractState, donor: ContractAddress, perk_id: u32) {
        // Partner (or operator) is caller; derive partner_id from RoleRegistry
        let partner_id = assert_partner_or_operator(@self);

        assert(self.issued.read(donor), ERR_NOT_ISSUED);

        let key = (donor, partner_id, perk_id);
        let already = self.redeemed.read(key);
        assert(!already, ERR_ALREADY_REDEEMED);

        self.redeemed.write(key, true);

        // update impact counters
        let c1 = self.perk_redemption_count.read((partner_id, perk_id));
        self.perk_redemption_count.write((partner_id, perk_id), c1 + 1);

        let c2 = self.partner_total_redemptions.read(partner_id);
        self.partner_total_redemptions.write(partner_id, c2 + 1);

        self.emit(Event::PerkRedeemed(PerkRedeemed {
            donor,
            partner_id,
            perk_id,
            redeemed_at: get_block_timestamp()
        }));
    }
}