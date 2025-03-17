import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Rememe } from "./IDL/rememe";

export const CONFIG_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("config")
);

export const AUTH_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("auth"));

export const LIQUID_STAKING_POOL_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("liquid_staking_pool")
);

export const LIQUID_STAKING_POOL_MINT_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("liquid_staking_pool_mint")
);

export const LIQUID_STAKING_POOL_VAULT_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("liquid_staking_pool_vault")
);

export const getAddressLookupTable = async (
  program: Program<Rememe>,
  mintTo: PublicKey
) => {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LIQUID_STAKING_POOL_SEED, mintTo.toBuffer()],
    program.programId
  );
  const pool = await program.account.liquidStakingPool.fetch(address);
  return pool.lut;
};

export async function getConfigAddress(
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [CONFIG_SEED],
    programId
  );
  return [address, bump];
}

export async function getAuthAddress(
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [AUTH_SEED],
    programId
  );
  return [address, bump];
}

export async function getLiquidStakingPoolAddress(
  programId: PublicKey,
  tokenMint: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LIQUID_STAKING_POOL_SEED, tokenMint.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getPoolLiquidMintAddress(
  programId: PublicKey,
  tokenMint: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LIQUID_STAKING_POOL_MINT_SEED, tokenMint.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getPoolVaultAddress(
  programId: PublicKey,
  pool: PublicKey,
  tokenMint: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LIQUID_STAKING_POOL_VAULT_SEED, pool.toBuffer(), tokenMint.toBuffer()],
    programId
  );
  return [address, bump];
}