// SPDX-License-Identifier: MIT
// contracts/src/perks_registry.cairo

use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_block_timestamp;
use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess};

use core::byte_array::ByteArray;

#[starknet::contract]
mod PerksRegistry {
    use super::*;

    // -------------------------
    // Role constants (must match RoleRegistry)
    // -------------------------
    pub const ROLE_PARTNER_ADMIN: u8 = 1;
    pub const ROLE_PARTNER_OPERATOR: u8 = 4;

    // -------------------------
    // Errors
    // -------------------------
    pub const ERR_NOT_PARTNER: felt252 = 'NOT_PARTNER';
    pub const ERR_NO_PARTNER_ID: felt252 = 'NO_PARTNER_ID';
    pub const ERR_NOT_FOUND: felt252 = 'PERK_NOT_FOUND';

    // -------------------------
    // Minimal RoleRegistry interface (dispatcher)
    // -------------------------
    #[starknet::interface]
    trait IRoleRegistry<TContractState> {
        fn get_role(self: @TContractState, account: ContractAddress) -> u8;
        fn get_partner_id(self: @TContractState, account: ContractAddress) -> u32;
    }

    // -------------------------
    // Perk struct stored in contract storage
    // -------------------------
    #[derive(Drop, Serde, starknet::Store)]
    struct Perk {
        active: bool,
        min_donations: u32,
        title: ByteArray,
        description: ByteArray,
        image_url: ByteArray,
    }

    // -------------------------
    // Storage
    // -------------------------
    #[storage]
    struct Storage {
        role_registry: ContractAddress,
        // Per-partner incrementing perk id counter
        next_perk_id: Map<u32, u32>,
        // (partner_id, perk_id) -> Perk
        perks: Map<(u32, u32), Perk>,
    }

    // -------------------------
    // Events
    // (Keep events small; do not include large ByteArrays)
    // -------------------------
    #[derive(Drop, starknet::Event)]
    #[event]
    enum Event {
        PerkCreated: PerkCreated,
        PerkUpdated: PerkUpdated,
        PerkDeleted: PerkDeleted,
    }

    #[derive(Drop, starknet::Event)]
    struct PerkCreated {
        partner_id: u32,
        perk_id: u32,
        updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PerkUpdated {
        partner_id: u32,
        perk_id: u32,
        updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PerkDeleted {
        partner_id: u32,
        perk_id: u32,
        updated_at: u64,
    }

    // -------------------------
    // Constructor
    // -------------------------
    #[constructor]
    fn constructor(ref self: ContractState, role_registry: ContractAddress) {
        self.role_registry.write(role_registry);
    }

    // -------------------------
    // Internal helpers
    // -------------------------
    fn rr(self: @ContractState) -> IRoleRegistryDispatcher {
        IRoleRegistryDispatcher { contract_address: self.role_registry.read() }
    }

    fn assert_partner_admin(self: @ContractState) -> u32 {
        let caller = get_caller_address();
        let role = rr(self).get_role(caller);
        assert(role == ROLE_PARTNER_ADMIN, ERR_NOT_PARTNER);

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
    fn get_perk(
        self: @ContractState,
        partner_id: u32,
        perk_id: u32
    ) -> (bool, u32, ByteArray, ByteArray, ByteArray) {
        let p = self.perks.read((partner_id, perk_id));
        // If never written, "active" defaults false; treat that as not found
        assert(p.active, ERR_NOT_FOUND);
        (p.active, p.min_donations, p.title, p.description, p.image_url)
    }

    #[external(v0)]
    fn get_next_perk_id(self: @ContractState, partner_id: u32) -> u32 {
        self.next_perk_id.read(partner_id)
    }

    // -------------------------
    // Writes (partner admin only)
    // -------------------------
    #[external(v0)]
    fn create_perk(
        ref self: ContractState,
        min_donations: u32,
        title: ByteArray,
        description: ByteArray,
        image_url: ByteArray
    ) -> u32 {
        let pid = assert_partner_admin(@self);

        let current = self.next_perk_id.read(pid);
        let new_id = current + 1;
        self.next_perk_id.write(pid, new_id);

        let perk = Perk {
            active: true,
            min_donations,
            title,
            description,
            image_url,
        };

        self.perks.write((pid, new_id), perk);

        self.emit(Event::PerkCreated(PerkCreated {
            partner_id: pid,
            perk_id: new_id,
            updated_at: get_block_timestamp()
        }));

        new_id
    }

    #[external(v0)]
    fn update_perk(
        ref self: ContractState,
        perk_id: u32,
        active: bool,
        min_donations: u32,
        title: ByteArray,
        description: ByteArray,
        image_url: ByteArray
    ) {
        let pid = assert_partner_admin(@self);

        let existing = self.perks.read((pid, perk_id));
        // If never written, active defaults false; treat as not found
        assert(existing.active, ERR_NOT_FOUND);

        let perk = Perk {
            active,
            min_donations,
            title,
            description,
            image_url,
        };

        self.perks.write((pid, perk_id), perk);

        self.emit(Event::PerkUpdated(PerkUpdated {
            partner_id: pid,
            perk_id,
            updated_at: get_block_timestamp()
        }));
    }

    #[external(v0)]
    fn delete_perk(ref self: ContractState, perk_id: u32) {
        let pid = assert_partner_admin(@self);

        let existing = self.perks.read((pid, perk_id));
        assert(existing.active, ERR_NOT_FOUND);

        // Soft delete
        let perk = Perk {
            active: false,
            min_donations: existing.min_donations,
            title: existing.title,
            description: existing.description,
            image_url: existing.image_url,
        };

        self.perks.write((pid, perk_id), perk);

        self.emit(Event::PerkDeleted(PerkDeleted {
            partner_id: pid,
            perk_id,
            updated_at: get_block_timestamp()
        }));
    }
}