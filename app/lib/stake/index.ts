import { BN } from "@coral-xyz/anchor";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  MintLayout,
  RawAccount,
  RawMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AccountMeta,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  DYNAMIC_AMM_PROGRAM_ID,
  DYNAMIC_VAULT_PROGRAM_ID,
  STAKE_FOR_FEE_PROGRAM_ID,
  U64_MAX,
} from "./constants";
import {
  decodeFullBalanceState,
  decodeTopStakerListState,
} from "./helpers/decoder";
import { getLockedEscrowPendingFee } from "./helpers/dynamic_amm";
import {
  deriveFeeVault,
  deriveFullBalanceList,
  deriveLockEscrowPda,
  deriveLpMint,
  deriveStakeEscrow,
  deriveTopStakerList,
} from "./helpers/pda";
import {
  createDynamicAmmProgram,
  createDynamicVaultProgram,
  createStakeFeeProgram,
  getOrCreateATAInstruction,
  getOrCreateStakeEscrowInstruction,
} from "./helpers/program";
import {
  findLargestStakerNotInTopListFromFullBalanceList,
  findReplaceableTopStaker,
  getTopStakerListStateEntryStakeAmount,
} from "./helpers/staker_for_fee";
import {
  AccountStates,
  Clock,
  ClockLayout,
  DynamicAmmProgram,
  DynamicPool,
  DynamicVault,
  DynamicVaultProgram,
  FeeVault,
  FullBalanceListState,
  InitializeVaultParams,
  LockEscrow,
  StakeEscrow,
  StakeForFeeProgram,
  StakerMetadata,
  TopStakerListState,
} from "./types";

type Opt = {
  stakeForFeeProgramId?: PublicKey;
  dynamicAmmProgramId?: PublicKey;
  dynamicVaultProgramId?: PublicKey;
};

export class StakeForFee {
  constructor(
    public connection: Connection,
    public stakeForFeeProgram: StakeForFeeProgram,
    public dynamicAmmProgram: DynamicAmmProgram,
    public dynamicVaultProgram: DynamicVaultProgram,
    public feeVaultKey: PublicKey,
    public escrowVaultKey: PublicKey,
    public accountStates: AccountStates
  ) {}

  static async create(
    connection: Connection,
    pool: PublicKey,
    opt?: Opt
  ): Promise<StakeForFee> {
    const stakeForFeeProgram = createStakeFeeProgram(
      connection,
      opt?.stakeForFeeProgramId ?? STAKE_FOR_FEE_PROGRAM_ID
    );

    const dynamicVaultProgram = createDynamicVaultProgram(
      connection,
      opt?.dynamicVaultProgramId ?? DYNAMIC_VAULT_PROGRAM_ID
    );

    const dynamicAmmProgram = createDynamicAmmProgram(
      connection,
      opt?.dynamicAmmProgramId ?? DYNAMIC_AMM_PROGRAM_ID
    );

    const feeVaultKey = deriveFeeVault(pool, stakeForFeeProgram.programId);
    const fullBalanceListKey = deriveFullBalanceList(
      feeVaultKey,
      stakeForFeeProgram.programId
    );
    const topStakerListKey = deriveTopStakerList(
      feeVaultKey,
      stakeForFeeProgram.programId
    );

    const accountStates = await this.fetchAccountStates(
      connection,
      feeVaultKey,
      topStakerListKey,
      fullBalanceListKey,
      pool,
      opt
    );

    const [lockEscrowPK] = deriveLockEscrowPda(
      pool,
      feeVaultKey,
      dynamicAmmProgram.programId
    );
    const escrowVaultKey = getAssociatedTokenAddressSync(
      accountStates.ammPool.lpMint,
      lockEscrowPK,
      true
    );

    return new StakeForFee(
      connection,
      stakeForFeeProgram,
      dynamicAmmProgram,
      dynamicVaultProgram,
      feeVaultKey,
      escrowVaultKey,
      accountStates
    );
  }

  /**
   * Fetches all account states required for a given stake-for-fee pool
   *
   * @param connection The connection to the Solana cluster
   * @param feeVaultKey The public key of the fee vault
   * @param topStakerListKey The public key of the top staker list
   * @param fullBalanceListKey The public key of the full balance list
   * @param pool The public key of the pool
   * @param opt An optional object containing the IDs of the programs that
   *            manage the pool. If not provided, the default program IDs
   *            will be used.
   * @returns An object containing all the required account states
   */
  static async fetchAccountStates(
    connection: Connection,
    feeVaultKey: PublicKey,
    topStakerListKey: PublicKey,
    fullBalanceListKey: PublicKey,
    pool: PublicKey,
    opt?: Opt
  ): Promise<AccountStates> {
    const stakeForFeeProgram = createStakeFeeProgram(
      connection,
      opt?.stakeForFeeProgramId ?? STAKE_FOR_FEE_PROGRAM_ID
    );

    const dynamicVaultProgram = createDynamicVaultProgram(
      connection,
      opt?.dynamicVaultProgramId ?? DYNAMIC_VAULT_PROGRAM_ID
    );

    const dynamicAmmProgram = createDynamicAmmProgram(
      connection,
      opt?.dynamicAmmProgramId ?? DYNAMIC_AMM_PROGRAM_ID
    );

    const feeVaultAccount = await connection.getAccountInfo(feeVaultKey);
    const fullBalanceListAccount = await connection.getAccountInfo(
      fullBalanceListKey
    );
    
    const topStakerAccount = await connection.getAccountInfo(topStakerListKey);
    const poolAccount = await connection.getAccountInfo(pool);
    const clockAccount = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY);

    if (!fullBalanceListAccount || !feeVaultAccount || !topStakerAccount || !poolAccount || !clockAccount) {
      throw new Error("Full balance list account not found");
    }
    const feeVaultState: FeeVault = stakeForFeeProgram.coder.accounts.decode(
      "feeVault",
      feeVaultAccount.data
    );

    const fullBalanceListState: FullBalanceListState = decodeFullBalanceState(
      stakeForFeeProgram,
      fullBalanceListAccount 
    );

    const topStakerListState: TopStakerListState = decodeTopStakerListState(
      stakeForFeeProgram,
      feeVaultState,
      topStakerAccount
    );

    const poolState: DynamicPool = dynamicAmmProgram.coder.accounts.decode(
      "pool",
      poolAccount.data
    );

    const clockState: Clock = ClockLayout.decode(clockAccount.data);

    const aVaultAccount = await connection.getAccountInfo(poolState.aVault);
    const bVaultAccount = await connection.getAccountInfo(poolState.bVault);
    const lockEscrowAccount = await connection.getAccountInfo(
      feeVaultState.lockEscrow
    );
    const aVaultLpAccount = await connection.getAccountInfo(poolState.aVaultLp);
    const bVaultLpAccount = await connection.getAccountInfo(poolState.bVaultLp);
    const tokenAMintAccount = await connection.getAccountInfo(
      poolState.tokenAMint
    );
    const tokenBMintAccount = await connection.getAccountInfo(
      poolState.tokenBMint
    );
    const poolLpMintAccount = await connection.getAccountInfo(poolState.lpMint);
    if (!aVaultAccount || !bVaultAccount || !lockEscrowAccount || !aVaultLpAccount || !bVaultLpAccount || !tokenAMintAccount || !tokenBMintAccount || !poolLpMintAccount) {
      throw new Error("Vault account not found");
    }
    const aVaultState: DynamicVault = dynamicVaultProgram.coder.accounts.decode(
      "vault",
      aVaultAccount.data
    );

    const bVaultState: DynamicVault = dynamicVaultProgram.coder.accounts.decode(
      "vault",
      bVaultAccount.data
    );

    const lockEscrowState: LockEscrow = dynamicAmmProgram.coder.accounts.decode(
      "lockEscrow",
      lockEscrowAccount.data
    );

    const aVaultLpState: RawAccount = AccountLayout.decode(
      new Uint8Array(aVaultLpAccount.data)
    );

    const bVaultLpState: RawAccount = AccountLayout.decode(
      new Uint8Array(bVaultLpAccount.data)
    );

    const tokenAMintState: RawMint = MintLayout.decode(
      new Uint8Array(tokenAMintAccount.data)
    );

    const tokenBMintState: RawMint = MintLayout.decode(
      new Uint8Array(tokenBMintAccount.data)
    );

    const poolLpMintState: RawMint = MintLayout.decode(
      new Uint8Array(poolLpMintAccount.data)
    );

    const stakeMintState = feeVaultState.stakeMint.equals(poolState.tokenAMint)
      ? tokenAMintState
      : tokenBMintState;

    const escrowVaultKey = getAssociatedTokenAddressSync(
      poolState.lpMint,
      feeVaultKey,
      true
    );

    const aVaultLpMintAccount = await connection.getAccountInfo(
      aVaultState.lpMint
    );
    const bVaultLpMintAccount = await connection.getAccountInfo(
      bVaultState.lpMint
    );
    if (!aVaultLpMintAccount || !bVaultLpMintAccount) {
      throw new Error("Vault LP mint account not found");
    }
    const aVaultLpMintState: RawMint = MintLayout.decode(
      new Uint8Array(aVaultLpMintAccount.data)
    );

    const bVaultLpMintState: RawMint = MintLayout.decode(
      new Uint8Array(bVaultLpMintAccount.data)
    );

    let accountStates: AccountStates = {
      feeVault: feeVaultState,
      fullBalanceListState,
      topStakerListState,
      ammPool: poolState,
      aVault: aVaultState,
      bVault: bVaultState,
      aVaultLp: aVaultLpState,
      bVaultLp: bVaultLpState,
      lockEscrow: lockEscrowState,
      tokenAMint: tokenAMintState,
      tokenBMint: tokenBMintState,
      stakeMint: stakeMintState,
      aVaultLpMint: aVaultLpMintState,
      bVaultLpMint: bVaultLpMintState,
      clock: clockState,
      poolLpMint: poolLpMintState,
    };

    return accountStates;
  }

  findSmallestStakeEscrowInFullBalanceList(
    skipOwner: PublicKey
  ): PublicKey | null {
    if (this.accountStates.fullBalanceListState.stakers.length == 0) {
      return null;
    }

    const endIdx = this.accountStates.fullBalanceListState.stakers.length - 1;
    let smallestBalance = U64_MAX;
    let smallestOwner = null;

    for (let i = endIdx; i >= 0; i--) {
      const staker = this.accountStates.fullBalanceListState.stakers[i];
      if (staker.owner.equals(skipOwner)) {
        continue;
      }

      if (staker.balance.isZero()) {
        smallestOwner = staker.owner;
        break;
      }

      if (staker.balance.lt(smallestBalance)) {
        smallestOwner = staker.owner;
        smallestBalance = staker.balance;
      }
    }

    return smallestOwner
      ? deriveStakeEscrow(
          this.feeVaultKey,
          smallestOwner,
          this.stakeForFeeProgram.programId
        )
      : null;
  }

  findLargestStakerNotInTopListFromFullBalanceList(lookupNumber: number) {
    return findLargestStakerNotInTopListFromFullBalanceList(
      lookupNumber,
      this.accountStates.fullBalanceListState
    ).map((s) => {
      return deriveStakeEscrow(
        this.feeVaultKey,
        s.owner,
        this.stakeForFeeProgram.programId
      );
    });
  }

  findReplaceableTopStaker(lookupNumber: number) {
    return findReplaceableTopStaker(
      lookupNumber,
      this.accountStates.topStakerListState
    ).map((s) => {
      return deriveStakeEscrow(
        this.feeVaultKey,
        s.owner,
        this.stakeForFeeProgram.programId
      );
    });
  }

  /**
   * Withdraws the tokens from the given unstake key and sends them to the given owner.
   * @param unstakeKey The public key of the unstake account to withdraw from.
   * @param owner The public key of the account to send the withdrawn tokens to.
   * @returns A transaction that can be signed and sent to the network.
   */
  public async withdraw(
    unstakeKey: PublicKey,
    owner: PublicKey
  ): Promise<Transaction> {
    const stakeEscrowKey = deriveStakeEscrow(
      this.feeVaultKey,
      owner,
      this.stakeForFeeProgram.programId
    );

    const preInstructions = [];

    const { ataPubKey: userStakeToken, ix: initializeUserStakeTokenIx } =
      await getOrCreateATAInstruction(
        this.connection,
        this.accountStates.feeVault.stakeMint,
        owner
      );

    initializeUserStakeTokenIx &&
      preInstructions.push(initializeUserStakeTokenIx);

    const transaction = await this.stakeForFeeProgram.methods
      .withdraw()
      .accounts({
        unstake: unstakeKey,
        stakeEscrow: stakeEscrowKey,
        stakeTokenVault: this.accountStates.feeVault.stakeTokenVault,
        vault: this.feeVaultKey,
        userStakeToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        owner,
      })
      .preInstructions(preInstructions)
      .transaction();

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();

    return new Transaction({
      blockhash,
      lastValidBlockHeight,
      feePayer: owner,
    }).add(transaction);
  }


  /**
   * Refreshes the account states and returns the old states.
   *
   * @returns Old AccountStates object
   */
  public async refreshStates(): Promise<AccountStates> {
    const oldAccountStates = this.accountStates;
    this.accountStates = await StakeForFee.fetchAccountStates(
      this.connection,
      this.feeVaultKey,
      this.accountStates.feeVault.topStakerList,
      this.accountStates.feeVault.fullBalanceList,
      this.accountStates.feeVault.pool,
      {
        stakeForFeeProgramId: this.stakeForFeeProgram.programId,
        dynamicAmmProgramId: this.dynamicAmmProgram.programId,
        dynamicVaultProgramId: this.dynamicVaultProgram.programId,
      }
    );
    return oldAccountStates;
  }

  /** Start of helper functions */

  /**
   * Gets all staked info for the given owner.
   *
   * @param connection The connection to use.
   * @param owner The owner's pubkey.
   * @returns A promise that resolves with an array of stake escrows that match the given owner.
   */
  static async getAllStakedVaultByUser(
    connection: Connection,
    owner: PublicKey
  ) {
    const stakeForFeeProgram = createStakeFeeProgram(
      connection,
      STAKE_FOR_FEE_PROGRAM_ID
    );

    const [stakeEscrow, unstakeList] = await Promise.all([
      stakeForFeeProgram.account.stakeEscrow.all([
        { memcmp: { offset: 8, bytes: owner.toBase58() } },
      ]),
      stakeForFeeProgram.account.unstake.all([
        { memcmp: { offset: 8 + 32 + 8 * 3, bytes: owner.toBase58() } },
      ]),
    ]);
    const vaultsKey = stakeEscrow.map((stake) => stake.account.vault);
    const vaults = await stakeForFeeProgram.account.feeVault.fetchMultiple(
      vaultsKey
    );
    return stakeEscrow.map((stake, index) => {
      const vault = vaults[index];
      const unstake = unstakeList
        .filter(({ account }) => account.stakeEscrow.equals(stake.publicKey))
        .map(({ account }) => account);
      return { stake: stake.account, vault, unstake };
    });
  }

  /**
   * Gets all unstake records for the given stake escrow.
   *
   * @param connection The connection to use.
   * @param owner The owner's pubkey.
   * @returns A promise that resolves with an array of unstake records that match the given stake escrow.
   */
  static async getUnstakeByUser(
    connection: Connection,
    owner: PublicKey,
    feeVault: PublicKey
  ) {
    const stakeForFeeProgram = createStakeFeeProgram(
      connection,
      STAKE_FOR_FEE_PROGRAM_ID
    );

    const [{ publicKey: stakeEscrow }] =
      await stakeForFeeProgram.account.stakeEscrow.all([
        { memcmp: { offset: 8, bytes: owner.toBase58() } },
        { memcmp: { offset: 8 + 32, bytes: feeVault.toBase58() } },
      ]);

    return await stakeForFeeProgram.account.unstake.all([
      {
        memcmp: {
          offset: 8,
          bytes: stakeEscrow.toBase58(),
        },
      },
    ]);
  }

  /**
   * Gets all fee vault accounts for the given stake-for-fee program.
   * @param connection The connection to use.
   * @param programId The program id of the stake-for-fee program. Defaults to the idl program id.
   * @returns A promise that resolves with an array of fee vault accounts.
   */
  static async getAllFeeVault(connection: Connection, programId?: PublicKey) {
    const stakeForFeeProgram = createStakeFeeProgram(
      connection,
      programId ?? STAKE_FOR_FEE_PROGRAM_ID
    );

    return stakeForFeeProgram.account.feeVault.all();
  }

  /**
   * Calculates the minimum stake amount required to enter the top staker list.
   * @returns The minimum stake amount required to enter the top staker list.
   */
  public getTopStakerListEntryStakeAmount() {
    return getTopStakerListStateEntryStakeAmount(
      this.accountStates.topStakerListState
    );
  }

  /**
   * Calculates the total amount of fees that are pending to be claimed from the locked escrow for the farm.
   * @returns The total amount of fees that are pending to be claimed from the locked escrow for the farm.
   */
  public getFarmPendingClaimFees() {
    return getLockedEscrowPendingFee(
      this.accountStates.clock.unixTimestamp,
      this.accountStates.feeVault,
      this.accountStates.lockEscrow,
      this.accountStates.aVault,
      this.accountStates.bVault,
      this.accountStates.aVaultLp,
      this.accountStates.bVaultLp,
      this.accountStates.aVaultLpMint,
      this.accountStates.bVaultLpMint,
      this.accountStates.poolLpMint
    );
  }

  /**
   * Calculates the total amount of fees that have been released from the locked escrow to the top staker list for the farm.
   * @returns An array of two BNs. The first element is the total amount of token A fees that have been released. The second element is the total amount of token B fees that have been released.
   */
  public getFarmReleasedFees() {
    const [newFeeA, newFeeB] = this.getFarmPendingClaimFees();

    const newLockedFeeA =
      this.accountStates.feeVault.topStakerInfo.lockedFeeA.add(newFeeA);
    const newLockedFeeB =
      this.accountStates.feeVault.topStakerInfo.lockedFeeB.add(newFeeB);

    const currentTime = this.accountStates.clock.unixTimestamp;
    const secondsElapsed = currentTime.sub(
      this.accountStates.feeVault.topStakerInfo.lastUpdatedAt
    );

    const secondsToFullUnlock =
      this.accountStates.feeVault.configuration.secondsToFullUnlock;

    if (secondsElapsed.gte(secondsToFullUnlock)) {
      return [newLockedFeeA, newLockedFeeB];
    }

    const releasedFeeA = newLockedFeeA
      .mul(secondsElapsed)
      .div(secondsToFullUnlock);

    const releasedFeeB = newLockedFeeB
      .mul(secondsElapsed)
      .div(secondsToFullUnlock);

    return [releasedFeeA, releasedFeeB];
  }

  /**
   * The function `getUserStakeAndClaimBalance` calculates the stake amount and unclaimed fees for a
   * user in a staking program.
   * @param {PublicKey} user - The `getUserStakeAndClaimBalance` function calculates the stake amount
   * and unclaimed fees for a specific user. Here's a breakdown of the parameters used in the function:
   * @returns The function `getUserStakeAndClaimBalance` returns an object with two properties:
   * 1. `stakedAmount`: The amount of stake in the stake escrow account for the specified user.
   * 2. `unclaimFe`: An object containing two properties:
   *    - `feeA`: The total amount of fee A that can be claimed by the user, which includes both the
   * new fee A calculated
   *    - `feeB`: The total amount of fee B that can be claimed by the user, which includes both the
   * new fee B calculated
   */
  public async getUserStakeAndClaimBalance(user: PublicKey) {
    const stakeEscrowKey = deriveStakeEscrow(
      this.feeVaultKey,
      user,
      this.stakeForFeeProgram.programId
    );

    const stakeEscrow =
      await this.stakeForFeeProgram.account.stakeEscrow.fetchNullable(
        stakeEscrowKey
      );

    if (!stakeEscrow) {
      return {
        stakeEscrow: null,
        unclaimFee: {
          feeA: null,
          feeB: null,
        },
      };
    }

    if (!Boolean(stakeEscrow.inTopList)) {
      return {
        stakeEscrow,
        unclaimFee: {
          feeA: stakeEscrow.feeAPending,
          feeB: stakeEscrow.feeBPending,
        },
      };
    }

    const [releasedFeeA, releasedFeeB] = this.getFarmReleasedFees();

    const effectiveStakeAmount =
      this.accountStates.feeVault.topStakerInfo.effectiveStakeAmount;

    const newFeeAPerLiquidity =
      releasedFeeA.isNeg() || effectiveStakeAmount.isZero()
        ? new BN(0)
        : releasedFeeA.shln(64).div(effectiveStakeAmount);
    const newFeeBPerLiquidity =
      releasedFeeB.isNeg() || effectiveStakeAmount.isZero()
        ? new BN(0)
        : releasedFeeB.shln(64).div(effectiveStakeAmount);

    const newCumulativeFeeAPerLiquidity =
      this.accountStates.feeVault.topStakerInfo.cumulativeFeeAPerLiquidity.add(
        newFeeAPerLiquidity
      );
    const newCumulativeFeeBPerLiquidity =
      this.accountStates.feeVault.topStakerInfo.cumulativeFeeBPerLiquidity.add(
        newFeeBPerLiquidity
      );

    const newFeeA = newCumulativeFeeAPerLiquidity
      .sub(stakeEscrow.feeAPerLiquidityCheckpoint)
      .mul(stakeEscrow.stakeAmount)
      .shrn(64);

    const newFeeB = newCumulativeFeeBPerLiquidity
      .sub(stakeEscrow.feeBPerLiquidityCheckpoint)
      .mul(stakeEscrow.stakeAmount)
      .shrn(64);

    return {
      stakeEscrow,
      unclaimFee: {
        feeA: newFeeA.add(stakeEscrow.feeAPending),
        feeB: newFeeB.add(stakeEscrow.feeBPending),
      },
    };
  }

  /**
   * Calculates the total amount of fees that are pending to be claimed for the given stake escrow.
   * @param stakeEscrow The stake escrow to calculate the pending fees for.
   * @returns An array of two BNs. The first element is the total amount of token A fees that are pending to be claimed. The second element is the total amount of token B fees that are pending to be claimed.
   */
  public getStakeEscrowPendingFees(stakeEscrow: StakeEscrow) {
    const [releasedFeeA, releasedFeeB] = this.getFarmReleasedFees();

    const effectiveStakeAmount =
      this.accountStates.feeVault.topStakerInfo.effectiveStakeAmount;

    const newFeeAPerLiquidity = releasedFeeA.shln(64).div(effectiveStakeAmount);
    const newFeeBPerLiquidity = releasedFeeB.shln(64).div(effectiveStakeAmount);

    const newCumulativeFeeAPerLiquidity =
      this.accountStates.feeVault.topStakerInfo.cumulativeFeeAPerLiquidity.add(
        newFeeAPerLiquidity
      );
    const newCumulativeFeeBPerLiquidity =
      this.accountStates.feeVault.topStakerInfo.cumulativeFeeBPerLiquidity.add(
        newFeeBPerLiquidity
      );

    const newFeeA = newCumulativeFeeAPerLiquidity
      .sub(stakeEscrow.feeAPerLiquidityCheckpoint)
      .mul(stakeEscrow.stakeAmount)
      .shrn(64);

    const newFeeB = newCumulativeFeeBPerLiquidity
      .sub(stakeEscrow.feeBPerLiquidityCheckpoint)
      .mul(stakeEscrow.stakeAmount)
      .shrn(64);

    return [
      newFeeA.add(stakeEscrow.feeAPending),
      newFeeB.add(stakeEscrow.feeBPending),
    ];
  }
}
