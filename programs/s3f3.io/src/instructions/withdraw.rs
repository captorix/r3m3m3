use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;
use stake_for_fee_interface::{
    accounts::StakeEscrowAccount,
    instructions::withdraw_invoke_signed,
    WithdrawAccounts,
};
use crate::states::pool::{LiquidStakingPool, LiquidStakingPoolStatusBitIndex};
use crate::AUTH_SEED;
use crate::error::ErrorCode;
use crate::states::unstake_request::LstUnstakeRequest;


#[derive(Accounts)]
pub struct WithdrawCpi<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    #[account(mut)]
    pub liquid_staking_pool: Account<'info, LiquidStakingPool>,
    /// CHECK
    #[account(
        mut,
        seeds = [
            AUTH_SEED.as_bytes(),
        ],
        bump = liquid_staking_pool.auth_bump,
    )]
    pub authority: UncheckedAccount<'info>,
    /// CHECK:wfa 
    #[account(
        mut,
        constraint = token_vault.key() == liquid_staking_pool.token_vault_account @ ErrorCode::InvalidLiquidStakingTokenVault,
    )]
    pub token_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK:
    #[account(mut,
        constraint = staker_token_vault.owner == staker.key() @ ErrorCode::InvalidLiquidStakingTokenOwner,
        constraint = token_vault.mint == staker_token_vault.mint @ ErrorCode::InvalidLiquidStakingTokenMint,
    )]
    pub staker_token_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        close = staker,
        constraint = lst_unstake_request.owner == staker.key() @ ErrorCode::InvalidUnstakeRequestOwner,
        constraint = lst_unstake_request.unstake == unstake.key() @ ErrorCode::InvalidUnstakeRequestUnstake,
    )]
    pub lst_unstake_request: Account<'info, LstUnstakeRequest>,
    /// CHECK:
    #[account(mut)]
    pub unstake: UncheckedAccount<'info>,
    /// CHECK:
    pub cpi_program: UncheckedAccount<'info>,
    /// CHECK:    
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK:    
    #[account(mut)]
    pub stake_token_vault: UncheckedAccount<'info>,

    /// CHECK: StakeEscrow is handled by CPI
    #[account(mut)]
    pub stake_escrow: UncheckedAccount<'info>,

    /// CHECK:
    pub token_program: UncheckedAccount<'info>,
    /// CHECK:
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK:
    pub system_program: UncheckedAccount<'info>,
}

pub fn withdraw_cpi(ctx: Context<WithdrawCpi>) -> Result<()> {
    {
        let data_ref = ctx.accounts.stake_escrow.try_borrow_data()?;
        let stake_escrow_account = StakeEscrowAccount::deserialize(&data_ref)?;
        let stake_escrow = &stake_escrow_account.0; 
        if stake_escrow.owner != ctx.accounts.authority.key() {
            return err!(ErrorCode::AccountDeserializeFailed);
        }
    }

    let liquid_staking_pool = &mut ctx.accounts.liquid_staking_pool;
    if !liquid_staking_pool.get_status_by_bit(LiquidStakingPoolStatusBitIndex::Withdraw) {
        return err!(ErrorCode::NotApproved);
    }

    let accounts_cpi: WithdrawAccounts<'_, '_> = WithdrawAccounts {
        unstake: &ctx.accounts.unstake.to_account_info(),
        vault: &ctx.accounts.vault.to_account_info(),
        user_stake_token: &ctx.accounts.staker_token_vault.to_account_info(),
        stake_token_vault: &ctx.accounts.stake_token_vault.to_account_info(),
        stake_escrow: &ctx.accounts.stake_escrow.to_account_info(),
        owner: &ctx.accounts.authority.to_account_info(),
        token_program: &ctx.accounts.token_program.to_account_info(),
        event_authority: &ctx.accounts.event_authority.to_account_info(),
        program: &ctx.accounts.cpi_program.to_account_info(),
    };
    withdraw_invoke_signed(accounts_cpi, &[&[crate::AUTH_SEED.as_bytes(), &[liquid_staking_pool.auth_bump]]])?;
    Ok(())
}
