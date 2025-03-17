import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { STAKE_FOR_FEE_PROGRAM_ID } from "./constants";
import { createStakeFeeProgram } from "./stake/helpers/program";
import { Program } from "@coral-xyz/anchor";
import { Rememe } from "./IDL/rememe";

export async function getTokenBalance(
  connection: Connection,
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<number> {
  try {
    const tokenAccount = getAssociatedTokenAddressSync(tokenMintAddress, walletAddress)
    const tokenAccountBalance = await connection.getTokenAccountBalance(tokenAccount)
    if (!tokenAccountBalance) {
      return 0;
    }
    return (
      Number(tokenAccountBalance.value.amount) /
      10 ** tokenAccountBalance.value.decimals
    );
  } catch (error) {
    return 0;
  }
}

export async function getUnstakeByUser(
    program: Program<Rememe>,
    owner: PublicKey,
  ) {
    return await program.account.lstUnstakeRequest.all([
      {
        memcmp: {
          offset: 8,
          bytes: owner.toBase58(),
        },
      },
    ]);
  }

