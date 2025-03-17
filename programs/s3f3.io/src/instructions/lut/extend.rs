use anchor_lang::prelude::*;
use solana_address_lookup_table_program::{
    instruction::extend_lookup_table,
    ID as ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
};
use solana_program::program::invoke_signed;
use crate::AUTH_SEED;
use crate::states::pool::LiquidStakingPool;


#[derive(Accounts)]
pub struct ExtendLUT<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        constraint = pool.pool_creator == signer.key(),
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
    #[account(mut)]
    /// CHECK: the account will be validated by the lookup table program
    pub lookup_table: AccountInfo<'info>,

    /// CHECK: the account will be validated by the lookup table program
    pub new_address: AccountInfo<'info>,


    #[account(address = ADDRESS_LOOKUP_TABLE_PROGRAM_ID)]
    /// CHECK: the account will be validated by the lookup table program
    pub address_lookup_table_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}


pub fn extend_lut(ctx: Context<ExtendLUT>) -> Result<()> {
    let new_addresses: Vec<Pubkey> = vec![ctx.accounts.new_address.key()];

    let ix = extend_lookup_table(
        ctx.accounts.lookup_table.key(), 
        ctx.accounts.authority.key(), 
        Some(ctx.accounts.signer.key()),
        new_addresses
    );

    invoke_signed(
        &ix,
        &[
            ctx.accounts.lookup_table.to_account_info(),
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&[crate::AUTH_SEED.as_bytes(), &[ctx.accounts.pool.auth_bump]]]
    )?;
    Ok(())
}
