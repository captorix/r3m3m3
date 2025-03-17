/// Errors that may be returned by the TokenSwap program.
use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Not approved")]
    NotApproved,
    #[msg("Input account owner is not the program address")]
    InvalidOwner,
    #[msg("Invalid cpi program")]
    InvalidCpiProgram,
    #[msg("Invalid input")]
    InvalidInput,
    #[msg("Escrow already initialized")]
    EscrowAlreadyInitialized,
    #[msg("Account borrow failed")]
    AccountBorrowFailed,
    #[msg("Account deserialize failed")]
    AccountDeserializeFailed,
    #[msg("Invalid liquid staking token vault")]
    InvalidLiquidStakingTokenVault,
    #[msg("Invalid liquid staking token mint")] 
    InvalidLiquidStakingTokenMint,
    #[msg("Invalid liquid staking token owner")]
    InvalidLiquidStakingTokenOwner,
    #[msg("Liquid staking supply is zero")]
    StakedSupplyIsZero,
    #[msg("Invalid unstake request owner")]
    InvalidUnstakeRequestOwner,
    #[msg("Invalid unstake request unstake")]
    InvalidUnstakeRequestUnstake,
    #[msg("Create lookup table failed")]
    CreateLookupTableFailed,
    #[msg("Invalid lookup table")]
    InvalidLookupTable,
    #[msg("Invalid number of accounts")]
    InvalidNumberOfAccounts,

    #[msg("Overflow error")]
    OverflowError,
    #[msg("Division error")]
    DivisionError,
    #[msg("Insufficient liquid staking token")]
    InsufficientLiquidStakingToken
}
