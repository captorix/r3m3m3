pub mod instructions;
pub mod states;
pub mod error;
pub mod utils;

use anchor_lang::prelude::*;
use instructions::*;

pub const AUTH_SEED: &str = "auth";

declare_id!("S3F3SGMgKp95gyA9fTgARwo4vMWXA1qwFUU8pAa19pg");

#[program]
pub mod rememe {
    use super::*;
    pub fn initialize_config(_ctx: Context<InitializeConfig>) -> Result<()> {
        instructions::initialize_config::initialize_config(_ctx)
    }    
    pub fn initialize_pool(_ctx: Context<InitializePool>) -> Result<()> {
        instructions::initialize_pool::initialize_pool(_ctx)
    }
    pub fn initialize_escrow(_ctx: Context<InitializeEscrowCpi>) -> Result<()> {
        instructions::initialize_escrow::initialize_escrow_cpi(_ctx)
    }
    pub fn stake<'info>(ctx: Context<'_, '_, '_, 'info, StakeCpi<'info>>, amount: u64) -> Result<()> {
        instructions::stake::stake_cpi(ctx, amount)
    }
    pub fn request_unstake<'info>(ctx: Context<'_, '_, '_, 'info, RequestUnstakeCpi<'info>>, amount: u64) -> Result<()> {
        instructions::unstake::request_unstake_cpi(ctx, amount)
    }
    pub fn withdraw(_ctx: Context<WithdrawCpi>) -> Result<()> {
        instructions::withdraw::withdraw_cpi(_ctx)
    }
    pub fn cancel_unstake<'info>(ctx: Context<'_, '_, '_, 'info, CancelUnstakeCpi<'info>>) -> Result<()> {
        instructions::cancel_unstake::cancel_unstake_cpi(ctx)
    }
    pub fn claim_fees<'info>(ctx: Context<'_, '_, '_, 'info, ClaimFeeCpi<'info>>) -> Result<()> {
        instructions::claim_fees::claim_fees_cpi(ctx)
    }

    pub fn create_address_lookup_table(ctx: Context<CreateLUT>) -> Result<()> {
        instructions::lut::create::create_lookup_table(ctx)
    }
    pub fn extend_address_lookup_table(ctx: Context<ExtendLUT>) -> Result<()> {
        instructions::lut::extend::extend_lut(ctx)
    }
}
