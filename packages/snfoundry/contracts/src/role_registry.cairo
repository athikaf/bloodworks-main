// SPDX-License-Identifier: MIT
// contracts/src/role_registry.cairo

use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_block_timestamp;
use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess};

#[starknet::contract]
mod RoleRegistry {
    use super::*;

    // -------------------------
    // Roles (u8)
    // -------------------------
    pub const ROLE_DONOR: u8 = 0;
    pub const ROLE_PARTNER_ADMIN: u8 = 1;
    pub const ROLE_BLOODBANK_ADMIN: u8 = 2;
    pub const ROLE_PLATFORM_ADMIN: u8 = 3;
    pub const ROLE_PARTNER_OPERATOR: u8 = 4;

    // -------------------------
    // Errors (felt252)
    // -------------------------
    pub const ERR_NOT_OWNER: felt252 = 'NOT_OWNER';
    pub const ERR_NOT_PLATFORM_ADMIN: felt252 = 'NOT_PLATFORM_ADMIN';
    pub const ERR_NOT_PARTNER_ADMIN: felt252 = 'NOT_PARTNER_ADMIN';
    pub const ERR_BAD_ROLE: felt252 = 'BAD_ROLE';
    pub const ERR_NO_PARTNER_ID: felt252 = 'NO_PARTNER_ID';
    pub const ERR_BAD_OPERATOR_ROLE: felt252 = 'BAD_OPERATOR_ROLE';

    // -------------------------
    // Storage
    // -------------------------
    #[storage]
    struct Storage {
        owner: ContractAddress,
        roles: Map<ContractAddress, u8>,
        partner_ids: Map<ContractAddress, u32>,
        // Optional: simple counters for platform visibility
        partner_operator_count: Map<u32, u32>,
    }

    // -------------------------
    // Events
    // -------------------------
    #[derive(Drop, starknet::Event)]
    #[event]
    enum Event {
        OwnershipTransferred: OwnershipTransferred,
        RoleUpdated: RoleUpdated,
        PartnerIdUpdated: PartnerIdUpdated,
        OperatorAdded: OperatorAdded,
        OperatorRemoved: OperatorRemoved,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        old_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct RoleUpdated {
        account: ContractAddress,
        old_role: u8,
        new_role: u8,
        updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PartnerIdUpdated {
        account: ContractAddress,
        partner_id: u32,
        updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct OperatorAdded {
        partner_id: u32,
        operator: ContractAddress,
        updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct OperatorRemoved {
        partner_id: u32,
        operator: ContractAddress,
        updated_at: u64,
    }

    // -------------------------
    // Constructor
    // -------------------------
    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    // -------------------------
    // Internal guards
    // -------------------------
    fn assert_owner(self: @ContractState) {
        let caller = get_caller_address();
        let o = self.owner.read();
        assert(caller == o, ERR_NOT_OWNER);
    }

    fn assert_platform_admin(self: @ContractState) {
        let caller = get_caller_address();
        let role = self.roles.read(caller);
        assert(role == ROLE_PLATFORM_ADMIN, ERR_NOT_PLATFORM_ADMIN);
    }

    fn assert_partner_admin(self: @ContractState) -> u32 {
        let caller = get_caller_address();
        let role = self.roles.read(caller);
        assert(role == ROLE_PARTNER_ADMIN, ERR_NOT_PARTNER_ADMIN);
        let pid = self.partner_ids.read(caller);
        assert(pid != 0, ERR_NO_PARTNER_ID);
        pid
    }

    fn is_valid_role(role: u8) -> bool {
        role == ROLE_DONOR
            || role == ROLE_PARTNER_ADMIN
            || role == ROLE_BLOODBANK_ADMIN
            || role == ROLE_PLATFORM_ADMIN
            || role == ROLE_PARTNER_OPERATOR
    }

    // -------------------------
    // Public read functions
    // -------------------------
    #[external(v0)]
    fn owner(self: @ContractState) -> ContractAddress {
        self.owner.read()
    }

    #[external(v0)]
    fn get_role(self: @ContractState, account: ContractAddress) -> u8 {
        self.roles.read(account)
    }

    #[external(v0)]
    fn get_partner_id(self: @ContractState, account: ContractAddress) -> u32 {
        self.partner_ids.read(account)
    }

    #[external(v0)]
    fn is_platform_admin(self: @ContractState, account: ContractAddress) -> bool {
        self.roles.read(account) == ROLE_PLATFORM_ADMIN
    }

    #[external(v0)]
    fn is_bloodbank_admin(self: @ContractState, account: ContractAddress) -> bool {
        self.roles.read(account) == ROLE_BLOODBANK_ADMIN
    }

    #[external(v0)]
    fn is_partner_admin(self: @ContractState, account: ContractAddress) -> bool {
        self.roles.read(account) == ROLE_PARTNER_ADMIN
    }

    #[external(v0)]
    fn is_partner_operator(self: @ContractState, account: ContractAddress) -> bool {
        self.roles.read(account) == ROLE_PARTNER_OPERATOR
    }

    #[external(v0)]
    fn get_partner_operator_count(self: @ContractState, partner_id: u32) -> u32 {
        self.partner_operator_count.read(partner_id)
    }

    // -------------------------
    // Ownership
    // -------------------------
    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        assert_owner(@self);
        let old = self.owner.read();
        self.owner.write(new_owner);
        self.emit(Event::OwnershipTransferred(
            OwnershipTransferred { old_owner: old, new_owner }
        ));
    }

    // -------------------------
    // Platform admin actions (owner)
    // -------------------------
    #[external(v0)]
    fn set_role(ref self: ContractState, account: ContractAddress, role: u8) {
        assert_owner(@self);
        assert(is_valid_role(role), ERR_BAD_ROLE);

        let old = self.roles.read(account);
        self.roles.write(account, role);

        self.emit(Event::RoleUpdated(RoleUpdated {
            account,
            old_role: old,
            new_role: role,
            updated_at: get_block_timestamp()
        }));
    }

    #[external(v0)]
    fn set_partner_id(ref self: ContractState, account: ContractAddress, partner_id: u32) {
        assert_owner(@self);
        // partner_id==0 is allowed only to unset; keep it allowed
        self.partner_ids.write(account, partner_id);

        self.emit(Event::PartnerIdUpdated(PartnerIdUpdated {
            account,
            partner_id,
            updated_at: get_block_timestamp()
        }));
    }

    // -------------------------
    // Partner-managed operator list (primary workflow)
    // Partner admin can add/remove operators under their own partner_id
    // -------------------------
    #[external(v0)]
    fn add_operator(ref self: ContractState, operator: ContractAddress) {
        let pid = assert_partner_admin(@self);

        let old_role = self.roles.read(operator);
        self.roles.write(operator, ROLE_PARTNER_OPERATOR);
        self.partner_ids.write(operator, pid);

        // increment count
        let c = self.partner_operator_count.read(pid);
        self.partner_operator_count.write(pid, c + 1);

        let now = get_block_timestamp();
        self.emit(Event::RoleUpdated(RoleUpdated {
            account: operator,
            old_role,
            new_role: ROLE_PARTNER_OPERATOR,
            updated_at: now
        }));
        self.emit(Event::PartnerIdUpdated(PartnerIdUpdated {
            account: operator,
            partner_id: pid,
            updated_at: now
        }));
        self.emit(Event::OperatorAdded(OperatorAdded {
            partner_id: pid,
            operator,
            updated_at: now
        }));
    }

    #[external(v0)]
    fn remove_operator(ref self: ContractState, operator: ContractAddress) {
        let pid = assert_partner_admin(@self);

        let op_pid = self.partner_ids.read(operator);
        assert(op_pid == pid, ERR_NO_PARTNER_ID);

        let old_role = self.roles.read(operator);
        assert(old_role == ROLE_PARTNER_OPERATOR, ERR_BAD_OPERATOR_ROLE);

        // revert to donor + unset partner_id
        self.roles.write(operator, ROLE_DONOR);
        self.partner_ids.write(operator, 0);

        // decrement count (floor at 0)
        let c = self.partner_operator_count.read(pid);
        if c > 0 {
            self.partner_operator_count.write(pid, c - 1);
        }

        let now = get_block_timestamp();
        self.emit(Event::RoleUpdated(RoleUpdated {
            account: operator,
            old_role,
            new_role: ROLE_DONOR,
            updated_at: now
        }));
        self.emit(Event::PartnerIdUpdated(PartnerIdUpdated {
            account: operator,
            partner_id: 0,
            updated_at: now
        }));
        self.emit(Event::OperatorRemoved(OperatorRemoved {
            partner_id: pid,
            operator,
            updated_at: now
        }));
    }

    // -------------------------
    // Platform override (emergency)
    // Owner can add/remove operators for a specific partner_id
    // -------------------------
    #[external(v0)]
    fn admin_add_operator(ref self: ContractState, partner_id: u32, operator: ContractAddress) {
        assert_owner(@self);
        assert(partner_id != 0, ERR_NO_PARTNER_ID);

        let old_role = self.roles.read(operator);
        self.roles.write(operator, ROLE_PARTNER_OPERATOR);
        self.partner_ids.write(operator, partner_id);

        let c = self.partner_operator_count.read(partner_id);
        self.partner_operator_count.write(partner_id, c + 1);

        let now = get_block_timestamp();
        self.emit(Event::RoleUpdated(RoleUpdated {
            account: operator,
            old_role,
            new_role: ROLE_PARTNER_OPERATOR,
            updated_at: now
        }));
        self.emit(Event::PartnerIdUpdated(PartnerIdUpdated {
            account: operator,
            partner_id,
            updated_at: now
        }));
        self.emit(Event::OperatorAdded(OperatorAdded {
            partner_id,
            operator,
            updated_at: now
        }));
    }

    #[external(v0)]
    fn admin_remove_operator(ref self: ContractState, partner_id: u32, operator: ContractAddress) {
        assert_owner(@self);
        assert(partner_id != 0, ERR_NO_PARTNER_ID);

        let op_pid = self.partner_ids.read(operator);
        assert(op_pid == partner_id, ERR_NO_PARTNER_ID);

        let old_role = self.roles.read(operator);
        assert(old_role == ROLE_PARTNER_OPERATOR, ERR_BAD_OPERATOR_ROLE);

        self.roles.write(operator, ROLE_DONOR);
        self.partner_ids.write(operator, 0);

        let c = self.partner_operator_count.read(partner_id);
        if c > 0 {
            self.partner_operator_count.write(partner_id, c - 1);
        }

        let now = get_block_timestamp();
        self.emit(Event::RoleUpdated(RoleUpdated {
            account: operator,
            old_role,
            new_role: ROLE_DONOR,
            updated_at: now
        }));
        self.emit(Event::PartnerIdUpdated(PartnerIdUpdated {
            account: operator,
            partner_id: 0,
            updated_at: now
        }));
        self.emit(Event::OperatorRemoved(OperatorRemoved {
            partner_id,
            operator,
            updated_at: now
        }));
    }
}