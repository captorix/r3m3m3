use anchor_lang::prelude::*;
use crate::states::config::{Config, CONFIG_SEED};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        seeds = [
            CONFIG_SEED.as_bytes(),
        ],
        payer = owner,
        space = Config::LEN,
        bump,
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.creator_authority = ctx.accounts.owner.key();
    config.bump = ctx.bumps.config;

    Ok(())
}
