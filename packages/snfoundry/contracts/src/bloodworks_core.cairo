#[starknet::contract]
mod BloodworksCore {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use starknet::storage::Map;

    // Storage access traits (needed for .read/.write)
    use starknet::storage::StoragePointerReadAccess;
    use starknet::storage::StoragePointerWriteAccess;
    use starknet::storage::StorageMapReadAccess;
    use starknet::storage::StorageMapWriteAccess;

    // -------------------------
    // Role constants (must match RoleRegistry)
    // -------------------------
    const ROLE_DONOR: u8 = 0;
    const ROLE_PARTNER: u8 = 1;
    const ROLE_BLOODBANK: u8 = 2;
    const ROLE_PLATFORM_ADMIN: u8 = 3;
    const ROLE_OPERATOR: u8 = 4;

    // -------------------------
    // Errors
    // -------------------------
    const ERR_NOT_BLOODBANK: felt252 = 'NOT_BLOODBANK';
    const ERR_NOT_PARTNER: felt252 = 'NOT_PARTNER';
    const ERR_NOT_PLATFORM_ADMIN: felt252 = 'NOT_PLATFORM_ADMIN';
    const ERR_NOT_OPERATOR: felt252 = 'NOT_OPERATOR';
    const ERR_OPERATOR_DISABLED: felt252 = 'OPERATOR_DISABLED';

    const ERR_NOT_ISSUED: felt252 = 'NOT_ISSUED';
    const ERR_BAD_COOLDOWN: felt252 = 'BAD_COOLDOWN';

    const ERR_BAD_PARTNER_ID: felt252 = 'BAD_PARTNER_ID';
    const ERR_PERK_EXISTS: felt252 = 'PERK_EXISTS';
    const ERR_PERK_NOT_FOUND: felt252 = 'PERK_NOT_FOUND';
    const ERR_PERK_DISABLED: felt252 = 'PERK_DISABLED';
    const ERR_NOT_AUTHORIZED: felt252 = 'NOT_AUTHORIZED';

    // ✅ cooldown-window redeem guard
    const ERR_NOT_ACTIVE: felt252 = 'NOT_ACTIVE';
    const ERR_ALREADY_REDEEMED_THIS_WINDOW: felt252 = 'REDEEMED_THIS_WINDOW';

    // -------------------------
    // RoleRegistry interface (aligned to YOUR RoleRegistry)
    // -------------------------
    #[starknet::interface]
    trait IRoleRegistry<TContractState> {
        fn get_role(self: @TContractState, account: ContractAddress) -> u8;

        fn get_partner_id(self: @TContractState, account: ContractAddress) -> u32;

        fn get_operator_partner_id(self: @TContractState, operator: ContractAddress) -> u32;
        fn is_operator_enabled(self: @TContractState, operator: ContractAddress) -> bool;
    }

    // -------------------------
    // Storage
    // -------------------------
    #[storage]
    struct Storage {
        role_registry: ContractAddress,
        cooldown_seconds: u64,

        // donor status
        issued: Map<ContractAddress, bool>,
        donation_count: Map<ContractAddress, u32>,
        last_donation_ts: Map<ContractAddress, u64>,
        cooldown_end_ts: Map<ContractAddress, u64>,

        // minimal on-chain perk state
        perk_exists: Map<(u32, u32), bool>,  // (partner_id, perk_id)
        perk_enabled: Map<(u32, u32), bool>, // (partner_id, perk_id)

        // ✅ last redeemed timestamp per (donor, partner_id, perk_id)
        last_redeemed_ts: Map<(ContractAddress, u32, u32), u64>,

        // minimal on-chain counters
        perk_total_redemptions: Map<(u32, u32), u64>, // (partner_id, perk_id)
        partner_total_redemptions: Map<u32, u64>,     // partner_id
    }

    // -------------------------
    // Events
    // -------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CredentialIssued: CredentialIssued,
        DonationRecorded: DonationRecorded,

        PerkCreated: PerkCreated,
        PerkEnabledChanged: PerkEnabledChanged,
        PerkRedeemed: PerkRedeemed,
    }

    #[derive(Drop, starknet::Event)]
    struct CredentialIssued {
        donor: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct DonationRecorded {
        donor: ContractAddress,
        donation_count: u32,
        last_donation_ts: u64,
        cooldown_end_ts: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PerkCreated {
        partner_id: u32,
        perk_id: u32,
        created_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PerkEnabledChanged {
        partner_id: u32,
        perk_id: u32,
        enabled: bool,
        changed_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PerkRedeemed {
        donor: ContractAddress,
        partner_id: u32,
        perk_id: u32,
        operator: ContractAddress,
        redeemed_at: u64,
    }

    // -------------------------
    // Constructor
    // -------------------------
    #[constructor]
    fn constructor(ref self: ContractState, role_registry: ContractAddress, cooldown_seconds: u64) {
        assert(cooldown_seconds > 0, ERR_BAD_COOLDOWN);
        self.role_registry.write(role_registry);
        self.cooldown_seconds.write(cooldown_seconds);
    }

    // -------------------------
    // Internal helpers
    // -------------------------
    fn role_registry_dispatcher(self: @ContractState) -> IRoleRegistryDispatcher {
        IRoleRegistryDispatcher { contract_address: self.role_registry.read() }
    }

    fn assert_bloodbank(self: @ContractState) {
        let caller = get_caller_address();
        let rr = role_registry_dispatcher(self);
        assert(rr.get_role(caller) == ROLE_BLOODBANK, ERR_NOT_BLOODBANK);
    }

    // Partner OR Platform Admin can manage perks for `partner_id`.
    // - If Partner: partner_id must match their get_partner_id(caller)
    // - If Admin: can manage any nonzero partner_id
    fn assert_can_manage_partner(self: @ContractState, partner_id: u32) {
        assert(partner_id != 0, ERR_BAD_PARTNER_ID);

        let caller = get_caller_address();
        let rr = role_registry_dispatcher(self);
        let role = rr.get_role(caller);

        if role == ROLE_PLATFORM_ADMIN {
            return ();
        }

        assert(role == ROLE_PARTNER, ERR_NOT_PARTNER);
        let my_pid = rr.get_partner_id(caller);
        assert(my_pid == partner_id, ERR_NOT_AUTHORIZED);
    }

    // Operator auth + derives partner_id from operator_partner_id(caller)
    fn assert_operator_and_get_partner(self: @ContractState) -> u32 {
        let operator = get_caller_address();
        let rr = role_registry_dispatcher(self);

        assert(rr.get_role(operator) == ROLE_OPERATOR, ERR_NOT_OPERATOR);
        assert(rr.is_operator_enabled(operator), ERR_OPERATOR_DISABLED);

        let pid = rr.get_operator_partner_id(operator);
        assert(pid != 0, ERR_BAD_PARTNER_ID);
        pid
    }

    fn is_active_internal(self: @ContractState, donor: ContractAddress) -> bool {
        let end_ts = self.cooldown_end_ts.read(donor);
        if end_ts == 0 {
            return false;
        }
        let now = get_block_timestamp();
        now < end_ts
    }

    fn perk_key(partner_id: u32, perk_id: u32) -> (u32, u32) {
        (partner_id, perk_id)
    }

    fn redeem_key(donor: ContractAddress, partner_id: u32, perk_id: u32) -> (ContractAddress, u32, u32) {
        (donor, partner_id, perk_id)
    }

    // Window start for the CURRENT cooldown window:
    // - if end_ts == 0 => no window
    // - else window_start = end_ts - cooldown_seconds
    fn current_window_start(self: @ContractState, donor: ContractAddress) -> u64 {
        let end_ts = self.cooldown_end_ts.read(donor);
        if end_ts == 0 {
            return 0;
        }
        let cd = self.cooldown_seconds.read();
        // cd > 0 by constructor; end_ts should always be >= cd (since set as now + cd)
        end_ts - cd
    }

    // -------------------------
    // Public interface
    // -------------------------
    #[starknet::interface]
    trait IBloodworksCore<TContractState> {
        // donation system
        fn issue_credential(ref self: TContractState, donor: ContractAddress);
        fn record_donation(ref self: TContractState, donor: ContractAddress);

        // reads
        fn get_role_registry(self: @TContractState) -> ContractAddress;
        fn get_status(self: @TContractState, donor: ContractAddress) -> (bool, u32, u64, u64, bool);
        fn is_active(self: @TContractState, donor: ContractAddress) -> bool;

        // perk state (minimal enforceable)
        fn create_perk(ref self: TContractState, partner_id: u32, perk_id: u32);
        fn set_perk_enabled(ref self: TContractState, partner_id: u32, perk_id: u32, enabled: bool);
        fn perk_exists(self: @TContractState, partner_id: u32, perk_id: u32) -> bool;
        fn perk_enabled(self: @TContractState, partner_id: u32, perk_id: u32) -> bool;

        // ✅ redeemed (per current cooldown window)
        fn is_redeemed(self: @TContractState, donor: ContractAddress, partner_id: u32, perk_id: u32) -> bool;
        fn get_last_redeemed_ts(self: @TContractState, donor: ContractAddress, partner_id: u32, perk_id: u32) -> u64;

        // counters
        fn get_perk_total_redemptions(self: @TContractState, partner_id: u32, perk_id: u32) -> u64;
        fn get_partner_total_redemptions(self: @TContractState, partner_id: u32) -> u64;

        // operator redemption
        fn redeem_perk(ref self: TContractState, donor: ContractAddress, perk_id: u32);
    }

    #[abi(embed_v0)]
    impl BloodworksCoreImpl of IBloodworksCore<ContractState> {
        // Bloodbank: issue credential
        fn issue_credential(ref self: ContractState, donor: ContractAddress) {
            assert_bloodbank(@self);

            self.issued.write(donor, true);
            self.emit(CredentialIssued { donor });
        }

        // Bloodbank: record donation
        fn record_donation(ref self: ContractState, donor: ContractAddress) {
            assert_bloodbank(@self);
            assert(self.issued.read(donor), ERR_NOT_ISSUED);

            let now = get_block_timestamp();
            let cd = self.cooldown_seconds.read();
            let end_ts = now + cd;

            let prev = self.donation_count.read(donor);
            let next = prev + 1;
            self.donation_count.write(donor, next);

            self.last_donation_ts.write(donor, now);
            self.cooldown_end_ts.write(donor, end_ts);

            self.emit(DonationRecorded {
                donor,
                donation_count: next,
                last_donation_ts: now,
                cooldown_end_ts: end_ts
            });
        }

        fn get_role_registry(self: @ContractState) -> ContractAddress {
            self.role_registry.read()
        }

        fn get_status(self: @ContractState, donor: ContractAddress) -> (bool, u32, u64, u64, bool) {
            let issued_ = self.issued.read(donor);
            let count_ = self.donation_count.read(donor);
            let last_ = self.last_donation_ts.read(donor);
            let end_ = self.cooldown_end_ts.read(donor);
            let active_ = self.is_active(donor);
            (issued_, count_, last_, end_, active_)
        }

        fn is_active(self: @ContractState, donor: ContractAddress) -> bool {
            is_active_internal(self, donor)
        }

        // -------------------------
        // Perk registry
        // -------------------------
        fn create_perk(ref self: ContractState, partner_id: u32, perk_id: u32) {
            assert_can_manage_partner(@self, partner_id);

            let k = perk_key(partner_id, perk_id);
            assert(!self.perk_exists.read(k), ERR_PERK_EXISTS);

            self.perk_exists.write(k, true);
            self.perk_enabled.write(k, true);

            let now = get_block_timestamp();
            self.emit(PerkCreated { partner_id, perk_id, created_at: now });
        }

        fn set_perk_enabled(ref self: ContractState, partner_id: u32, perk_id: u32, enabled: bool) {
            assert_can_manage_partner(@self, partner_id);

            let k = perk_key(partner_id, perk_id);
            assert(self.perk_exists.read(k), ERR_PERK_NOT_FOUND);

            self.perk_enabled.write(k, enabled);

            let now = get_block_timestamp();
            self.emit(PerkEnabledChanged { partner_id, perk_id, enabled, changed_at: now });
        }

        fn perk_exists(self: @ContractState, partner_id: u32, perk_id: u32) -> bool {
            self.perk_exists.read(perk_key(partner_id, perk_id))
        }

        fn perk_enabled(self: @ContractState, partner_id: u32, perk_id: u32) -> bool {
            self.perk_enabled.read(perk_key(partner_id, perk_id))
        }

        // -------------------------
        // Redeemed (per current cooldown window)
        // -------------------------
        fn get_last_redeemed_ts(self: @ContractState, donor: ContractAddress, partner_id: u32, perk_id: u32) -> u64 {
            self.last_redeemed_ts.read(redeem_key(donor, partner_id, perk_id))
        }

        // Returns true only if redeemed within the CURRENT cooldown window.
        // If donor is not active (no current window), returns false.
        fn is_redeemed(self: @ContractState, donor: ContractAddress, partner_id: u32, perk_id: u32) -> bool {
            if !self.is_active(donor) {
                return false;
            }

            let window_start = current_window_start(self, donor);
            if window_start == 0 {
                return false;
            }

            let last = self.last_redeemed_ts.read(redeem_key(donor, partner_id, perk_id));
            last >= window_start
        }

        // -------------------------
        // Counters
        // -------------------------
        fn get_perk_total_redemptions(self: @ContractState, partner_id: u32, perk_id: u32) -> u64 {
            self.perk_total_redemptions.read(perk_key(partner_id, perk_id))
        }

        fn get_partner_total_redemptions(self: @ContractState, partner_id: u32) -> u64 {
            self.partner_total_redemptions.read(partner_id)
        }

        // -------------------------
        // Redemption (operator-only)
        // -------------------------
        fn redeem_perk(ref self: ContractState, donor: ContractAddress, perk_id: u32) {
            let operator = get_caller_address();
            let partner_id = assert_operator_and_get_partner(@self);

            // keep system coherent (no medical data stored)
            assert(self.issued.read(donor), ERR_NOT_ISSUED);

            // Option A: only redeem during active cooldown window
            assert(self.is_active(donor), ERR_NOT_ACTIVE);

            let k = perk_key(partner_id, perk_id);
            assert(self.perk_exists.read(k), ERR_PERK_NOT_FOUND);
            assert(self.perk_enabled.read(k), ERR_PERK_DISABLED);

            // ✅ one redeem per donor/perk/per cooldown window
            let window_start = current_window_start(@self, donor);
            // window_start should be nonzero because is_active implies end_ts != 0
            let rk = redeem_key(donor, partner_id, perk_id);
            let last = self.last_redeemed_ts.read(rk);
            assert(last < window_start, ERR_ALREADY_REDEEMED_THIS_WINDOW);

            let now = get_block_timestamp();
            self.last_redeemed_ts.write(rk, now);

            // increment counters
            let perk_prev = self.perk_total_redemptions.read(k);
            self.perk_total_redemptions.write(k, perk_prev + 1);

            let partner_prev = self.partner_total_redemptions.read(partner_id);
            self.partner_total_redemptions.write(partner_id, partner_prev + 1);

            self.emit(PerkRedeemed {
                donor,
                partner_id,
                perk_id,
                operator,
                redeemed_at: now
            });
        }
    }
}