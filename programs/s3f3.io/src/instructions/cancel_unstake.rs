use anchor_lang::prelude::*;
use stake_for_fee_interface::{
    accounts::{StakeEscrowAccount, UnstakeAccount},
    id as stake_for_fee_id,
    CancelUnstakeKeys,
    CANCEL_UNSTAKE_IX_ACCOUNTS_LEN,
    CancelUnstakeIxData,
    CancelUnstakeAccounts,
};
use solana_program::{instruction::Instruction, program::invoke_signed};
use anchor_spl::token_interface::{Mint, TokenAccount};
use solana_address_lookup_table_program::state::AddressLookupTable;

use crate::{
    states::pool::{LiquidStakingPool, LiquidStakingPoolStatusBitIndex},
    states::unstake_request::LstUnstakeRequest,
    error::ErrorCode,
    utils::token,
    AUTH_SEED,
};

#[derive(Accounts)]
pub struct CancelUnstakeCpi<'info> {
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
    #[account(
        mut,
        constraint = liquid_token_mint.key() == liquid_staking_pool.liquid_token_mint @ ErrorCode::InvalidLiquidStakingTokenMint,
    )]
    pub liquid_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        constraint = staker_liquid_token_vault.mint == liquid_staking_pool.liquid_token_mint @ ErrorCode::InvalidLiquidStakingTokenMint,
        constraint = staker_liquid_token_vault.owner == staker.key() @ ErrorCode::InvalidLiquidStakingTokenOwner,
    )]
    pub staker_liquid_token_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = lst_unstake_request.owner == staker.key() @ ErrorCode::InvalidUnstakeRequestOwner,
        constraint = lst_unstake_request.unstake == unstake.key() @ ErrorCode::InvalidUnstakeRequestUnstake,
    )]
    pub lst_unstake_request: Box<Account<'info, LstUnstakeRequest>>,
    /// CHECK:
    #[account(mut)]
    pub unstake: UncheckedAccount<'info>,
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


pub fn cancel_unstake_ix_with_program_id(
    program_id: Pubkey,
    keys: CancelUnstakeKeys,
    remaining_accounts: &[AccountInfo],
) -> std::io::Result<Instruction> {
    let mut metas: Vec<AccountMeta> = Vec::with_capacity(CANCEL_UNSTAKE_IX_ACCOUNTS_LEN + remaining_accounts.len());
    let account_metas: [AccountMeta; CANCEL_UNSTAKE_IX_ACCOUNTS_LEN] = keys.into();
    metas.extend_from_slice(&account_metas);
    
    for account in remaining_accounts {
        if account.is_writable {
            metas.push(AccountMeta::new(account.key(), account.is_signer));
        } else {
            metas.push(AccountMeta::new_readonly(account.key(), account.is_signer));
        }
    }
    Ok(Instruction {
        program_id,
        accounts: metas,
        data: CancelUnstakeIxData.try_to_vec()?,
    })
}

pub fn cancel_unstake_cpi<'info>(
    ctx: Context<'_, '_, '_, 'info, CancelUnstakeCpi<'info>>,
) -> Result<()> {
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

    let mut cancel_amount = 0;
    {
        let data_ref = ctx.accounts.unstake.try_borrow_data()?;
        let unstake_account = UnstakeAccount::deserialize(&data_ref)?;
        let unstake_request = &unstake_account.0; 
        cancel_amount = unstake_request.unstake_amount;
        if unstake_request.stake_escrow != ctx.accounts.stake_escrow.key() {
            return err!(ErrorCode::AccountDeserializeFailed);
        }
        if cancel_amount == 0 {
            return err!(ErrorCode::AccountDeserializeFailed);
        }
    }
    if liquid_staking_pool.lut != ctx.accounts.lookup_table.key() {
        return err!(ErrorCode::InvalidLookupTable);
    }
    let alt_bytes = ctx.accounts.lookup_table.try_borrow_data()?;
    let lookup_table: AddressLookupTable = AddressLookupTable::deserialize(&alt_bytes).unwrap();
    let lookup_table_len = lookup_table.addresses.len();
    let address_lookup_table_account_infos: &[AccountInfo] = ctx.remaining_accounts.get(..lookup_table_len).ok_or(ErrorCode::InvalidLookupTable)?;
    
    if ctx.accounts.cpi_program.key() != stake_for_fee_id() {
        return err!(ErrorCode::InvalidCpiProgram);    
    }
    let accounts_cpi: CancelUnstakeAccounts<'_, '_> = CancelUnstakeAccounts {
        unstake: &ctx.accounts.unstake.to_account_info(),
        vault: &ctx.accounts.vault.to_account_info(),
        stake_token_vault: &ctx.accounts.stake_token_vault.to_account_info(),
        quote_token_vault: &ctx.accounts.quote_token_vault.to_account_info(),
        top_staker_list: &ctx.accounts.top_staker_list.to_account_info(),
        full_balance_list: &ctx.accounts.full_balance_list.to_account_info(),
        stake_escrow: &ctx.accounts.stake_escrow.to_account_info(),
        smallest_stake_escrow: &ctx.accounts.smallest_stake_escrow.to_account_info(),
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
    let keys: CancelUnstakeKeys = accounts_cpi.into();
    let leftover_infos = &ctx.remaining_accounts[lookup_table_len..];
    if leftover_infos.len() > 3 {
        return err!(ErrorCode::InvalidNumberOfAccounts);
    }

    let ix = cancel_unstake_ix_with_program_id(ctx.accounts.cpi_program.key(), keys, leftover_infos)?;
    let mut all_infos = Vec::with_capacity(CANCEL_UNSTAKE_IX_ACCOUNTS_LEN + leftover_infos.len());

    all_infos.push(accounts_cpi.unstake.to_account_info());
    all_infos.push(accounts_cpi.stake_escrow.to_account_info());
    all_infos.push(accounts_cpi.smallest_stake_escrow.to_account_info());
    all_infos.push(accounts_cpi.top_staker_list.to_account_info());
    all_infos.push(accounts_cpi.full_balance_list.to_account_info());
    all_infos.push(accounts_cpi.vault.to_account_info());
    all_infos.push(accounts_cpi.stake_token_vault.to_account_info());
    all_infos.push(accounts_cpi.quote_token_vault.to_account_info());
    all_infos.push(accounts_cpi.owner.to_account_info());
    all_infos.push(accounts_cpi.pool.to_account_info());
    all_infos.push(accounts_cpi.lp_mint.to_account_info());
    all_infos.push(accounts_cpi.lock_escrow.to_account_info());
    all_infos.push(accounts_cpi.escrow_vault.to_account_info());
    all_infos.push(accounts_cpi.a_token_vault.to_account_info());
    all_infos.push(accounts_cpi.b_token_vault.to_account_info());
    all_infos.push(accounts_cpi.a_vault.to_account_info());
    all_infos.push(accounts_cpi.b_vault.to_account_info());
    all_infos.push(accounts_cpi.a_vault_lp.to_account_info());
    all_infos.push(accounts_cpi.b_vault_lp.to_account_info());
    all_infos.push(accounts_cpi.a_vault_lp_mint.to_account_info());
    all_infos.push(accounts_cpi.b_vault_lp_mint.to_account_info());
    all_infos.push(accounts_cpi.amm_program.to_account_info());
    all_infos.push(accounts_cpi.vault_program.to_account_info());
    all_infos.push(accounts_cpi.token_program.to_account_info());
    all_infos.push(accounts_cpi.event_authority.to_account_info());
    all_infos.push(accounts_cpi.program.to_account_info());
    all_infos.extend_from_slice(leftover_infos);
    invoke_signed(&ix, &all_infos, &[&[crate::AUTH_SEED.as_bytes(), &[liquid_staking_pool.auth_bump]]])?;
    
    let lamports  = ctx.accounts.authority.lamports();
    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.authority.key(),
        &ctx.accounts.staker.key(),
        lamports
    );
    anchor_lang::solana_program::program::invoke_signed(
        &transfer_ix,
        &[
            ctx.accounts.staker.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&[crate::AUTH_SEED.as_bytes(), &[liquid_staking_pool.auth_bump]]]
    )?;

    let liquid_supply = liquid_staking_pool.liquid_supply;
    let mut liquid_amount_out = 0;
    if liquid_supply != 0 {
        let staked_u128 = (ctx.accounts.token_vault.amount as u128)
            .checked_add(lst_pool_staked_amount as u128).unwrap().checked_sub(liquid_staking_pool.protocol_fees_token as u128)
            .ok_or(ErrorCode::OverflowError)?; 
        // If you prefer using `?`
        // staked_full / amount = liq_sup / liquid_amount_out_u128
        // liquid_amount_out_u128 =  liq_sup * amount / staked_full
        // Multiply in 128-bit space
        let scaled_u128 = (liquid_supply as u128)
            .checked_mul(cancel_amount as u128)
            .ok_or(ErrorCode::OverflowError)?;
        let liquid_amount_out_u128 = scaled_u128
            .checked_div(staked_u128)
            .ok_or(ErrorCode::DivisionError)?;

        if liquid_amount_out_u128 > u64::MAX as u128 {
            return err!(ErrorCode::OverflowError);
        }
        liquid_amount_out = liquid_amount_out_u128 as u64;
    } else {
        liquid_amount_out = cancel_amount;
    }
    liquid_staking_pool.liquid_supply = liquid_staking_pool.liquid_supply.checked_add(liquid_amount_out).unwrap();

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