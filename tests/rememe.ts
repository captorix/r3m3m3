import { BN, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
  Connection,
  AddressLookupTableProgram,
  SystemProgram,
} from "@solana/web3.js";
import { Rememe } from "../target/types/rememe";
import dotenv from "dotenv";
import {
  cancelUnstake,
  claimFees,
  createAddressLookupTable,
  extendAddressLookupTable,
  getEscrowKey,
  initialize_config,
  initialize_escrow,
  initialize_pool,
  requestUnstake,
  sendTransaction,
  stake,
  transferSPL,
  withdraw,
} from "./lib/instructions";
import { createStakeFeeProgram } from "./stake/helpers";
import { StakeForFee } from "./stake";
import {
  DYNAMIC_AMM_PROGRAM_ID,
  DYNAMIC_VAULT_PROGRAM_ID,
  EVENT_AUTHORITY,
  TOKEN_MINT_KEY,
  USER_KEY,
  VAULT_KEY,
} from "./lib/constants";
import { TOKEN_PROGRAM_ID, transfer } from "@solana/spl-token";
import { getAddressLookupTable, getLiquidStakingPoolAddress } from "./lib/pda";
import { IDL } from "../target/types/rememe";
import { StakeForFee as StakeForFeeProgram } from "./stake/idls/stake_for_fee";


dotenv.config();

describe("rememe anchor test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.rememe as Program<Rememe>;
  const connection = provider.connection;
  let lookuptable: PublicKey;

  const payer = Keypair.fromSecretKey(
    bs58.decode(process.env.NEXT_PUBLIC_HELIUS_KEY!)
  );
  const POOL = new PublicKey("79raiHK7DDEGYAQ5dCgKd55GtoxaytvdDZKLEbCM3gRy");

  let feeProgram: Program<StakeForFeeProgram>;
  let stakeForFee: StakeForFee;

  it("Init test", async () => {
    feeProgram = createStakeFeeProgram(
      provider.connection,
      new PublicKey("FEESngU3neckdwib9X3KWqdL7Mjmqk9XNp3uh5JbP4KP")
    );
    stakeForFee = await StakeForFee.create(connection, POOL);

    const ixInitConfig = await initialize_config(program, payer);
    const ixInitPool = await initialize_pool(
      program,
      payer,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );

    const signature = await sendTransaction(
      program.provider.connection,
      [ixInitConfig, ixInitPool],
      [payer]
    );

    const ixInitEscrow = await initialize_escrow(
      program,
      payer,
      TOKEN_MINT_KEY,
      VAULT_KEY,
      stakeForFee
    );
    const signatureEscrow = await sendTransaction(
      program.provider.connection,
      [ixInitEscrow],
      [payer]
    );

    const recentSlot = await provider.connection.getSlot();

    const txLUT = await createAddressLookupTable(
      program,
      payer,
      TOKEN_MINT_KEY,
      BigInt(recentSlot)
    );
    const txSig = await sendTransaction(
      program.provider.connection,
      [...txLUT],
      [payer],
      { skipPreflight: true }
    );
    const extendLUT = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.aVault.lpMint,
      TOKEN_MINT_KEY
    );
    const extendLUT2 = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.bVault.lpMint,
      TOKEN_MINT_KEY
    );
    const extendLUT3 = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.ammPool.aVaultLp,
      TOKEN_MINT_KEY
    );
    const extendLUT4 = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.ammPool.aVaultLp,
      TOKEN_MINT_KEY
    );
    const extendLUT5 = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.ammPool.aVault,
      TOKEN_MINT_KEY
    );
    const extendLUT6 = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.ammPool.bVault,
      TOKEN_MINT_KEY
    );
    const extendLUT7 = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.aVault.tokenVault,
      TOKEN_MINT_KEY
    );
    const extendLUT8 = await extendAddressLookupTable(
      program,
      payer,
      stakeForFee.accountStates.bVault.tokenVault,
      TOKEN_MINT_KEY
    );
    const extendLUT9 = await extendAddressLookupTable(
      program,
      payer,
      DYNAMIC_AMM_PROGRAM_ID,
      TOKEN_MINT_KEY
    );
    const extendLUT10 = await extendAddressLookupTable(
      program,
      payer,
      DYNAMIC_VAULT_PROGRAM_ID,
      TOKEN_MINT_KEY
    );
    const extendLUT11 = await extendAddressLookupTable(
      program,
      payer,
      EVENT_AUTHORITY,
      TOKEN_MINT_KEY
    );

    const extendLUTSig = await sendTransaction(
      program.provider.connection,
      [
        ...extendLUT,
        ...extendLUT2,
        ...extendLUT3,
        ...extendLUT4,
        ...extendLUT5,
        ...extendLUT6,
        ...extendLUT7,
        ...extendLUT8,
        ...extendLUT9,
        ...extendLUT10,
        ...extendLUT11,
      ],
      [payer]
    );

    const lookupTable = await getAddressLookupTable(program, TOKEN_MINT_KEY);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(
      await stakeForFee.findSmallestStakeEscrowInFullBalanceList(payer.publicKey)
    );


    const lookupTableAccount = (
      await connection.getAddressLookupTable(lookupTable)
    ).value;

    const ixsStake = await stake(
      1000000000,
      program,
      payer,
      stakeForFee,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );
    const txStakeMsg = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixsStake,
      ],
    }).compileToV0Message([lookupTableAccount]);

    const versionedTxStake = new VersionedTransaction(txStakeMsg);
    versionedTxStake.sign([payer]);
    const txSigStake = await connection.sendTransaction(versionedTxStake, {
    });
    await connection.confirmTransaction(txSigStake);
    console.log("txSigStake", txSigStake);
    const escrowKey = await getEscrowKey(program, VAULT_KEY);

    const ixsStake1 = await stake(
      10000000000,
      program,
      payer,
      stakeForFee,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );

    const txStakeMsg1 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixsStake1,
      ],
    }).compileToV0Message([lookupTableAccount]);

    const versionedTxStake1 = new VersionedTransaction(txStakeMsg1);
    versionedTxStake1.sign([payer]);
    const txSigStake1 = await connection.sendTransaction(versionedTxStake1, {});
    await connection.confirmTransaction(txSigStake1);

    console.log("AFWAFW))")
    const ixClaim = await claimFees(
      program,
      payer,
      stakeForFee,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );
    const txClaimMsg = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixClaim,
      ],
    }).compileToV0Message([lookupTableAccount]);
    const versionedTxClaim = new VersionedTransaction(txClaimMsg);
    versionedTxClaim.sign([payer]);
    const txSigClaim = await connection.sendTransaction(versionedTxClaim);
    await connection.confirmTransaction(txSigClaim);

    const [liquidPool] = await getLiquidStakingPoolAddress(
      program.programId,
      TOKEN_MINT_KEY
    );
    const liquidPoolData = await program.account.liquidStakingPool.fetch(
      liquidPool
    );
    const unstakeKeypair = Keypair.generate();
    const requestUnstakeKeypair = Keypair.generate();
    const ixUnstake = await requestUnstake(
      900000000,
      program,
      payer,
      stakeForFee,
      unstakeKeypair,
      requestUnstakeKeypair,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );
    const txUnstakeMsg = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixUnstake,
      ],
    }).compileToV0Message([lookupTableAccount]);
    const versionedTxUnstake = new VersionedTransaction(txUnstakeMsg);
    versionedTxUnstake.sign([payer, unstakeKeypair, requestUnstakeKeypair]);
    const txSigUnstake = await connection.sendTransaction(versionedTxUnstake, {
      skipPreflight: true
    });
    await connection.confirmTransaction(txSigUnstake);

    const ixCancelUnstake = await cancelUnstake(
      program,
      payer,
      stakeForFee,
      unstakeKeypair.publicKey,
      requestUnstakeKeypair.publicKey,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );
    const txCancelUnstakeMsg = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixCancelUnstake,
      ],
    }).compileToV0Message([lookupTableAccount]);
    const versionedTxCancelUnstake = new VersionedTransaction(txCancelUnstakeMsg);
    versionedTxCancelUnstake.sign([payer]);

    const txSigCancelUnstake = await connection.sendTransaction(versionedTxCancelUnstake, {});
    await connection.confirmTransaction(txSigCancelUnstake);
    console.log("fwaafw", txSigCancelUnstake);


  });

  //   const txUnstakeMsg = new TransactionMessage({
  //     payerKey: payer.publicKey,
  //     recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  //     instructions: [
  //       ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
  //       ...ixUnstake,
  //     ],
  //   }).compileToV0Message([]);
  //   const versionedTxUnstake = new VersionedTransaction(txUnstakeMsg);
  //   versionedTxUnstake.sign([payer, unstakeKeypair, requestUnstakeKeypair]);
  //   const txSigUnstake = await connection.sendTransaction(versionedTxUnstake);
  //   await connection.confirmTransaction(txSigUnstake);

  //   const ixWithdraw = await withdraw(
  //     program,
  //     payer,
  //     stakeForFee,
  //     TOKEN_MINT_KEY,
  //     unstakeKeypair.publicKey,
  //     requestUnstakeKeypair.publicKey,
  //     VAULT_KEY
  //   );
  //   const txWithdrawMsg = new TransactionMessage({
  //     payerKey: payer.publicKey,
  //     recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  //     instructions: [
  //       ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
  //       ...ixWithdraw,
  //     ],
  //   }).compileToV0Message([]);
  //   const versionedTxWithdraw = new VersionedTransaction(txWithdrawMsg);
  //   versionedTxWithdraw.sign([payer]);
  //   const txSigWithdraw = await connection.sendTransaction(versionedTxWithdraw);
  //   await connection.confirmTransaction(txSigWithdraw);
  // });
});
