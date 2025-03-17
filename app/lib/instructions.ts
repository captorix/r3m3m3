import { Program, BN, web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Rememe } from "./IDL/rememe";
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
import { NATIVE_MINT } from "@solana/spl-token";
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
  VAULT_KEY,
} from "./constants";
import {
  deriveFullBalanceList,
  deriveStakeEscrow,
  deriveTopStakerList,
} from "./stake/helpers/pda";
import { StakeForFee } from "./stake";
import { findLargestStakerNotInTopListFromFullBalanceList, findReplaceableTopStaker as findReplaceableTopStakerstake } from "@/lib/stake/helpers/staker_for_fee";

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

function findLargestStakerNotInTopListFromFullBalanceListstake(lookupNumber: number, stakeForFee: StakeForFee) {
  return findLargestStakerNotInTopListFromFullBalanceList(
    lookupNumber,
    stakeForFee.accountStates.fullBalanceListState
  ).map((s) => {
    return deriveStakeEscrow(
      stakeForFee.feeVaultKey,
      s.owner,
      stakeForFee.stakeForFeeProgram.programId
    );
  });
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
  pubkey: PublicKey,
  stakeForFee: StakeForFee,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidPoolBump] =
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
    pubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  const stakerTokenVault = getAssociatedTokenAddressSync(
    tokenMint,
    pubkey,
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
        pubkey,
        stakerLiquidTokenVault,
        pubkey,
        liquidTokenMint,
        TOKEN_PROGRAM_ID
      )
    );
  }
  const smallestStakeEscrow =
    stakeForFee.findSmallestStakeEscrowInFullBalanceList(pubkey);
  if (!smallestStakeEscrow) {
    throw new Error("Smallest stake escrow not found");
  }

  const remainingAccounts: Array<AccountMeta> = [];
  const replaceableTopStakerCount = 2;
  console.log(stakeForFee.accountStates.topStakerListState);
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
      staker: pubkey,
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
      smallestStakeEscrow: smallestStakeEscrow,
      stakerTokenVault: stakerTokenVault,
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
  owner: PublicKey,
  stakeForFee: StakeForFee,
  unstake: Signer,
  lstUnstakeRequest: Signer,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _] = await getLiquidStakingPoolAddress(
    program.programId,
    tokenMint
  );
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
    owner,
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
        owner,
        stakerLiquidTokenVault,
        owner,
        liquidTokenMint,
        TOKEN_PROGRAM_ID
      )
    );
  }

  const smallestStakeEscrow =
    stakeForFee.findSmallestStakeEscrowInFullBalanceList(owner);
  if (!smallestStakeEscrow) {
    throw new Error("Smallest stake escrow not found");
  }

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
    const candidateToEnterTopList: Array<AccountMeta> = findLargestStakerNotInTopListFromFullBalanceListstake(3, stakeForFee)
      .map((key) => {
        return {
          pubkey: key,
          isSigner: false,
          isWritable: true,
        };
      });

    // remainingAccounts.push(...candidateToEnterTopList);
  }
  console.log(stakeEscrowKey.toString());
  const unstakeIx = await program.methods
    .requestUnstake(new BN(amount))
    .accounts({
      lstUnstakeRequest: lstUnstakeRequest.publicKey,
      unstake: unstake.publicKey,
      staker: owner,
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

  instructions.push(unstakeIx);
  return instructions;
}

export async function cancelUnstake(
  program: Program<Rememe>,
  pubkey: PublicKey,
  stakeForFee: StakeForFee,
  unstake: PublicKey,
  lstUnstakeRequest: PublicKey,
  tokenMint: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [config, _configBump] = await getConfigAddress(program.programId);
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _] = await getLiquidStakingPoolAddress(
    program.programId,
    tokenMint
  );
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
    pubkey,
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
        pubkey,
        stakerLiquidTokenVault,
        pubkey,
        liquidTokenMint,
        TOKEN_PROGRAM_ID
      )
    );
  }

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

  const smallestStakeEscrow =
    stakeForFee.findSmallestStakeEscrowInFullBalanceList(pubkey);
  if (!smallestStakeEscrow) {
    throw new Error("Smallest stake escrow not found");
  }

  const unstakeIx = await program.methods
    .cancelUnstake()
    .accounts({
      lstUnstakeRequest: lstUnstakeRequest,
      unstake: unstake,
      staker: pubkey,
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
      smallestStakeEscrow: smallestStakeEscrow,
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
      ...remainingAccounts
    ])
    .instruction();

  return [unstakeIx];
}

export async function withdraw(
  program: Program<Rememe>,
  pubkey: PublicKey,
  stakeForFee: StakeForFee,
  tokenMint: PublicKey,
  unstake: PublicKey,
  lstUnstakeRequest: PublicKey,
  vault: PublicKey
): Promise<TransactionInstruction[]> {
  const [auth, _authBump] = await getAuthAddress(program.programId);
  const [liquidStakingPool, _liquidPoolBump] =
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

  const instructions: TransactionInstruction[] = [];

  const stakerTokenVault = getAssociatedTokenAddressSync(
    tokenMint,
    pubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  if (!(await accountExist(program.provider.connection, stakerTokenVault))) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        pubkey,
        stakerTokenVault,
        pubkey,
        tokenMint,
        TOKEN_PROGRAM_ID
      )
    );
  }

  const withdrawIX = await program.methods
    .withdraw()
    .accounts({
      staker: pubkey,
      liquidStakingPool: liquidStakingPool,
      authority: auth,
      tokenVault: tokenVault,
      stakerTokenVault: stakerTokenVault,
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

  instructions.push(withdrawIX);
  return instructions;
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
