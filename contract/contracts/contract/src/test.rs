#![cfg(test)]

use super::*;
use soroban_sdk::token::StellarAssetClient;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

// Helper: deploy a test token and mint to `to`
fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::Client<'a>, StellarAssetClient<'a>) {
    let contract_address = env.register_stellar_asset_contract_v2(admin.clone());
    let client = token::Client::new(env, &contract_address.address());
    let admin_client = StellarAssetClient::new(env, &contract_address.address());
    (contract_address.address(), client, admin_client)
}

#[test]
fn test_airdrop_equal_amounts() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let r3 = Address::generate(&env);

    let (token_addr, token_client, token_admin_client) = create_token(&env, &token_admin);

    // Mint 1000 tokens to sender
    token_admin_client.mint(&sender, &1000);

    let recipients = soroban_sdk::vec![&env, r1.clone(), r2.clone(), r3.clone()];
    let amount_each: i128 = 100;

    // airdrop: sender → 3 recipients, 100 each (total 300)
    client.airdrop(&sender, &token_addr, &recipients, &amount_each);

    assert_eq!(token_client.balance(&r1), 100);
    assert_eq!(token_client.balance(&r2), 100);
    assert_eq!(token_client.balance(&r3), 100);
    assert_eq!(token_client.balance(&sender), 700); // 1000 - 300
}

#[test]
fn test_airdrop_custom_amounts() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);

    let (token_addr, token_client, token_admin_client) = create_token(&env, &token_admin);

    token_admin_client.mint(&sender, &500);

    let recipients = soroban_sdk::vec![&env, r1.clone(), r2.clone()];
    let amounts = soroban_sdk::vec![&env, 200_i128, 50_i128];

    client.airdrop_custom(&sender, &token_addr, &recipients, &amounts);

    assert_eq!(token_client.balance(&r1), 200);
    assert_eq!(token_client.balance(&r2), 50);
    assert_eq!(token_client.balance(&sender), 250); // 500 - 250
}

#[test]
fn test_airdrop_count_tracking() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);

    let (token_addr, _, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    assert_eq!(client.get_airdrop_count(&token_addr), 0);

    let recipients = soroban_sdk::vec![&env, r1.clone()];
    client.airdrop(&sender, &token_addr, &recipients, &100);
    assert_eq!(client.get_airdrop_count(&token_addr), 1);

    token_admin_client.mint(&sender, &1000);
    client.airdrop(&sender, &token_addr, &recipients, &50);
    assert_eq!(client.get_airdrop_count(&token_addr), 2);
}

#[test]
fn test_get_total_distributed() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);

    let (token_addr, _, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&sender, &2000);

    assert_eq!(client.get_total_distributed(&token_addr), 0);

    let recipients = soroban_sdk::vec![&env, r1.clone(), r2.clone()];
    client.airdrop(&sender, &token_addr, &recipients, &200); // 400 total
    assert_eq!(client.get_total_distributed(&token_addr), 400);

    token_admin_client.mint(&sender, &2000);
    client.airdrop(&sender, &token_addr, &recipients, &100); // 200 more
    assert_eq!(client.get_total_distributed(&token_addr), 600);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #1)")]
fn test_airdrop_mismatched_lengths_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);

    let (token_addr, _, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&sender, &500);

    let recipients = soroban_sdk::vec![&env, r1.clone()];
    let amounts = soroban_sdk::vec![&env, 100_i128, 200_i128]; // mismatched!

    client.airdrop_custom(&sender, &token_addr, &recipients, &amounts);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #2)")]
fn test_airdrop_zero_recipients_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let sender = Address::generate(&env);

    let (token_addr, _, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&sender, &500);

    let recipients: soroban_sdk::Vec<Address> = soroban_sdk::vec![&env];
    client.airdrop(&sender, &token_addr, &recipients, &100);
}
