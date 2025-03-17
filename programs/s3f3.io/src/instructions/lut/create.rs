use anchor_lang::prelude::*;
use solana_address_lookup_table_program::{
    instruction::create_lookup_table_signed,
    ID as ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
};
use solana_program::program::invoke_signed;
use crate::AUTH_SEED;
use crate::states::pool::LiquidStakingPool;
use crate::error::ErrorCode;


#[derive(Accounts)]
pub struct CreateLUT<'info> {
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

    #[account(address = ADDRESS_LOOKUP_TABLE_PROGRAM_ID)]
    /// CHECK: the account will be validated by the lookup table program
    pub address_lookup_table_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}


pub fn create_lookup_table(ctx: Context<CreateLUT>) -> Result<()> {
    let (ix, lut_key) = create_lookup_table_signed(
        ctx.accounts.authority.key(), 
        ctx.accounts.signer.key(), 
        Clock::get()?.slot - 1
    );
    msg!("lut_key {:?}", lut_key);
    msg!("lookup_table {:?}", ctx.accounts.lookup_table.key());
    match lut_key == ctx.accounts.lookup_table.key() {
        true => {
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
        },
        false => return err!(ErrorCode::CreateLookupTableFailed)
    };
    ctx.accounts.pool.lut = lut_key;
    Ok(())
}
