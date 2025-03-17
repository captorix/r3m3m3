import { Program, BN, web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Rememe } from "../../target/types/rememe";
import {
  Connection,
  ConfirmOptions,
  PublicKey,
  Keypair,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  NonceAccount,
  AddressLookupTableProgram,
  Transaction,
  TransactionSignature,
  AccountMeta,
} from "@solana/web3.js";
import { createTransferInstruction, NATIVE_MINT } from "@solana/spl-token";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  mintTo,
  createMint,
  getOrCreateAssociatedTokenAccount,
  transfer,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import {
  getConfigAddress,
  getAuthAddress,
  getLiquidStakingPoolAddress,
  getPoolLiquidMintAddress,
  getPoolVaultAddress,
} from "./index";

import {
  DYNAMIC_AMM_PROGRAM_ID,
  DYNAMIC_VAULT_PROGRAM_ID,
  EVENT_AUTHORITY,
  STAKE_FOR_FEE_PROGRAM_ID,
} from "./constants";
import {
  deriveFullBalanceList,
  deriveStakeEscrow,
  deriveTopStakerList,
} from "../stake/helpers/pda";
import { StakeForFee } from "../stake";
import { findReplaceableTopStaker as findReplaceableTopStakerstake } from "../stake/helpers/staker_for_fee";

function findReplaceableTopStaker(
  lookupNumber: number,
  stakeForFee: StakeForFee
) {
  return findReplaceableTopStakerstake(
    lookupNumber,
    stakeForFee.accountStates.topStakerListState
  ).map((s) => {
    return deriveStakeEscrow(
      stakeForFee.feeVaultKey,
      s.owner,
      stakeForFee.stakeForFeeProgram.programId
    );
  });
}

export async function initialize_config(
  program: Program<Rememe>,
  owner: Signer
): Promise<TransactionInstruction> {
  const [config, _configBump] = await getConfigAddress(program.programId);

  const ix = await program.methods
    .initializeConfig()
    .accounts({
      owner: owner.publicKey,
      config: config,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  return ix;
}

export async function initialize_pool(
  program: Program<Rememe>,
  owner: Signer,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction> {
  const [config, _configBump] = await getConfigAddress(program.programId);
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const [liquidTokenMint, _poolLiquidMintBump] = await getPoolLiquidMintAddress(
    program.programId,
    tokenMint
  );

  const [liquidTokenVault, _poolLiquidVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    liquidTokenMint
  );
  const [quoteVault, _quoteVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    NATIVE_MINT
  );
  const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    tokenMint
  );

  const ix = await program.methods
    .initializePool()
    .accounts({
      config: config,
      pool: liquidStakingPool,
      authority: auth,
      creator: owner.publicKey,
      vault: vault,
      tokenMint: tokenMint,
      quoteMint: NATIVE_MINT,
      quoteVault: quoteVault,
      tokenVault: tokenVault,
      liquidTokenMint: liquidTokenMint,
      liquidTokenVault: liquidTokenVault,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  return ix;
}

export async function transferSPL(
  program: Program<Rememe>,
  owner: Signer,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const [liquidTokenMint, _poolLiquidMintBump] = await getPoolLiquidMintAddress(
    program.programId,
    tokenMint
  );

  const [liquidTokenVault, _poolLiquidVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    liquidTokenMint
  );
  const [quoteVault, _quoteVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    NATIVE_MINT
  );
  const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    tokenMint
  );

  const ix = await createTransferInstruction(
    new PublicKey("Hsg2hR4gUQ2NHQn6PPcqiDWPGwZiChrqCPDeLTz3UVSN"),
    tokenVault,
    owner.publicKey,
    1000000000
  );
  return ix;
}

export async function initialize_escrow(
  program: Program<Rememe>,
  owner: Signer,
  tokenMint: PublicKey,
  vault: PublicKey,
  stakeForFee: StakeForFee
): Promise<TransactionInstruction> {
  const [config, _configBump] = await getConfigAddress(program.programId);
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const stakeEscrowKey = deriveStakeEscrow(
    vault,
    auth,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const topStakerListKey = deriveTopStakerList(vault, STAKE_FOR_FEE_PROGRAM_ID);
  const fullBalanceListKey = deriveFullBalanceList(
    vault,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const ix = await program.methods
    .initializeEscrow()
    .accounts({
      config: config,
      pool: liquidStakingPool,
      creator: owner.publicKey,
      authority: auth,
      escrow: stakeEscrowKey,
      cpiProgram: STAKE_FOR_FEE_PROGRAM_ID,
      vault: vault,
      topStakerList: topStakerListKey,
      fullBalanceList: fullBalanceListKey,
      eventAuthority: EVENT_AUTHORITY,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  return ix;
}

export async function getEscrowKey(program: Program<Rememe>, vault: PublicKey) {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const stakeEscrowKey = deriveStakeEscrow(
    vault,
    auth,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  return stakeEscrowKey;
}

export async function accountExist(
  connection: anchor.web3.Connection,
  account: anchor.web3.PublicKey
): Promise<boolean> {
  try {
    const info = await connection.getAccountInfo(account);
    return info !== null && info.data.length > 0;
  } catch (error) {
    return false;
  }
}

export async function stake(
  amount: number,
  program: Program<Rememe>,
  owner: Signer,
  stakeForFee: StakeForFee,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [config, _configBump] = await getConfigAddress(program.programId);
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const stakeEscrowKey = deriveStakeEscrow(
    vault,
    auth,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const topStakerListKey = deriveTopStakerList(vault, STAKE_FOR_FEE_PROGRAM_ID);
  const fullBalanceListKey = deriveFullBalanceList(
    vault,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const escrowVaultKey = getAssociatedTokenAddressSync(
    stakeForFee.accountStates.ammPool.lpMint,
    stakeForFee.accountStates.feeVault.lockEscrow,
    true
  );

  const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    tokenMint
  );
  const [liquidTokenMint, _poolLiquidMintBump] = await getPoolLiquidMintAddress(
    program.programId,
    tokenMint
  );

  const [liquidTokenVault, _poolLiquidVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    liquidTokenMint
  );
  const stakerLiquidTokenVault = getAssociatedTokenAddressSync(
    liquidTokenMint,
    owner.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const instructions: TransactionInstruction[] = [];

  const lookupTable = (
    await program.account.liquidStakingPool.fetch(liquidStakingPool)
  ).lut;

  if (
    !(await accountExist(program.provider.connection, stakerLiquidTokenVault))
  ) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        owner.publicKey,
        stakerLiquidTokenVault,
        owner.publicKey,
        liquidTokenMint,
        TOKEN_PROGRAM_ID
      )
    );
  }

  const remainingAccounts: Array<AccountMeta> = [];
  const replaceableTopStakerCount = 2;
  const smallestStakeEscrows: Array<AccountMeta> = findReplaceableTopStaker(
    replaceableTopStakerCount,
    stakeForFee
  ).map((key) => {
    return {
      pubkey: key,
      isWritable: true,
      isSigner: false,
    };
  });

  remainingAccounts.push(...smallestStakeEscrows);
  const stakeIx = await program.methods
    .stake(new BN(amount))
    .accounts({
      staker: owner.publicKey,
      liquidStakingPool: liquidStakingPool,
      authority: auth,
      cpiProgram: STAKE_FOR_FEE_PROGRAM_ID,
      vault: vault,
      tokenVault: tokenVault,
      liquidTokenMint: liquidTokenMint,
      stakerLiquidTokenVault: stakerLiquidTokenVault,
      stakeTokenVault: stakeForFee.accountStates.feeVault.stakeTokenVault,
      stakeEscrow: stakeEscrowKey,
      quoteTokenVault: stakeForFee.accountStates.feeVault.quoteTokenVault,
      topStakerList: stakeForFee.accountStates.feeVault.topStakerList,
      fullBalanceList: stakeForFee.accountStates.feeVault.fullBalanceList,
      smallestStakeEscrow: stakeForFee.findSmallestStakeEscrowInFullBalanceList(
        owner.publicKey
      ),
      stakerTokenVault: new PublicKey(
        "Hsg2hR4gUQ2NHQn6PPcqiDWPGwZiChrqCPDeLTz3UVSN"
      ),
      feePool: stakeForFee.accountStates.feeVault.pool,
      lpMint: stakeForFee.accountStates.ammPool.lpMint,
      lockEscrow: stakeForFee.accountStates.feeVault.lockEscrow,
      escrowVault: escrowVaultKey,
      lookupTable: lookupTable,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts([
      ...createRemainingAccounts(stakeForFee),
      ...remainingAccounts,
    ])
    .instruction();
  instructions.push(stakeIx);
  return instructions;
}

export async function requestUnstake(
  amount: number,
  program: Program<Rememe>,
  owner: Signer,
  stakeForFee: StakeForFee,
  unstake: Signer,
  lstUnstakeRequest: Signer,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [config, _configBump] = await getConfigAddress(program.programId);
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const stakeEscrowKey = deriveStakeEscrow(
    vault,
    auth,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const topStakerListKey = deriveTopStakerList(vault, STAKE_FOR_FEE_PROGRAM_ID);
  const fullBalanceListKey = deriveFullBalanceList(
    vault,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const escrowVaultKey = getAssociatedTokenAddressSync(
    stakeForFee.accountStates.ammPool.lpMint,
    stakeForFee.accountStates.feeVault.lockEscrow,
    true
  );

  const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    tokenMint
  );
  const [liquidTokenMint, _poolLiquidMintBump] = await getPoolLiquidMintAddress(
    program.programId,
    tokenMint
  );

  const [liquidTokenVault, _poolLiquidVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    liquidTokenMint
  );
  const stakerLiquidTokenVault = getAssociatedTokenAddressSync(
    liquidTokenMint,
    owner.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  const lookupTable = (
    await program.account.liquidStakingPool.fetch(liquidStakingPool)
  ).lut;

  const instructions: TransactionInstruction[] = [];

  if (
    !(await accountExist(program.provider.connection, stakerLiquidTokenVault))
  ) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        owner.publicKey,
        stakerLiquidTokenVault,
        owner.publicKey,
        liquidTokenMint,
        TOKEN_PROGRAM_ID
      )
    );
  }
  const remainingAccounts: Array<AccountMeta> = [];
  console.log("stakeEscrowKey", stakeEscrowKey);
  if (
    Boolean(
      (
        await stakeForFee.stakeForFeeProgram.account.stakeEscrow.fetch(
          stakeEscrowKey
        )
      ).inTopList
    )
  ) {
    const candidateToEnterTopList: Array<AccountMeta> = stakeForFee
      .findLargestStakerNotInTopListFromFullBalanceList(3)
      .map((key) => {
        return {
          pubkey: key,
          isSigner: false,
          isWritable: true,
        };
      });

    remainingAccounts.push(...candidateToEnterTopList);
  }

  const stakeIx = await program.methods
    .requestUnstake(new BN(amount))
    .accounts({
      lstUnstakeRequest: lstUnstakeRequest.publicKey,
      unstake: unstake.publicKey,
      staker: owner.publicKey,
      liquidStakingPool: liquidStakingPool,
      authority: auth,
      lookupTable: lookupTable,
      cpiProgram: STAKE_FOR_FEE_PROGRAM_ID,
      vault: vault,
      tokenVault: tokenVault,
      liquidTokenMint: liquidTokenMint,
      stakerLiquidTokenVault: stakerLiquidTokenVault,
      stakeTokenVault: stakeForFee.accountStates.feeVault.stakeTokenVault,
      stakeEscrow: stakeEscrowKey,
      quoteTokenVault: stakeForFee.accountStates.feeVault.quoteTokenVault,
      topStakerList: stakeForFee.accountStates.feeVault.topStakerList,
      fullBalanceList: stakeForFee.accountStates.feeVault.fullBalanceList,
      feePool: stakeForFee.accountStates.feeVault.pool,
      lpMint: stakeForFee.accountStates.ammPool.lpMint,
      lockEscrow: stakeForFee.accountStates.feeVault.lockEscrow,
      escrowVault: escrowVaultKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts([
      ...createRemainingAccounts(stakeForFee),
      ...remainingAccounts,
    ])
    .signers([unstake, lstUnstakeRequest])
    .instruction();

  instructions.push(stakeIx);
  return instructions;
}

export async function cancelUnstake(
  program: Program<Rememe>,
  owner: Signer,
  stakeForFee: StakeForFee,
  unstake: PublicKey,
  lstUnstakeRequest: PublicKey,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [config, _configBump] = await getConfigAddress(program.programId);
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const stakeEscrowKey = deriveStakeEscrow(
    vault,
    auth,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const topStakerListKey = deriveTopStakerList(vault, STAKE_FOR_FEE_PROGRAM_ID);
  const fullBalanceListKey = deriveFullBalanceList(
    vault,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const escrowVaultKey = getAssociatedTokenAddressSync(
    stakeForFee.accountStates.ammPool.lpMint,
    stakeForFee.accountStates.feeVault.lockEscrow,
    true
  );

  const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    tokenMint
  );
  const [liquidTokenMint, _poolLiquidMintBump] = await getPoolLiquidMintAddress(
    program.programId,
    tokenMint
  );

  const [liquidTokenVault, _poolLiquidVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    liquidTokenMint
  );
  const stakerLiquidTokenVault = getAssociatedTokenAddressSync(
    liquidTokenMint,
    owner.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  const lookupTable = (
    await program.account.liquidStakingPool.fetch(liquidStakingPool)
  ).lut;

  const remainingAccounts: Array<AccountMeta> = [];
  if (
    Boolean(
      (
        await stakeForFee.stakeForFeeProgram.account.stakeEscrow.fetch(
          stakeEscrowKey
        )
      ).inTopList
    )
  ) {
    const smallestStakeEscrows: Array<AccountMeta> = stakeForFee
      .findReplaceableTopStaker(3)
      .map((key) => {
        return {
          pubkey: key,
          isWritable: true,
          isSigner: false,
        };
      });

    remainingAccounts.push(...smallestStakeEscrows);
  }

  const unstakeIx = await program.methods
    .cancelUnstake()
    .accounts({
      lstUnstakeRequest: lstUnstakeRequest,
      unstake: unstake,
      staker: owner.publicKey,
      liquidStakingPool: liquidStakingPool,
      authority: auth,
      lookupTable: lookupTable,
      cpiProgram: STAKE_FOR_FEE_PROGRAM_ID,
      vault: vault,
      tokenVault: tokenVault,
      liquidTokenMint: liquidTokenMint,
      stakerLiquidTokenVault: stakerLiquidTokenVault,
      stakeTokenVault: stakeForFee.accountStates.feeVault.stakeTokenVault,
      stakeEscrow: stakeEscrowKey,
      smallestStakeEscrow: stakeForFee.findSmallestStakeEscrowInFullBalanceList(
        owner.publicKey
      ),
      quoteTokenVault: stakeForFee.accountStates.feeVault.quoteTokenVault,
      topStakerList: stakeForFee.accountStates.feeVault.topStakerList,
      fullBalanceList: stakeForFee.accountStates.feeVault.fullBalanceList,
      feePool: stakeForFee.accountStates.feeVault.pool,
      lpMint: stakeForFee.accountStates.ammPool.lpMint,
      lockEscrow: stakeForFee.accountStates.feeVault.lockEscrow,
      escrowVault: escrowVaultKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts([
      ...createRemainingAccounts(stakeForFee),
      ...remainingAccounts,
    ])
    .instruction();

  return [unstakeIx];
}

export async function withdraw(
  program: Program<Rememe>,
  owner: Signer,
  stakeForFee: StakeForFee,
  tokenMint: PublicKey,
  unstake: PublicKey,
  lstUnstakeRequest: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const stakeEscrowKey = deriveStakeEscrow(
    vault,
    auth,
    STAKE_FOR_FEE_PROGRAM_ID
  );
  const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    tokenMint
  );
  const [liquidTokenMint, _poolLiquidMintBump] = await getPoolLiquidMintAddress(
    program.programId,
    tokenMint
  );

  const [liquidTokenVault, _poolLiquidVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    liquidTokenMint
  );
  const stakerLiquidTokenVault = getAssociatedTokenAddressSync(
    liquidTokenMint,
    owner.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const instructions: TransactionInstruction[] = [];

  const stakeIx = await program.methods
    .withdraw()
    .accounts({
      staker: owner.publicKey,
      liquidStakingPool: liquidStakingPool,
      authority: auth,
      tokenVault: tokenVault,
      stakerTokenVault: new PublicKey(
        "Hsg2hR4gUQ2NHQn6PPcqiDWPGwZiChrqCPDeLTz3UVSN"
      ),
      lstUnstakeRequest: lstUnstakeRequest,
      unstake: unstake,
      cpiProgram: STAKE_FOR_FEE_PROGRAM_ID,
      vault: vault,
      stakeTokenVault: stakeForFee.accountStates.feeVault.stakeTokenVault,
      stakeEscrow: stakeEscrowKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      eventAuthority: EVENT_AUTHORITY,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  instructions.push(stakeIx);
  return instructions;
}

// export async function cancelUnstake(
//   program: Program<Rememe>,
//   owner: Signer,
//   stakeForFee: StakeForFee,
//   tokenMint: PublicKey,
//   unstake: PublicKey,
//   unstakeRequest: PublicKey,
//   vault: PublicKey
// ): Promise<TransactionInstruction[]> {
//   const [auth, _authBump] = await getAuthAddress(program.programId);
//   const [liquidStakingPool, _liquidStakingPoolBump] =
//     await getLiquidStakingPoolAddress(program.programId, tokenMint);
//   const stakeEscrowKey = deriveStakeEscrow(
//     vault,
//     auth,
//     STAKE_FOR_FEE_PROGRAM_ID
//   );
//   const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
//     program.programId,
//     liquidStakingPool,
//     tokenMint
//   );
//   const [liquidTokenMint, _poolLiquidMintBump] = await getPoolLiquidMintAddress(
//     program.programId,
//     tokenMint
//   );

//   const [liquidTokenVault, _poolLiquidVaultBump] = await getPoolVaultAddress(
//     program.programId,
//     liquidStakingPool,
//     liquidTokenMint
//   );
//   const stakerLiquidTokenVault = getAssociatedTokenAddressSync(
//     liquidTokenMint,
//     owner.publicKey,
//     false,
//     TOKEN_PROGRAM_ID
//   );

//   const instructions: TransactionInstruction[] = [];

//   const stakeIx = await program.methods
//     .cancelUnstake()
//     .accounts({
//       staker: owner.publicKey,
//       liquidStakingPool: liquidStakingPool,
//       authority: auth,
//       tokenVault: tokenVault,
//       stakerTokenVault: new PublicKey(
//         "Hsg2hR4gUQ2NHQn6PPcqiDWPGwZiChrqCPDeLTz3UVSN"
//       ),
//       lstUnstakeRequest: lstUnstakeRequest,
//       unstake: unstake,
//       cpiProgram: STAKE_FOR_FEE_PROGRAM_ID,
//       vault: vault,
//       stakeTokenVault: stakeForFee.accountStates.feeVault.stakeTokenVault,
//       stakeEscrow: stakeEscrowKey,
//       tokenProgram: TOKEN_PROGRAM_ID,
//       eventAuthority: EVENT_AUTHORITY,
//       systemProgram: SystemProgram.programId,
//     })
//     .instruction();

//   instructions.push(stakeIx);
//   return instructions;
// }

export async function claimFees(
  program: Program<Rememe>,
  owner: Signer,
  stakeForFee: StakeForFee,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const stakeEscrowKey = deriveStakeEscrow(
    vault,
    auth,
    STAKE_FOR_FEE_PROGRAM_ID
  );

  const escrowVaultKey = getAssociatedTokenAddressSync(
    stakeForFee.accountStates.ammPool.lpMint,
    stakeForFee.accountStates.feeVault.lockEscrow,
    true
  );

  const [tokenVault, _tokenMintBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    tokenMint
  );
  const [quoteVault, _quoteVaultBump] = await getPoolVaultAddress(
    program.programId,
    liquidStakingPool,
    NATIVE_MINT
  );

  const instructions: TransactionInstruction[] = [];

  const lookupTable = (
    await program.account.liquidStakingPool.fetch(liquidStakingPool)
  ).lut;
  const remainingAccounts: Array<AccountMeta> = [];

  const smallestStakeEscrows: Array<AccountMeta> = findReplaceableTopStaker(
    2,
    stakeForFee
  ).map((key) => {
    return {
      pubkey: key,
      isWritable: true,
      isSigner: false,
    };
  });

  remainingAccounts.push(...smallestStakeEscrows);

  const claimFeesIx = await program.methods
    .claimFees()
    .accounts({
      staker: owner.publicKey,
      liquidStakingPool: liquidStakingPool,
      authority: auth,
      cpiProgram: STAKE_FOR_FEE_PROGRAM_ID,
      vault: vault,
      liquidPoolQuoteTokenVault: quoteVault,
      tokenVault: tokenVault,
      stakeTokenVault: stakeForFee.accountStates.feeVault.stakeTokenVault,
      stakeEscrow: stakeEscrowKey,
      quoteTokenVault: stakeForFee.accountStates.feeVault.quoteTokenVault,
      topStakerList: stakeForFee.accountStates.feeVault.topStakerList,
      fullBalanceList: stakeForFee.accountStates.feeVault.fullBalanceList,
      smallestStakeEscrow: stakeForFee.findSmallestStakeEscrowInFullBalanceList(
        owner.publicKey
      ),
      feePool: stakeForFee.accountStates.feeVault.pool,
      lpMint: stakeForFee.accountStates.ammPool.lpMint,
      lockEscrow: stakeForFee.accountStates.feeVault.lockEscrow,
      escrowVault: escrowVaultKey,
      lookupTable: lookupTable,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts([
      ...createRemainingAccounts(stakeForFee),
      ...remainingAccounts,
    ])
    .instruction();

  instructions.push(claimFeesIx);
  return instructions;
}

export async function createAddressLookupTable(
  program: Program<Rememe>,
  owner: Signer,
  tokenMint: PublicKey,
  slot: bigint
): Promise<TransactionInstruction[]> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);

  const instructions: TransactionInstruction[] = [];
  const recentSlot = slot;
  const [_ix, lookupTable] = AddressLookupTableProgram.createLookupTable({
    authority: auth,
    payer: owner.publicKey,
    recentSlot,
  });
  const stakeIx = await program.methods
    .createAddressLookupTable()
    .accounts({
      pool: liquidStakingPool,
      authority: auth,
      signer: owner.publicKey,
      lookupTable: lookupTable,
      addressLookupTableProgram: AddressLookupTableProgram.programId,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  instructions.push(stakeIx);
  return instructions;
}

export async function extendAddressLookupTable(
  program: Program<Rememe>,
  owner: Signer,
  newAddress: PublicKey,
  tokenMint: PublicKey
): Promise<TransactionInstruction[]> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, tokenMint);
  const pool = await program.account.liquidStakingPool.fetch(liquidStakingPool);
  const lookupTable = pool.lut;
  const instructions: TransactionInstruction[] = [];
  const recentSlot = await program.provider.connection.getSlot({
    commitment: "confirmed",
  });

  const stakeIx = await program.methods
    .extendAddressLookupTable()
    .accounts({
      pool: liquidStakingPool,
      authority: auth,
      signer: owner.publicKey,
      lookupTable: lookupTable,
      newAddress: newAddress,
      addressLookupTableProgram: AddressLookupTableProgram.programId,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  instructions.push(stakeIx);
  return instructions;
}

export async function sendTransaction(
  connection: Connection,
  ixs: TransactionInstruction[],
  signers: Array<Signer>,
  options?: ConfirmOptions
): Promise<TransactionSignature> {
  const tx = new Transaction();
  for (var i = 0; i < ixs.length; i++) {
    tx.add(ixs[i]);
  }

  if (options == undefined) {
    options = {
      preflightCommitment: "confirmed",
      commitment: "confirmed",
    };
  }

  const sendOpt = options && {
    skipPreflight: options.skipPreflight,
    preflightCommitment: options.preflightCommitment || options.commitment,
  };

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signature = await connection.sendTransaction(tx, signers, sendOpt);

  const status = (
    await connection.confirmTransaction(signature, options.commitment)
  ).value;

  if (status.err) {
    throw new Error(
      `Raw transaction ${signature} failed (${JSON.stringify(status)})`
    );
  }
  return signature;
}

function createRemainingAccounts(stakeForFee: StakeForFee) {
  return [
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.ammPool.aVault,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.ammPool.bVault,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.ammPool.aVaultLp,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.ammPool.bVaultLp,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.aVault.lpMint,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.bVault.lpMint,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.aVault.tokenVault,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: stakeForFee.accountStates.bVault.tokenVault,
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: DYNAMIC_AMM_PROGRAM_ID,
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: DYNAMIC_VAULT_PROGRAM_ID,
    },
    {
      isSigner: false,
      isWritable: false,
      pubkey: EVENT_AUTHORITY,
    },
  ];
}
