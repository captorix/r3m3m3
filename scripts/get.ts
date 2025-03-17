import {
  Program,
  AnchorProvider,
  setProvider,
  Wallet,
} from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
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
import { getAddressLookupTable, getLiquidStakingPoolAddress } from "./lib/pda";

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
  const [liquidStakingPool, _liquidStakingPoolBump] =
    await getLiquidStakingPoolAddress(program.programId, TOKEN_MINT_KEY);
  const data = await program.account.liquidStakingPool.fetch(liquidStakingPool)
  console.log("liquidSupply", data.liquidSupply.toString());
  console.log("protocolFeesToken", data.protocolFeesToken.toString());
};

main();
