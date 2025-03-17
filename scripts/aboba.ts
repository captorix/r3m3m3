import { Program, AnchorProvider, setProvider, Wallet } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from 'bs58';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import { Connection } from "@solana/web3.js"

import { IDL as ADRENA_IDL } from '../idl/adrena';

const programId = new PublicKey("13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet")
const connection = new Connection('http://127.0.0.1:8899', 'confirmed')
const payer = Keypair.fromSecretKey(Uint8Array.from([]))
// const payer = new Keypair()

const wallet = new Wallet(payer)
const provider = new AnchorProvider(connection, wallet, {});
setProvider(provider);


export const program = new Program(
  ADRENA_IDL,
  programId,
  provider
)
const main = async () => {
  const data = await program.account.cortex.fetch(new  PublicKey("Dhz8Ta79hgyUbaRcu7qHMnqMfY47kQHfHt2s42D9dC4e"))
  console.log(data)

  const restakedLpToken = await getOrCreateAssociatedTokenAccount(
    program.provider.connection,
    payer,
    new PublicKey("AuQaustGiaqxRvj2gtCdrd22PBzTn8kM3kEPEkZCtuDw"),
    new PublicKey("5AM3QQaut6mZs1GsBuaYDXMFHbXxoJBSZ8mpeByonZA3"),
  );
  const tx =await program.methods.resolveStakingRound(
  ).accounts({
      caller: new PublicKey("B9miqGKNSvNTuNVXscuccEEcKZHLJCajpwcoBzMVna9n"),
      payer: new PublicKey("B9miqGKNSvNTuNVXscuccEEcKZHLJCajpwcoBzMVna9n"),
      stakingStakedTokenVault: new PublicKey("9nD5AenzdbhRqWo7JufdNBbC4VjZ5QH7jzLuvPZy2rhb"),
      stakingRewardTokenVault: new PublicKey("A3UJxhPtieUr1mjgJhJaTPqDReDaB2H9q7hzs2icrUeS"),
      stakingLmRewardTokenVault: restakedLpToken.address,
      transferAuthority: new PublicKey("4o3qAErcapJ6gRLh1m1x4saoLLieWDu7Rx3wpwLc7Zk9"),
      staking: new PublicKey("5Feq2MKbimA44dqgFHLWr7h77xAqY9cet5zn9eMCj78p"),
      cortex: new PublicKey("Dhz8Ta79hgyUbaRcu7qHMnqMfY47kQHfHt2s42D9dC4e"),
      lmTokenMint: new PublicKey("AuQaustGiaqxRvj2gtCdrd22PBzTn8kM3kEPEkZCtuDw"),
      feeRedistributionMint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      adrenaProgram: new PublicKey("13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet"),
      systemProgram: new PublicKey("11111111111111111111111111111111"),
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    }
  ).rpc({skipPreflight: false});
  console.log(tx)
}

main()