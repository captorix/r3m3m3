import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { toast } from "react-toastify";

export async function manualSendTransactionV0(
  instructions: TransactionInstruction[],
  user: PublicKey,
  connection: Connection,
  lookupTable: PublicKey,
  signTransaction: any,
  signers: Keypair[] = []
) {
  const lookupTableAccount = (
    await connection.getAddressLookupTable(lookupTable)
  ).value;
  if (!lookupTableAccount) {
    throw new Error("Lookup table account not found");
  }
  const txStakeMsg = new TransactionMessage({
    payerKey: user,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }),
      ...instructions,
    ],
  }).compileToV0Message([lookupTableAccount]);

  const versionedTxStake = new VersionedTransaction(txStakeMsg);
  const signedTransaction = await signTransaction(versionedTxStake);
  if (signers.length > 0) {
    signedTransaction.sign(signers);
  }
  console.log(signedTransaction)
  const txSigStake = await connection.sendTransaction(signedTransaction, {
    skipPreflight: true,
    preflightCommitment: "confirmed",
  });
  console.log(
    `sent raw, waiting : https://solscan.io/tx/${txSigStake}`
  );
  toast.info("Tx waiting for confirmation");
  await connection.confirmTransaction(txSigStake);

  return txSigStake
}

export async function manualSendTransaction(
  instructions: TransactionInstruction[],
  publicKey: PublicKey,
  connection: Connection,
  signTransaction: any
) {
  const transaction = new Transaction();
  transaction.add(...instructions);
  transaction.feePayer = publicKey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  const signedTransaction = await signTransaction(transaction);
  const rawTransaction = signedTransaction.serialize();

  let signature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: false,
  });

  console.log(
    `sent raw, waiting : https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
  );

  const confirm = async () =>
    await connection.confirmTransaction(signature, "confirmed");

  console.log(
    `sent tx!!! :https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
  );
}


