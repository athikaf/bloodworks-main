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
    const ROLE_BLOODBANK_ADMIN: u8 = 2;
    const ROLE_PLATFORM_ADMIN: u8 = 3;

    // -------------------------
    // Errors
    // -------------------------
    const ERR_NOT_BLOODBANK_ADMIN: felt252 = 'NOT_BLOODBANK_ADMIN';
    const ERR_NOT_PARTNER: felt252 = 'NOT_PARTNER';
    const ERR_NOT_ISSUED: felt252 = 'NOT_ISSUED';
    const ERR_NOT_ACTIVE: felt252 = 'NOT_ACTIVE';
    const ERR_ALREADY_REDEEMED: felt252 = 'ALREADY_REDEEMED';
    const ERR_BAD_COOLDOWN: felt252 = 'BAD_COOLDOWN';
    const ERR_NO_PARTNER_ID: felt252 = 'NO_PARTNER_ID';

    // -------------------------
    // RoleRegistry interface (cross-contract)
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

        issued: Map<ContractAddress, bool>,
        donation_count: Map<ContractAddress, u32>,
        last_donation_ts: Map<ContractAddress, u64>,
        cooldown_end_ts: Map<ContractAddress, u64>,

        redeemed: Map<(ContractAddress, u32, u32), bool>,
    }

    // -------------------------
    // Events
    // -------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CredentialIssued: CredentialIssued,
        DonationRecorded: DonationRecorded,
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
    fn constructor(ref self: ContractState, role_registry: ContractAddress, cooldown_seconds: u64) {
        assert(cooldown_seconds > 0, ERR_BAD_COOLDOWN);
        self.role_registry.write(role_registry);
        self.cooldown_seconds.write(cooldown_seconds);
    }

    // -------------------------
    // Internal auth helpers
    // -------------------------
    fn role_registry_dispatcher(self: @ContractState) -> IRoleRegistryDispatcher {
        IRoleRegistryDispatcher { contract_address: self.role_registry.read() }
    }

   fn assert_bloodbank_admin(self: @ContractState) {
    let caller = get_caller_address();
    let rr = role_registry_dispatcher(self);
    let role = rr.get_role(caller);
    assert(role == ROLE_BLOODBANK_ADMIN, ERR_NOT_BLOODBANK_ADMIN);
    }

    fn assert_partner(self: @ContractState) -> u32 {
    let caller = get_caller_address();
    let rr = role_registry_dispatcher(self);
    let role = rr.get_role(caller);
    assert(role == ROLE_PARTNER, ERR_NOT_PARTNER);

    let pid = rr.get_partner_id(caller);
    assert(pid != 0, ERR_NO_PARTNER_ID);
    pid
    }

    fn is_active_internal(self: @ContractState, donor: ContractAddress) -> bool {
        // Active window is between donation time and cooldown_end_ts.
        // If cooldown_end_ts == 0 => not active.
        let end_ts = self.cooldown_end_ts.read(donor);
        if end_ts == 0 {
            return false;
        }
        let now = get_block_timestamp();
        now < end_ts
    }

    // -------------------------
    // Public interface
    // -------------------------
    #[starknet::interface]
    trait IBloodworksCore<TContractState> {
        fn issue_credential(ref self: TContractState, donor: ContractAddress);
        fn record_donation(ref self: TContractState, donor: ContractAddress);

        fn get_role_registry(self: @TContractState) -> ContractAddress;

        fn get_status(self: @TContractState, donor: ContractAddress) -> (bool, u32, u64, u64, bool);
        fn is_active(self: @TContractState, donor: ContractAddress) -> bool;

        fn redeem_perk(ref self: TContractState, donor: ContractAddress, perk_id: u32);
        fn is_redeemed(self: @TContractState, donor: ContractAddress, partner_id: u32, perk_id: u32) -> bool;
    }

    #[abi(embed_v0)]
    impl BloodworksCoreImpl of IBloodworksCore<ContractState> {
        // Blood bank: issue once (idempotent allowed or not? here: sets to true)
        fn issue_credential(ref self: ContractState, donor: ContractAddress) {
            assert_bloodbank_admin(@self);

            self.issued.write(donor, true);
            self.emit(CredentialIssued { donor });
        }

        // Blood bank: record donation, increments total donation_count, starts active window
        fn record_donation(ref self: ContractState, donor: ContractAddress) {
            assert_bloodbank_admin(@self);

            assert(self.issued.read(donor), ERR_NOT_ISSUED);

            let now = get_block_timestamp();
            let cd = self.cooldown_seconds.read();
            let end_ts = now + cd;

            // increment donation count
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

        // Donor/read: returns everything donor UI needs
        // (issued, donation_count, last_donation_ts, cooldown_end_ts, is_active)
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

        // Partner: redeem perk during active window
        // partner_id is derived from caller via RoleRegistry (prevents spoofing)
        fn redeem_perk(ref self: ContractState, donor: ContractAddress, perk_id: u32) {
            let partner_id = assert_partner(@self);

            assert(self.issued.read(donor), ERR_NOT_ISSUED);
            assert(is_active_internal(@self, donor), ERR_NOT_ACTIVE);

            let key = (donor, partner_id, perk_id);
            assert(!self.redeemed.read(key), ERR_ALREADY_REDEEMED);

            self.redeemed.write(key, true);

            let now = get_block_timestamp();
            self.emit(PerkRedeemed { donor, partner_id, perk_id, redeemed_at: now });
        }

        fn is_redeemed(self: @ContractState, donor: ContractAddress, partner_id: u32, perk_id: u32) -> bool {
            self.redeemed.read((donor, partner_id, perk_id))
        }
    }
}