import {
  startAnchor,
  Clock,
  BanksClient,
  ProgramTestContext,
} from "solana-bankrun";
import {
  AddressLookupTableProgram,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import { BN, Program, Wallet } from "@coral-xyz/anchor";
import { Rememe } from "../target/types/rememe";
import { IDL } from "../target/types/rememe";
import dotenv from "dotenv";
import {
  createAddressLookupTable,
  extendAddressLookupTable,
  getEscrowKey,
  initialize_config,
  initialize_escrow,
  initialize_pool,
  requestUnstake,
  sendTransaction,
  stake,
  withdraw,
} from "./lib/instructions";
import {
  DYNAMIC_AMM_PROGRAM_ID,
  DYNAMIC_VAULT_PROGRAM_ID,
  EVENT_AUTHORITY,
  TOKEN_MINT_KEY,
  USER_KEY,
  VAULT_KEY,
} from "./lib/constants";
import { StakeForFee } from "./stake";
import { createStakeFeeProgram } from "./stake/helpers";
import { StakeForFee as StakeForFeeProgram } from "./stake/idls/stake_for_fee";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAddressLookupTable, getLiquidStakingPoolAddress } from "./lib/pda";
import { Vememe } from "../target/types/vememe";

dotenv.config();

const payer = Keypair.fromSecretKey(
  bs58.decode(process.env.NEXT_PUBLIC_HELIUS_KEY!)
);

const connection = new Connection(
  process.env.NEXT_PUBLIC_HELIUS!,
);
const POOL = new PublicKey("79raiHK7DDEGYAQ5dCgKd55GtoxaytvdDZKLEbCM3gRy");

const wallet = new Wallet(payer);

async function copy_data(accounts: PublicKey[]) {
  const data = [];
  const toCopy = [
    wallet.publicKey,
    ...accounts,
    USER_KEY,
    VAULT_KEY,
    TOKEN_MINT_KEY,
    "GndzrVMimNnhR8p4Ks467GNK4LHbUU3ngcByeDZhbiBd",
    "AVv55xWuBrDMAnB2hLVVgQWwMaX2SGb3tzjzJYRtTi7k",
    "GVC9dPTPC4DJWg5noEAQRM6cB4RMrWVH51WCbmmhcrhw",
    "BWr9KG6NjzEQL2jS4qg4t4W8ie1YyVKimkA15kdQyS9b",
    "Hsg2hR4gUQ2NHQn6PPcqiDWPGwZiChrqCPDeLTz3UVSN",
    "79raiHK7DDEGYAQ5dCgKd55GtoxaytvdDZKLEbCM3gRy",
    "7rAcrfXUPW92cV9aCqdBF64hW6oNgUwAbiPtxfUk4FKE",
    "BAFhKJ5c89AsV9fM1tUCsdEQu7RqkHyZsNe3rwL6JExQ",
    "3wNidmKLMwXEkuRyqKaZ2eGkMfFUf291uTPgHjsLRG72",
    "g3hngjniEwXwiFjWFjJeamyrX8GB4qtktr3SfhuCeUp",
    "HZeLxbZ9uHtSpwZC3LBr4Nubd14iHwz7bRSghRZf5VCG",
    "GtiQT21N57RJa7jxLYknSwcCaQEbW2JAMJPEFaMRH3hb",
    "FERjPVNEa7Udq8CEv68h6tPL46Tq7ieE49HrE2wea3XT",
    "A11MfejF4NvMZmMCFKpGY2X1aw7xg4mEYH864tPBTByu",
    "GCGqjr7sU6mkkKZm21mJjHLnViCVxSP8CTAJdDjP6Dv",
    "2JrjcGGUy7nNVeNsM7wWUrNWGRmZBZTNpKwUd7FLPQFP",
    "97EL4sw3DWigmyEwXwddWeRnH3eZyiBJD4npPtPwP86x",
    "FZN7QZ8ZUUAxMPfxYEYkH3cXUASzH8EqA6B4tyCL8f1j",
    "5b4WFMuinigYEDxSmLJhZf5wBbxRhvFPDvNmhfaB2BbF",
  ];
  for (const key of toCopy) {
    const accountInfo = await connection.getAccountInfo(new PublicKey(key));
    if (accountInfo) {
      data.push({
        address: new PublicKey(key),
        info: accountInfo,
      });
    }
  }
  return data;
}

describe("test", () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let provider: BankrunProvider;
  let program: Program<Rememe>;
  let feeProgram: Program<StakeForFeeProgram>;
  let owner: Wallet;
  let stakeForFee: StakeForFee;
  let smallestStaker: PublicKey;
  beforeAll(async () => {
    owner = wallet;
    stakeForFee = await StakeForFee.create(connection, POOL);
    smallestStaker = stakeForFee.findSmallestStakeEscrowInFullBalanceList(
      owner.publicKey
    );
    context = await startAnchor(
      "./",
      [
        {
          name: "fees",
          programId: new PublicKey(
            "FEESngU3neckdwib9X3KWqdL7Mjmqk9XNp3uh5JbP4KP"
          ),
        },
        {
          name: "vaultprog",
          programId: new PublicKey(
            "24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi"
          ),
        },
        {
          name: "ammprog",
          programId: new PublicKey(
            "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"
          ),
        },
      ],
      await copy_data([smallestStaker])
    );
    client = context.banksClient;
    provider = new BankrunProvider(context);
    program = new Program<Rememe>(
      IDL,
      new PublicKey("EPATz1DqX8BKYevRbPoiMrW6py8Yu78dn9xxwbD5Jfa1"),
      provider
    );
    feeProgram = createStakeFeeProgram(
      provider.connection,
      new PublicKey("FEESngU3neckdwib9X3KWqdL7Mjmqk9XNp3uh5JbP4KP")
    );
  });

  it("Init test", async () => {
    const txInitConfig = await initialize_config(program, owner.payer);

    const txInitPool = await initialize_pool(
      program,
      owner.payer,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );

    const tx = new Transaction();
    tx.recentBlockhash = context.lastBlockhash;
    tx.add(txInitConfig, txInitPool);
    tx.sign(owner.payer);
    const txHash = await client.processTransaction(tx);
    const recentSlot = await client.getSlot();

    const ixLUT = await createAddressLookupTable(
      program,
      payer,
      TOKEN_MINT_KEY,
      recentSlot
    );
    const txLUT = new Transaction();
    txLUT.recentBlockhash = context.lastBlockhash;
    txLUT.add(...ixLUT);
    txLUT.sign(owner.payer);
    
    const txSig = await client.processTransaction(txLUT);
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
    const ixInitEscrow = await initialize_escrow(
      program,
      owner.payer,
      TOKEN_MINT_KEY,
      VAULT_KEY,
      stakeForFee
    );

    const txEscrow = new Transaction();
    txEscrow.recentBlockhash = context.lastBlockhash;
    txEscrow.add(ixInitEscrow);
    txEscrow.sign(owner.payer);

    const txHashEscrow = await client.processTransaction(txEscrow);

    const ixsStake = await stake(
      1000000000,
      program,
      owner.payer,
      stakeForFee,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );

    const txStake = new TransactionMessage({
      payerKey: owner.publicKey,
      recentBlockhash: context.lastBlockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixsStake,
      ],
    }).compileToV0Message([]);
    const transactionV0 = new VersionedTransaction(txStake);
    transactionV0.sign([payer]);
    const txHashStake = await client.processTransaction(transactionV0);

    // check escrow account
    const escrowKey = await getEscrowKey(program, VAULT_KEY);
    const escrowAccountData = await feeProgram.account.stakeEscrow.fetch(
      escrowKey
    );

    // console.log(escrowAccountData.stakeAmount.toNumber());

    const unstakeKeypair = Keypair.generate();
    const requestUnstakeKeypair = Keypair.generate();

    const ixUnstake = await requestUnstake(
      1000000000,
      program,
      owner.payer,
      stakeForFee,
      unstakeKeypair,
      requestUnstakeKeypair,
      TOKEN_MINT_KEY,
      VAULT_KEY
    );

    const txUnstake = new TransactionMessage({
      payerKey: owner.publicKey,
      recentBlockhash: context.lastBlockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixUnstake,
      ],
    }).compileToV0Message([]);

    const transactionV0Unstake = new VersionedTransaction(txUnstake);
    transactionV0Unstake.sign([
      owner.payer,
      unstakeKeypair,
      requestUnstakeKeypair,
    ]);
    const txHashUnstake = await client.processTransaction(transactionV0Unstake);

    const currentClock = await client.getClock();
    const newTimestamp = currentClock.unixTimestamp + BigInt(31241412412);

    context.setClock(
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        newTimestamp
      )
    );

    const ixWithdraw = await withdraw(
      program,
      owner.payer,
      stakeForFee,
      TOKEN_MINT_KEY,
      unstakeKeypair.publicKey,
      requestUnstakeKeypair.publicKey,
      VAULT_KEY
    );

    const txWithdraw = new TransactionMessage({
      payerKey: owner.publicKey,
      recentBlockhash: context.lastBlockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
        ...ixWithdraw,
      ],
    }).compileToV0Message([]);

    const transactionV0Withdraw = new VersionedTransaction(txWithdraw);
    transactionV0Withdraw.sign([owner.payer]);
    const txHashWithdraw = await client.processTransaction(
      transactionV0Withdraw
    );
    const liquidPool = await getLiquidStakingPoolAddress(
      program.programId,
      TOKEN_MINT_KEY
    );
    const liquidPoolData = await program.account.liquidStakingPool.fetch(
      liquidPool[0]
    );
    console.log(liquidPoolData);
    // console.log(liquidPoolData)
    // const txHash = await client.processTransaction(tx);
    //     const unstakeKeypair = Keypair.generate();
    //     const txUnstake = new Transaction();
    //     const unstakeIx = await stakeForFee.unstake(
    //       new BN(500000000000),
    //       unstakeKeypair.publicKey,
    //       owner.publicKey,
    //       context,
    //       connection
    //     );

    //     txUnstake.recentBlockhash = context.lastBlockhash;
    //     txUnstake.add(unstakeIx);
    //     txUnstake.sign(owner.payer, unstakeKeypair);
    //     const unstakeTxHash = await client.processTransaction(txUnstake);
    //     console.log("Your transaction signature", unstakeTxHash);
  });

  //   afterAll(async function () {
  //     console.log(
  //       "Tests finished! Keeping process alive. Press Ctrl+C to exit..."
  //     );

  //     await new Promise(() => {});
  //   });
});
