use anchor_lang::prelude::*;
use stake_for_fee_interface::{
    accounts::{StakeEscrowAccount},
    id as stake_for_fee_id,
    StakeAccounts, 
    StakeIxArgs, 
    STAKE_IX_ACCOUNTS_LEN,
    StakeKeys,
    StakeIxData
};
use anchor_spl::token_interface::{Mint, TokenAccount};
use solana_program::{instruction::Instruction, program::invoke_signed};
use solana_address_lookup_table_program::state::AddressLookupTable;
use crate::{
    states::pool::{LiquidStakingPool, LiquidStakingPoolStatusBitIndex},
    error::ErrorCode,
    utils::token,
    AUTH_SEED,
};

#[derive(Accounts)]
pub struct StakeCpi<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    #[account(mut)]
    pub liquid_staking_pool: Account<'info, LiquidStakingPool>,
    /// CHECK
    #[account(
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
    #[account(
        mut,
        constraint = liquid_token_mint.key() == liquid_staking_pool.liquid_token_mint @ ErrorCode::InvalidLiquidStakingTokenMint,
    )]
    pub liquid_token_mint: Box<InterfaceAccount<'info, Mint>>,
    /// CHECK:
    #[account(mut,
        constraint = staker_token_vault.owner == staker.key() @ ErrorCode::InvalidLiquidStakingTokenOwner,
        constraint = token_vault.mint == staker_token_vault.mint @ ErrorCode::InvalidLiquidStakingTokenMint,
    )]
    pub staker_token_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = staker_liquid_token_vault.mint == liquid_staking_pool.liquid_token_mint @ ErrorCode::InvalidLiquidStakingTokenMint,
        constraint = staker_liquid_token_vault.owner == staker.key() @ ErrorCode::InvalidLiquidStakingTokenOwner,
    )]
    pub staker_liquid_token_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    /// CHECK: the account will be validated by the lookup table program
    pub lookup_table: AccountInfo<'info>,
    /// CHECK:
    pub cpi_program: UncheckedAccount<'info>,
    /// CHECK:    
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK:    
    #[account(mut)]
    pub stake_token_vault: UncheckedAccount<'info>,
    /// CHECK:    
    #[account(mut)]
    pub quote_token_vault: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub top_staker_list: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub full_balance_list: UncheckedAccount<'info>,
    /// CHECK: StakeEscrow is handled by CPI
    #[account(mut)]
    pub stake_escrow: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub smallest_stake_escrow: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub fee_pool: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub lp_mint: Box<InterfaceAccount<'info, Mint>>,
    /// CHECK:
    #[account(mut)]
    pub lock_escrow: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub escrow_vault: UncheckedAccount<'info>,
    /// CHECK:
    pub token_program: UncheckedAccount<'info>,
    /// CHECK:
    pub system_program: UncheckedAccount<'info>,
}

pub fn stake_ix_with_program_id(
    program_id: Pubkey,
    keys: StakeKeys,
    remaining_accounts: &[AccountInfo],
    args: StakeIxArgs,
) -> std::io::Result<Instruction> {
    let mut metas: Vec<AccountMeta> = Vec::with_capacity(STAKE_IX_ACCOUNTS_LEN + remaining_accounts.len());
    let account_metas: [AccountMeta; STAKE_IX_ACCOUNTS_LEN] = keys.into();
    metas.extend_from_slice(&account_metas);
    
    for account in remaining_accounts {
        if account.is_writable {
            metas.push(AccountMeta::new(account.key(), account.is_signer));
        } else {
            metas.push(AccountMeta::new_readonly(account.key(), account.is_signer));
        }
    }
    
    let data: StakeIxData = args.into();
    Ok(Instruction {
        program_id,
        accounts: metas,
        data: data.try_to_vec()?,
    })
}

pub fn stake_cpi<'info>(
    ctx: Context<'_, '_, '_, 'info, StakeCpi<'info>>,
    amount: u64
) -> Result<()> {
    msg!("========= S3F3.io =========");
    let liquid_staking_pool = &mut ctx.accounts.liquid_staking_pool;
    if !liquid_staking_pool.get_status_by_bit(LiquidStakingPoolStatusBitIndex::Deposit) {
        return err!(ErrorCode::NotApproved);
    }

    let mut lst_pool_staked_amount = 0;
    {
        let data_ref = ctx.accounts.stake_escrow.try_borrow_data()?;
        let stake_escrow_account = StakeEscrowAccount::deserialize(&data_ref)?;
        let stake_escrow = &stake_escrow_account.0; 
        lst_pool_staked_amount = stake_escrow.stake_amount;
        if stake_escrow.owner != ctx.accounts.authority.key() {
            return err!(ErrorCode::AccountDeserializeFailed);
        }
        if liquid_staking_pool.escrow != ctx.accounts.stake_escrow.key() {
            return err!(ErrorCode::AccountDeserializeFailed);
        }
    }
    let deposit_fee = amount.checked_mul(liquid_staking_pool.deposit_fee_rate).unwrap().checked_div(100).unwrap();

    if liquid_staking_pool.lut != ctx.accounts.lookup_table.key() {
        return err!(ErrorCode::InvalidLookupTable);
    }
    let alt_bytes = ctx.accounts.lookup_table.try_borrow_data()?;
    let lookup_table: AddressLookupTable = AddressLookupTable::deserialize(&alt_bytes).unwrap();
    let lookup_table_len = lookup_table.addresses.len();
    let address_lookup_table_account_infos: &[AccountInfo] = ctx.remaining_accounts.get(..lookup_table_len).ok_or(ErrorCode::InvalidLookupTable)?;
    
    token::transfer_from_user_to_pool_vault(
        ctx.accounts.staker.to_account_info(),
        ctx.accounts.staker_token_vault.to_account_info(),
        ctx.accounts.token_vault.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        amount,
    )?;

    if ctx.accounts.cpi_program.key() != stake_for_fee_id() {
        return err!(ErrorCode::InvalidCpiProgram);    
    }
    
    let accounts_cpi: StakeAccounts<'_, '_> = StakeAccounts {
        vault: &ctx.accounts.vault.to_account_info(),
        stake_token_vault: &ctx.accounts.stake_token_vault.to_account_info(),
        quote_token_vault: &ctx.accounts.quote_token_vault.to_account_info(),
        top_staker_list: &ctx.accounts.top_staker_list.to_account_info(),
        full_balance_list: &ctx.accounts.full_balance_list.to_account_info(),
        stake_escrow: &ctx.accounts.stake_escrow.to_account_info(),
        smallest_stake_escrow: &ctx.accounts.smallest_stake_escrow.to_account_info(),
        user_stake_token: &ctx.accounts.token_vault.to_account_info(),
        owner: &ctx.accounts.authority.to_account_info(),
        pool: &ctx.accounts.fee_pool.to_account_info(),
        lp_mint: &ctx.accounts.lp_mint.to_account_info(),
        lock_escrow: &ctx.accounts.lock_escrow.to_account_info(),
        escrow_vault: &ctx.accounts.escrow_vault.to_account_info(),
        a_vault: &address_lookup_table_account_infos[0],
        b_vault: &address_lookup_table_account_infos[1],
        a_vault_lp: &address_lookup_table_account_infos[2],
        b_vault_lp: &address_lookup_table_account_infos[3],
        a_vault_lp_mint: &address_lookup_table_account_infos[4],
        b_vault_lp_mint: &address_lookup_table_account_infos[5],
        a_token_vault: &address_lookup_table_account_infos[6],
        b_token_vault: &address_lookup_table_account_infos[7],
        amm_program: &address_lookup_table_account_infos[8],
        vault_program: &address_lookup_table_account_infos[9],
        event_authority: &address_lookup_table_account_infos[10],
        token_program: &ctx.accounts.token_program.to_account_info(),
        program: &ctx.accounts.cpi_program.to_account_info(),
    };
    let stake_args = StakeIxArgs {
        amount: amount,
    };
    let keys: StakeKeys = accounts_cpi.into();
    let leftover_infos = &ctx.remaining_accounts[lookup_table_len..];
    if leftover_infos.len() > 3 {
        return err!(ErrorCode::InvalidNumberOfAccounts);
    }

    let ix = stake_ix_with_program_id(ctx.accounts.cpi_program.key(), keys, leftover_infos, stake_args)?;
    let base_infos: [AccountInfo<'info>; STAKE_IX_ACCOUNTS_LEN] = accounts_cpi.into();
    let mut all_infos = Vec::with_capacity(STAKE_IX_ACCOUNTS_LEN + leftover_infos.len());
    all_infos.extend_from_slice(&base_infos);
    all_infos.extend_from_slice(leftover_infos);

    invoke_signed(&ix, &all_infos, &[&[crate::AUTH_SEED.as_bytes(), &[liquid_staking_pool.auth_bump]]])?;

    let amount_after_fee = amount.checked_sub(deposit_fee).unwrap();
    let liquid_supply = liquid_staking_pool.liquid_supply;
    let mut liquid_amount_out = 0;
    if liquid_supply != 0 {
        let staked_u128 = (ctx.accounts.token_vault.amount as u128)
            .checked_add(lst_pool_staked_amount as u128).unwrap()
            .checked_sub(liquid_staking_pool.protocol_fees_token as u128)
            .ok_or(ErrorCode::OverflowError)?; 

        let scaled_u128 = (liquid_supply as u128)
            .checked_mul(amount_after_fee as u128)
            .ok_or(ErrorCode::OverflowError)?;
        let liquid_amount_out_u128 = scaled_u128
            .checked_div(staked_u128)
            .ok_or(ErrorCode::DivisionError)?;

        if liquid_amount_out_u128 > u64::MAX as u128 {
            return err!(ErrorCode::OverflowError);
        }
        liquid_amount_out = liquid_amount_out_u128 as u64;
    } else {
        liquid_amount_out = amount_after_fee;
    }
    liquid_staking_pool.liquid_supply = liquid_staking_pool.liquid_supply.checked_add(liquid_amount_out).unwrap();

    liquid_staking_pool.protocol_fees_token = liquid_staking_pool.protocol_fees_token.checked_add(deposit_fee).unwrap();

    token::token_mint_to(
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.liquid_token_mint.to_account_info(),
        ctx.accounts.staker_liquid_token_vault.to_account_info(),
        liquid_amount_out,
        &[&[crate::AUTH_SEED.as_bytes(), &[liquid_staking_pool.auth_bump]]],
    )?;
    Ok(())
}