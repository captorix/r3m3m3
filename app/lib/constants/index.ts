import { PublicKey } from "@solana/web3.js";
import m3m3_img from "@/assets/m3m3.jpg";


export const FEE_POOL = new PublicKey(
  "79raiHK7DDEGYAQ5dCgKd55GtoxaytvdDZKLEbCM3gRy"
);
export const USER_KEY = new PublicKey(
  "7rAcrfXUPW92cV9aCqdBF64hW6oNgUwAbiPtxfUk4FKE"
);
export const VAULT_KEY = new PublicKey(
  "GndzrVMimNnhR8p4Ks467GNK4LHbUU3ngcByeDZhbiBd"
);
export const TOKEN_MINT_KEY = new PublicKey(
  "M3M3pSFptfpZYnWNUgAbyWzKKgPo5d1eWmX6tbiSF2K"
);
export const M3M3_MINT = new PublicKey(
  "M3M3pSFptfpZYnWNUgAbyWzKKgPo5d1eWmX6tbiSF2K"
);
export const STAKE_FOR_FEE_PROGRAM_ID = new PublicKey(
  "FEESngU3neckdwib9X3KWqdL7Mjmqk9XNp3uh5JbP4KP"
);

export const DYNAMIC_AMM_PROGRAM_ID = new PublicKey(
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"
);

export const DYNAMIC_VAULT_PROGRAM_ID = new PublicKey(
  "24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi"
);

export const EVENT_AUTHORITY = new PublicKey(
  "5b4WFMuinigYEDxSmLJhZf5wBbxRhvFPDvNmhfaB2BbF"
);
export const REMEME_PROGRAM_ID = new PublicKey(
  "S3F3SGMgKp95gyA9fTgARwo4vMWXA1qwFUU8pAa19pg"
);


export const TOKENS = {
  M3M3: {
    mint: M3M3_MINT,
    restakedMint: new PublicKey("F4KZtWNCVoBWNRJkX56iZv9uL2rGENCTGw84sXnnQ9Vw"),
    img: m3m3_img,
    decimals: 9,
  },
};
