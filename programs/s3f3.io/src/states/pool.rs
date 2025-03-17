use anchor_lang::prelude::*;
use std::ops::BitAnd;
/// Seed to derive account address and signature
pub const LIQUID_STAKING_POOL_SEED: &str = "liquid_staking_pool";
pub const LIQUID_STAKING_POOL_MINT_SEED: &str = "liquid_staking_pool_mint";
pub const LIQUID_STAKING_POOL_VAULT_SEED: &str = "liquid_staking_pool_vault";


pub enum LiquidStakingPoolStatusBitIndex {
    Deposit,
    Withdraw,
}

#[derive(PartialEq, Eq)]
pub enum LiquidStakingPoolStatusBitFlag {
    Enable,
    Disable,
}

#[account]
#[derive(Debug)]
pub struct LiquidStakingPool {
    pub vault: Pubkey,
    pub token_mint: Pubkey,
    pub escrow: Pubkey,
    pub token_vault_account: Pubkey,
    pub token_mint_decimals: u8,
    pub quote_vault_account: Pubkey, 
    pub pool_creator: Pubkey,

    pub liquid_token_mint: Pubkey,
    pub liquid_token_vault: Pubkey,
    pub liquid_supply: u64,

    pub lut: Pubkey,

    pub deposit_fee_rate: u64,
    pub reward_fee_rate: u64,
    pub protocol_fees_token: u64,
    pub protocol_fees_quote: u64,

    pub recent_epoch: u64,
    pub bump: u8,
    pub auth_bump: u8,


    pub status: u8,
    pub padding: [u64; 64],
}


impl LiquidStakingPool {
    pub const LEN: usize = 8 + std::mem::size_of::<LiquidStakingPool>();

    pub fn set_status(&mut self, status: u8) {
        self.status = status
    }
    pub fn get_status_by_bit(&self, bit: LiquidStakingPoolStatusBitIndex) -> bool {
        let status = u8::from(1) << (bit as u8);
        self.status.bitand(status) == 0
    }
}


