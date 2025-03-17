use anchor_lang::prelude::*;

pub const CONFIG_SEED: &str = "config";

#[account]
#[derive(Default, Debug)]
pub struct Config {
    pub creator_authority: Pubkey, 
    pub bump: u8,
    pub padding: [u8; 32],
}

impl Config {
    pub const LEN: usize = 8 + std::mem::size_of::<Config>();
}
