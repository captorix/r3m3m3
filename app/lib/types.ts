import { PublicKey } from "@solana/web3.js";
import { StakeEscrow, Unstake } from "@/lib/stake/types";
import { BN } from "@coral-xyz/anchor";

export interface Pool {
  vault: PublicKey;
  tokenMint: PublicKey;
  escrow: PublicKey;
  tokenVaultAccount: PublicKey;
  tokenMintDecimals: number;
  quoteVaultAccount: PublicKey;
  poolCreator: PublicKey;
  liquidTokenMint: PublicKey;
  liquidTokenVault: PublicKey;
  liquidSupply: BN;
  lut: PublicKey;
  depositFeeRate: BN;
  rewardFeeRate: BN;
  protocolFeesToken: BN;
  protocolFeesQuote: BN;
  recentEpoch: BN;
  bump: number;
  authBump: number;
  status: number;
  padding: BN[];
}   

export interface UnstakeRequest {
  unstakeKey: PublicKey;
  unstakeRequest: PublicKey;
  unstake: Unstake;
}


