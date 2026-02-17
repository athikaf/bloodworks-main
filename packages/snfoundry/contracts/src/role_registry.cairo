#[starknet::contract]
mod RoleRegistry {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::Map;

    // Storage access traits (needed for .read/.write)
    use starknet::storage::StoragePointerReadAccess;
    use starknet::storage::StoragePointerWriteAccess;
    use starknet::storage::StorageMapReadAccess;
    use starknet::storage::StorageMapWriteAccess;

    // -------------------------
    // Roles (u8)
    // -------------------------
    const ROLE_DONOR: u8 = 0;
    const ROLE_PARTNER: u8 = 1;
    const ROLE_BLOODBANK_ADMIN: u8 = 2;
    const ROLE_PLATFORM_ADMIN: u8 = 3;

    // -------------------------
    // Errors
    // -------------------------
    const ERR_NOT_OWNER: felt252 = 'NOT_OWNER';
    const ERR_BAD_ROLE: felt252 = 'BAD_ROLE';
    const ERR_NOT_PARTNER: felt252 = 'NOT_PARTNER';

    // -------------------------
    // Storage
    // -------------------------
    #[storage]
    struct Storage {
        // Platform admin / contract owner
        owner: ContractAddress,

        // address -> role
        roles: Map<ContractAddress, u8>,

        // partner wallet address -> partner_id (only if PARTNER)
        partner_ids: Map<ContractAddress, u32>,
    }

    // -------------------------
    // Events
    // -------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnershipTransferred: OwnershipTransferred,
        RoleUpdated: RoleUpdated,
        PartnerIdUpdated: PartnerIdUpdated,
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
    }

    #[derive(Drop, starknet::Event)]
    struct PartnerIdUpdated {
        account: ContractAddress,
        partner_id: u32,
    }

    // -------------------------
    // Constructor
    // -------------------------
    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        // Optional: explicitly set owner's role to PLATFORM_ADMIN
        self.roles.write(owner, ROLE_PLATFORM_ADMIN);
    }

    // -------------------------
    // Internal helpers
    // -------------------------
    fn assert_owner(self: @ContractState) {
        let caller = get_caller_address();
        let owner = self.owner.read();
        assert(caller == owner, ERR_NOT_OWNER);
    }

    fn assert_valid_role(role: u8) {
        // Allow 0..=3 only
        assert(role <= ROLE_PLATFORM_ADMIN, ERR_BAD_ROLE);
    }

    // -------------------------
    // Interface
    // -------------------------
    #[starknet::interface]
    trait IRoleRegistry<TContractState> {
        // ownership
        fn owner(self: @TContractState) -> ContractAddress;
        fn transfer_ownership(ref self: TContractState, new_owner: ContractAddress);

        // roles
        fn get_role(self: @TContractState, account: ContractAddress) -> u8;
        fn set_role(ref self: TContractState, account: ContractAddress, role: u8);

        // convenience checks
        fn is_platform_admin(self: @TContractState, account: ContractAddress) -> bool;
        fn is_bloodbank_admin(self: @TContractState, account: ContractAddress) -> bool;
        fn is_partner(self: @TContractState, account: ContractAddress) -> bool;

        // partner ids
        fn get_partner_id(self: @TContractState, account: ContractAddress) -> u32;
        fn set_partner_id(ref self: TContractState, account: ContractAddress, partner_id: u32);
    }

    #[abi(embed_v0)]
    impl RoleRegistryImpl of IRoleRegistry<ContractState> {
        // -------------------------
        // Ownership
        // -------------------------
        fn owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            assert_owner(@self);

            let old = self.owner.read();
            self.owner.write(new_owner);

            // Ensure new owner is also PLATFORM_ADMIN
            self.roles.write(new_owner, ROLE_PLATFORM_ADMIN);

            self.emit(OwnershipTransferred { old_owner: old, new_owner });
        }

        // -------------------------
        // Roles
        // -------------------------
        fn get_role(self: @ContractState, account: ContractAddress) -> u8 {
            // If role not set, Map returns default value 0 (ROLE_DONOR)
            self.roles.read(account)
        }

        fn set_role(ref self: ContractState, account: ContractAddress, role: u8) {
            assert_owner(@self);
            assert_valid_role(role);

            let old = self.roles.read(account);
            self.roles.write(account, role);

            self.emit(RoleUpdated { account, old_role: old, new_role: role });
        }

        // -------------------------
        // Convenience checks
        // -------------------------
        fn is_platform_admin(self: @ContractState, account: ContractAddress) -> bool {
            self.roles.read(account) == ROLE_PLATFORM_ADMIN
        }

        fn is_bloodbank_admin(self: @ContractState, account: ContractAddress) -> bool {
            self.roles.read(account) == ROLE_BLOODBANK_ADMIN
        }

        fn is_partner(self: @ContractState, account: ContractAddress) -> bool {
            self.roles.read(account) == ROLE_PARTNER
        }

        // -------------------------
        // Partner IDs
        // -------------------------
        fn get_partner_id(self: @ContractState, account: ContractAddress) -> u32 {
            self.partner_ids.read(account)
        }

        fn set_partner_id(ref self: ContractState, account: ContractAddress, partner_id: u32) {
            assert_owner(@self);

            // Enforce: only PARTNER addresses can hold a partner_id
            assert(self.roles.read(account) == ROLE_PARTNER, ERR_NOT_PARTNER);

            self.partner_ids.write(account, partner_id);
            self.emit(PartnerIdUpdated { account, partner_id });
        }
    }
}