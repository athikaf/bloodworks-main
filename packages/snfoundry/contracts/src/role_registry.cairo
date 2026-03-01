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
    const ROLE_BLOODBANK: u8 = 2;
    const ROLE_PLATFORM_ADMIN: u8 = 3;
    const ROLE_OPERATOR: u8 = 4;

    // -------------------------
    // Errors
    // -------------------------
    const ERR_NOT_OWNER: felt252 = 'NOT_OWNER';
    const ERR_BAD_ROLE: felt252 = 'BAD_ROLE';
    const ERR_NOT_PLATFORM_ADMIN: felt252 = 'NOT_PLATFORM_ADMIN';
    const ERR_NOT_AUTHORIZED: felt252 = 'NOT_AUTHORIZED';
    const ERR_PARTNER_ID_NOT_SET: felt252 = 'PARTNER_ID_NOT_SET';
    const ERR_OPERATOR_ALREADY_BOUND: felt252 = 'OP_ALREADY_BOUND';
    const ERR_ROLE_USE_SET_PARTNER: felt252 = 'USE_SET_PARTNER';
    const ERR_ROLE_USE_SET_OPERATOR: felt252 = 'USE_SET_OPERATOR';

    // -------------------------
    // Storage
    // -------------------------
    #[storage]
    struct Storage {
        // contract owner (also PLATFORM_ADMIN)
        owner: ContractAddress,

        // address -> role
        roles: Map<ContractAddress, u8>,

        // partner wallet -> partner_id
        partner_id: Map<ContractAddress, u32>,

        // operator wallet -> partner_id (bound once forever)
        operator_partner_id: Map<ContractAddress, u32>,

        // operator wallet -> enabled
        operator_enabled: Map<ContractAddress, bool>,
    }

    // -------------------------
    // Events
    // -------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnershipTransferred: OwnershipTransferred,
        RoleUpdated: RoleUpdated,
        PartnerSet: PartnerSet,
        OperatorSet: OperatorSet,
        OperatorEnabledChanged: OperatorEnabledChanged,
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
    struct PartnerSet {
        account: ContractAddress,
        partner_id: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct OperatorSet {
        operator: ContractAddress,
        partner_id: u32,
        enabled: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct OperatorEnabledChanged {
        operator: ContractAddress,
        enabled: bool,
    }

    // -------------------------
    // Constructor
    // -------------------------
    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
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
        assert(role <= ROLE_OPERATOR, ERR_BAD_ROLE);
    }

    fn is_platform_admin_addr(self: @ContractState, a: ContractAddress) -> bool {
        self.roles.read(a) == ROLE_PLATFORM_ADMIN
    }

    fn is_partner_addr(self: @ContractState, a: ContractAddress) -> bool {
        self.roles.read(a) == ROLE_PARTNER
    }

    fn assert_platform_admin(self: @ContractState) {
        let caller = get_caller_address();
        assert(is_platform_admin_addr(self, caller), ERR_NOT_PLATFORM_ADMIN);
    }

    // Platform Admin OR Partner managing their own partner_id
    fn assert_can_manage_partner_id(self: @ContractState, partner_id: u32) {
        let caller = get_caller_address();

        if is_platform_admin_addr(self, caller) {
            return ();
        }

        assert(is_partner_addr(self, caller), ERR_NOT_AUTHORIZED);

        let my_pid = self.partner_id.read(caller);
        assert(my_pid != 0, ERR_PARTNER_ID_NOT_SET);
        assert(my_pid == partner_id, ERR_NOT_AUTHORIZED);
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

        // partner
        fn set_partner(ref self: TContractState, account: ContractAddress, partner_id: u32);
        fn get_partner_id(self: @TContractState, account: ContractAddress) -> u32;

        // operator
        fn set_operator(ref self: TContractState, operator: ContractAddress, partner_id: u32);
        fn get_operator_partner_id(self: @TContractState, operator: ContractAddress) -> u32;
        fn is_operator_enabled(self: @TContractState, operator: ContractAddress) -> bool;
        fn enable_operator(ref self: TContractState, operator: ContractAddress);
        fn disable_operator(ref self: TContractState, operator: ContractAddress);

        // convenience checks
        fn is_platform_admin(self: @TContractState, account: ContractAddress) -> bool;
        fn is_bloodbank(self: @TContractState, account: ContractAddress) -> bool;
        fn is_partner(self: @TContractState, account: ContractAddress) -> bool;
        fn is_operator(self: @TContractState, account: ContractAddress) -> bool;
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
            let old_role = self.roles.read(new_owner);
            self.roles.write(new_owner, ROLE_PLATFORM_ADMIN);
            if old_role != ROLE_PLATFORM_ADMIN {
                self.emit(RoleUpdated { account: new_owner, old_role, new_role: ROLE_PLATFORM_ADMIN });
            }

            self.emit(OwnershipTransferred { old_owner: old, new_owner });
        }

        // -------------------------
        // Roles
        // -------------------------
        fn get_role(self: @ContractState, account: ContractAddress) -> u8 {
            self.roles.read(account) // default 0 => DONOR
        }

        // Admin-only, but restricted:
        // - allowed: DONOR, BLOODBANK, PLATFORM_ADMIN
        // - disallowed: PARTNER, OPERATOR (must use set_partner/set_operator)
        fn set_role(ref self: ContractState, account: ContractAddress, role: u8) {
            assert_platform_admin(@self);
            assert_valid_role(role);

            assert(role != ROLE_PARTNER, ERR_ROLE_USE_SET_PARTNER);
            assert(role != ROLE_OPERATOR, ERR_ROLE_USE_SET_OPERATOR);

            let old = self.roles.read(account);
            self.roles.write(account, role);

            self.emit(RoleUpdated { account, old_role: old, new_role: role });
        }

        // -------------------------
        // Partner
        // -------------------------
        fn set_partner(ref self: ContractState, account: ContractAddress, partner_id: u32) {
            assert_platform_admin(@self);

            // enforce partner_id != 0
            assert(partner_id != 0, ERR_PARTNER_ID_NOT_SET);

            let old_role = self.roles.read(account);
            self.roles.write(account, ROLE_PARTNER);
            if old_role != ROLE_PARTNER {
                self.emit(RoleUpdated { account, old_role, new_role: ROLE_PARTNER });
            }

            self.partner_id.write(account, partner_id);
            self.emit(PartnerSet { account, partner_id });
        }

        fn get_partner_id(self: @ContractState, account: ContractAddress) -> u32 {
            self.partner_id.read(account)
        }

        // -------------------------
        // Operator
        // -------------------------
        fn set_operator(ref self: ContractState, operator: ContractAddress, partner_id: u32) {
            assert_can_manage_partner_id(@self, partner_id);

            // operator can only be bound ONCE (one partner forever)
            let existing = self.operator_partner_id.read(operator);
            assert(existing == 0, ERR_OPERATOR_ALREADY_BOUND);

            let old_role = self.roles.read(operator);
            self.roles.write(operator, ROLE_OPERATOR);
            if old_role != ROLE_OPERATOR {
                self.emit(RoleUpdated { account: operator, old_role, new_role: ROLE_OPERATOR });
            }

            self.operator_partner_id.write(operator, partner_id);
            self.operator_enabled.write(operator, true);

            self.emit(OperatorSet { operator, partner_id, enabled: true });
        }

        fn get_operator_partner_id(self: @ContractState, operator: ContractAddress) -> u32 {
            self.operator_partner_id.read(operator)
        }

        fn is_operator_enabled(self: @ContractState, operator: ContractAddress) -> bool {
            self.operator_enabled.read(operator)
        }

        fn enable_operator(ref self: ContractState, operator: ContractAddress) {
            let pid = self.operator_partner_id.read(operator);
            assert(pid != 0, ERR_PARTNER_ID_NOT_SET);

            assert_can_manage_partner_id(@self, pid);
            assert(self.roles.read(operator) == ROLE_OPERATOR, ERR_BAD_ROLE);

            self.operator_enabled.write(operator, true);
            self.emit(OperatorEnabledChanged { operator, enabled: true });
        }

        fn disable_operator(ref self: ContractState, operator: ContractAddress) {
            let pid = self.operator_partner_id.read(operator);
            assert(pid != 0, ERR_PARTNER_ID_NOT_SET);

            assert_can_manage_partner_id(@self, pid);
            assert(self.roles.read(operator) == ROLE_OPERATOR, ERR_BAD_ROLE);

            self.operator_enabled.write(operator, false);
            self.emit(OperatorEnabledChanged { operator, enabled: false });
        }

        // -------------------------
        // Convenience checks
        // -------------------------
        fn is_platform_admin(self: @ContractState, account: ContractAddress) -> bool {
            self.roles.read(account) == ROLE_PLATFORM_ADMIN
        }

        fn is_bloodbank(self: @ContractState, account: ContractAddress) -> bool {
            self.roles.read(account) == ROLE_BLOODBANK
        }

        fn is_partner(self: @ContractState, account: ContractAddress) -> bool {
            self.roles.read(account) == ROLE_PARTNER
        }

        fn is_operator(self: @ContractState, account: ContractAddress) -> bool {
            self.roles.read(account) == ROLE_OPERATOR
        }
    }
}