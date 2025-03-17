import {
  Program,
  AnchorProvider,
  setProvider,
  Wallet,
} from "@coral-xyz/anchor";
import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";

import { IDL } from "../target/types/rememe";

import { Connection } from "@solana/web3.js";
import { Rememe } from "../target/types/rememe";
import {
  createAddressLookupTable,
  extendAddressLookupTable,
  initialize_escrow,
  initialize_pool,
  sendTransaction,
  claimFees,
} from "./lib/instructions";
import { initialize_config } from "./lib/instructions";
import {
  DYNAMIC_AMM_PROGRAM_ID,
  DYNAMIC_VAULT_PROGRAM_ID,
  EVENT_AUTHORITY,
  TOKEN_MINT_KEY,
  VAULT_KEY,
} from "./lib/constants";
import { StakeForFee } from "../tests/stake";
import { ComputeBudgetProgram } from "@solana/web3.js";
import { getAddressLookupTable } from "./lib/pda";

import dotenv from 'dotenv';
dotenv.config();

const programId = new PublicKey("S3F3SGMgKp95gyA9fTgARwo4vMWXA1qwFUU8pAa19pg");
const connection = new Connection(
  process.env.NEXT_PUBLIC_HELIUS!,
  { commitment: "confirmed" }
);
const payer = Keypair.fromSecretKey(
  bs58.decode(process.env.NEXT_PUBLIC_HELIUS_KEY!)
);
const POOL = new PublicKey("79raiHK7DDEGYAQ5dCgKd55GtoxaytvdDZKLEbCM3gRy");

const wallet = new Wallet(payer);
const provider = new AnchorProvider(connection, wallet, {});
setProvider(provider);

const main = async () => {
  const program = new Program(IDL, programId, provider);
  const stakeForFee = await StakeForFee.create(connection, POOL);

  const setComputeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 500000,
  });
  
  const lookupTable = await getAddressLookupTable(program, TOKEN_MINT_KEY);
  const lookupTableAccount = (
    await connection.getAddressLookupTable(lookupTable)
  ).value;
  const ixClaimFees = await claimFees(program, payer, stakeForFee, TOKEN_MINT_KEY, VAULT_KEY);
  const txClaimFees = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: (await provider.connection.getLatestBlockhash()).blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 30000 }),

      ...ixClaimFees,
    ],
  }).compileToV0Message([lookupTableAccount]);

  const versionedTxClaimFees = new VersionedTransaction(txClaimFees);
  versionedTxClaimFees.sign([payer]);
  const txSigClaimFees = await connection.sendTransaction(versionedTxClaimFees, {
    skipPreflight: true,
  });
  console.log(txSigClaimFees);
  // // await connection.confirmTransaction(txSigLUT);
  // const ixInitConfig = await initialize_config(program, payer);
  // const ixInitPool = await initialize_pool(
  //   program,
  //   payer,
  //   TOKEN_MINT_KEY,
  //   VAULT_KEY
  // );
  // const signature = await sendTransaction(
  //   program.provider.connection,
  //   [setComputeUnitPrice, ixInitConfig, ixInitPool],
  //   [payer]
  // );

  // console.log(signature);

  // const ixInitEscrow = await initialize_escrow(
  //   program,
  //   payer,
  //   TOKEN_MINT_KEY,
  //   VAULT_KEY,
  //   stakeForFee
  // );
  // const signatureEscrow = await sendTransaction(
  //   program.provider.connection,
  //   [setComputeUnitPrice, ixInitEscrow],
  //   [payer]
  // );
  // console.log(signatureEscrow);
  // const recentSlot = await provider.connection.getSlot();
  // console.log(recentSlot);
  // const txLUT = await createAddressLookupTable(
  //   program,
  //   payer,
  //   TOKEN_MINT_KEY,
  //   BigInt(recentSlot + 34)
  // );

  // const txLUTMsg = new TransactionMessage({
  //   payerKey: payer.publicKey,
  //   recentBlockhash: (await provider.connection.getLatestBlockhash()).blockhash,
  //   instructions: [
  //     ComputeBudgetProgram.setComputeUnitLimit({ units: 500000 }),
  //     ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500000 }),
  //     ...txLUT,
  //   ],
  // }).compileToV0Message([]);

  // const versionedTxLUT = new VersionedTransaction(txLUTMsg);
  // versionedTxLUT.sign([payer]);
  // const txSigLUT = await connection.sendTransaction(versionedTxLUT, {
  //   skipPreflight: true,
  // });
  // // await connection.confirmTransaction(txSigLUT);
  // console.log(txSigLUT);
  // 312727064
  // 312727002

  // 312727265
  // 312727304
  // 312727564
  // 312727599

  // 312727452
  // 312727417
  // const txSig = await sendTransaction(
  //   program.provider.connection,
  //   [...txLUT],
  //   [payer],
  //   { skipPreflight: true }
  // );
  // console.log(txSig);
  // const extendLUT = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.aVault.lpMint,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT2 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.bVault.lpMint,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT3 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.ammPool.aVaultLp,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT4 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.ammPool.aVaultLp,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT5 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.ammPool.aVault,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT6 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.ammPool.bVault,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT7 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.aVault.tokenVault,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT8 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   stakeForFee.accountStates.bVault.tokenVault,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT9 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   DYNAMIC_AMM_PROGRAM_ID,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT10 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   DYNAMIC_VAULT_PROGRAM_ID,
  //   TOKEN_MINT_KEY
  // );
  // const extendLUT11 = await extendAddressLookupTable(
  //   program,
  //   payer,
  //   EVENT_AUTHORITY,
  //   TOKEN_MINT_KEY
  // );

  // const extendLUTSig = await sendTransaction(
  //   program.provider.connection,
  //   [
  //     setComputeUnitPrice,
  //     ...extendLUT,
  //     ...extendLUT2,
  //     ...extendLUT3,
  //     ...extendLUT4,
  //     ...extendLUT5,
  //     ...extendLUT6,
  //     ...extendLUT7,
  //     ...extendLUT8,
  //     ...extendLUT9,
  //     ...extendLUT10,
  //     ...extendLUT11,
  //   ],
  //   [payer]
  // );
  // console.log(extendLUTSig);
};

setInterval(main, 60 * 1000);
main(); 
