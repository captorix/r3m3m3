use anchor_lang::prelude::*;
use stake_for_fee_interface::{InitializeStakeEscrowAccounts};
use crate::states::config::Config;
use crate::states::pool::LiquidStakingPool;
use crate::AUTH_SEED;
use crate::error::ErrorCode;


#[derive(Accounts)]
pub struct InitializeEscrowCpi<'info> {
    #[account(
        constraint = config.creator_authority == creator.key()  
    )]
    pub config: Box<Account<'info, Config>>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        constraint = pool.pool_creator == creator.key(),
    )]
    pub pool: Account<'info, LiquidStakingPool>,
    /// CHECK: authority
    #[account(
        seeds = [
            AUTH_SEED.as_bytes(),
        ],
        bump = pool.auth_bump,
    )]
    pub authority: UncheckedAccount<'info>,
    /// CHECK:
    pub cpi_program: UncheckedAccount<'info>,
    /// CHECK:    
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub escrow: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub top_staker_list: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub full_balance_list: UncheckedAccount<'info>,

    /// CHECK:
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK:
    pub system_program: UncheckedAccount<'info>,
}

pub fn initialize_escrow_cpi(ctx: Context<InitializeEscrowCpi>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    if pool.escrow != Pubkey::default() {
        return err!(ErrorCode::EscrowAlreadyInitialized);
    }
    pool.escrow = ctx.accounts.escrow.key();
    
    let accounts_cpi = InitializeStakeEscrowAccounts {
        vault: &ctx.accounts.vault.to_account_info(),
        escrow: &ctx.accounts.escrow.to_account_info(),
        full_balance_list: &ctx.accounts.full_balance_list.to_account_info(),
        top_staker_list: &ctx.accounts.top_staker_list.to_account_info(),
        owner: &ctx.accounts.authority.to_account_info(),
        payer: &ctx.accounts.creator.to_account_info(),
        system_program: &ctx.accounts.system_program.to_account_info(),
        event_authority: &ctx.accounts.event_authority.to_account_info(),
        program: &ctx.accounts.cpi_program.to_account_info(),
    };
    stake_for_fee_interface::instructions::initialize_stake_escrow_invoke_signed(accounts_cpi, &[&[crate::AUTH_SEED.as_bytes(), &[pool.auth_bump]]])?;

    Ok(())
}