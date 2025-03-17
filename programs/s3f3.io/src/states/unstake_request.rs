use anchor_lang::prelude::*;

#[account]
pub struct LstUnstakeRequest {
    pub owner: Pubkey,
    pub unstake: Pubkey,
    pub padding: [u64; 20],
}

impl LstUnstakeRequest {
    pub const LEN: usize = 8 + std::mem::size_of::<LstUnstakeRequest>();
}
