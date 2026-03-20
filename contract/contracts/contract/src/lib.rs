#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    LengthMismatch = 1,
    EmptyRecipients = 2,
}

#[contracttype]
pub enum DataKey {
    AirdropCount(Address),
    TotalDistributed(Address),
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    /// Airdrop a fixed `amount` of `token` from `sender` to each recipient.
    /// Permissionless — anyone can call this with any token they hold.
    pub fn airdrop(
        env: Env,
        sender: Address,
        token: Address,
        recipients: Vec<Address>,
        amount: i128,
    ) {
        sender.require_auth();
        if recipients.is_empty() {
            panic_with_error!(&env, Error::EmptyRecipients);
        }
        let token_client = token::Client::new(&env, &token);
        let contract_addr = env.current_contract_address();
        let total = amount * recipients.len() as i128;

        // Pull total from sender into the contract first, then distribute
        token_client.transfer(&sender, &contract_addr, &total);
        for recipient in recipients.iter() {
            token_client.transfer(&contract_addr, &recipient, &amount);
        }

        Self::record(&env, &token, total);
    }

    /// Airdrop custom per-recipient amounts of `token` from `sender`.
    /// `recipients` and `amounts` must be the same length.
    pub fn airdrop_custom(
        env: Env,
        sender: Address,
        token: Address,
        recipients: Vec<Address>,
        amounts: Vec<i128>,
    ) {
        sender.require_auth();
        if recipients.len() != amounts.len() {
            panic_with_error!(&env, Error::LengthMismatch);
        }
        if recipients.is_empty() {
            panic_with_error!(&env, Error::EmptyRecipients);
        }
        let token_client = token::Client::new(&env, &token);
        let contract_addr = env.current_contract_address();

        // Sum total needed
        let mut total: i128 = 0;
        for amt in amounts.iter() {
            total += amt;
        }

        // Pull all at once, then distribute
        token_client.transfer(&sender, &contract_addr, &total);
        for i in 0..recipients.len() {
            let recipient = recipients.get(i).unwrap();
            let amt = amounts.get(i).unwrap();
            token_client.transfer(&contract_addr, &recipient, &amt);
        }

        Self::record(&env, &token, total);
    }

    /// Returns how many airdrops have been run for this token.
    pub fn get_airdrop_count(env: Env, token: Address) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::AirdropCount(token))
            .unwrap_or(0)
    }

    /// Returns total amount of this token ever distributed through this contract.
    pub fn get_total_distributed(env: Env, token: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalDistributed(token))
            .unwrap_or(0)
    }

    fn record(env: &Env, token: &Address, amount: i128) {
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::AirdropCount(token.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::AirdropCount(token.clone()), &(count + 1));
        let distributed: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDistributed(token.clone()))
            .unwrap_or(0);
        env.storage().instance().set(
            &DataKey::TotalDistributed(token.clone()),
            &(distributed + amount),
        );
    }
}

mod test;
