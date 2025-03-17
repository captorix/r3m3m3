use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::states::pool::{LiquidStakingPool, LIQUID_STAKING_POOL_SEED, LIQUID_STAKING_POOL_VAULT_SEED, LIQUID_STAKING_POOL_MINT_SEED};
use crate::states::config::Config;
use crate::AUTH_SEED;
use crate::utils::token::create_token_account;

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        constraint = config.creator_authority == creator.key()  
    )]
    pub config: Box<Account<'info, Config>>,
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK:    
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,
    /// CHECK: authority
    #[account(
        mut,
        seeds = [
            LIQUID_STAKING_POOL_VAULT_SEED.as_bytes(),
            pool.key().as_ref(),
            quote_mint.key().as_ref()
        ],
        bump
    )]
    pub quote_vault: UncheckedAccount<'info>,
    /// CHECK: authority
    #[account(
        mut,
        seeds = [
            LIQUID_STAKING_POOL_VAULT_SEED.as_bytes(),
            pool.key().as_ref(),
            token_mint.key().as_ref()
        ],
        bump
    )]
    pub token_vault: UncheckedAccount<'info>,
    /// CHECK: authority
    #[account(
        seeds = [
            AUTH_SEED.as_bytes(),
        ],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = creator,
        space = LiquidStakingPool::LEN,
        seeds = [
            LIQUID_STAKING_POOL_SEED.as_bytes(),
            token_mint.key().as_ref(),
        ],
        bump
    )]
    pub pool: Account<'info, LiquidStakingPool>,

    #[account(
        init,
        seeds = [
            LIQUID_STAKING_POOL_MINT_SEED.as_bytes(),
            token_mint.key().as_ref(),
        ],
        bump,
        mint::decimals = 9,
        mint::authority = authority,
        payer = creator,
        mint::token_program = token_program,
    )]
    pub liquid_token_mint: Box<InterfaceAccount<'info, Mint>>,
    /// CHECK: authority 
    #[account(
        mut,
        seeds = [
            LIQUID_STAKING_POOL_VAULT_SEED.as_bytes(),
            pool.key().as_ref(),
            liquid_token_mint.key().as_ref()
        ],
        bump
    )]
    pub liquid_token_vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.vault = ctx.accounts.vault.key();
    pool.token_mint = ctx.accounts.token_mint.key();
    pool.token_vault_account = ctx.accounts.token_vault.key();
    pool.token_mint_decimals = ctx.accounts.token_mint.decimals;
    pool.quote_vault_account = ctx.accounts.quote_vault.key();
    pool.pool_creator = ctx.accounts.creator.key();

    pool.liquid_token_mint = ctx.accounts.liquid_token_mint.key();
    pool.liquid_token_vault = ctx.accounts.liquid_token_vault.key();
    pool.liquid_supply = 0;

    pool.deposit_fee_rate = 1;
    pool.reward_fee_rate = 10;
    pool.protocol_fees_token = 0;
    pool.protocol_fees_quote = 0;
    pool.recent_epoch = 0;
    pool.bump = ctx.bumps.pool;
    pool.auth_bump = ctx.bumps.authority;
    pool.status = 0;
    pool.padding = [0; 64];
    

    create_token_account(
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.creator.to_account_info(),
        &ctx.accounts.liquid_token_vault.to_account_info(),
        &ctx.accounts.liquid_token_mint.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &[&[
            LIQUID_STAKING_POOL_VAULT_SEED.as_bytes(),
            ctx.accounts.pool.key().as_ref(),
            ctx.accounts.liquid_token_mint.key().as_ref(),
            &[ctx.bumps.liquid_token_vault][..],
        ][..]],
    )?;

    create_token_account(
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.creator.to_account_info(),
        &ctx.accounts.quote_vault.to_account_info(),
        &ctx.accounts.quote_mint.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &[&[    
            LIQUID_STAKING_POOL_VAULT_SEED.as_bytes(),
            ctx.accounts.pool.key().as_ref(),
            ctx.accounts.quote_mint.key().as_ref(),
            &[ctx.bumps.quote_vault][..],
        ][..]],
    )?;

    create_token_account(
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.creator.to_account_info(),
        &ctx.accounts.token_vault.to_account_info(),
        &ctx.accounts.token_mint.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &[&[
            LIQUID_STAKING_POOL_VAULT_SEED.as_bytes(),
            ctx.accounts.pool.key().as_ref(),
            ctx.accounts.token_mint.key().as_ref(),
            &[ctx.bumps.token_vault][..],
        ][..]],
    )?;


    Ok(())
}
