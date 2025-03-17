"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { StakeModal } from "@/components/stake-modal";
import { ChevronDown, X, AlertTriangle, Check, Loader } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AccountInfo, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { useProgram, useStakeForFeeProgram } from "@/api/useProgram";
import {
  FEE_POOL,
  M3M3_MINT,
  REMEME_PROGRAM_ID,
  TOKENS,
  VAULT_KEY,
} from "@/lib/constants";
import { getTokenBalance, getUnstakeByUser } from "@/lib/helpers";
import { Pool, UnstakeRequest } from "@/lib/types";
import {
  cancelUnstake,
  requestUnstake,
  stake,
  withdraw,
} from "@/lib/instructions";
import { StakeForFee } from "@/lib/stake";
import { manualSendTransactionV0 } from "@/lib/connection";
import { bnToNumberWithDecimals, bnToStringWithDecimals } from "@/lib/utils";
import { StakeEscrow } from "@/lib/stake/types";
import { UnstakeModal } from "@/components/unstake-modal";
import { Bounce, ToastContainer, toast } from "react-toastify";
import { getLiquidStakingPoolAddress } from "@/lib/pda";
import { UnstakeRequests } from "@/components/unstake-requests";
import { BN } from "bn.js";
import { FAQ } from "@/components/faq";

export default function M3M3Page() {
  const { publicKey, wallet, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [m3m3Balance, setM3M3Balance] = useState(0);
  const [tokenRestakedBalance, setTokenRestakedBalance] = useState(0);
  const [poolEscrow, setPoolEscrow] = useState<StakeEscrow | undefined>(
    undefined
  );
  const [pool, setPool] = useState<Pool | undefined>(undefined);
  const [restakedAmount, setRestakedAmount] = useState<number>(0);
  const [stakeForFee, setStakeForFee] = useState<StakeForFee | undefined>(
    undefined
  );
  const [unstakeRequests, setUnstakeRequests] = useState<UnstakeRequest[]>([]);
  const program = useProgram(connection);
  const stakeFeeProgram = useStakeForFeeProgram(connection);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [restakedPrice, setRestakedPrice] = useState<number>(0);
  const isDataLoading = () => {
    return !pool || !poolEscrow || !stakeForFee || !program;
  };
  const stakeHandler = async (amount: number) => {
    if (
      wallet &&
      publicKey &&
      program &&
      stakeForFee &&
      pool &&
      !isDataLoading()
    ) {
      try {
        const ix = await stake(
          amount * 10 ** TOKENS.M3M3.decimals,
          program,
          publicKey,
          stakeForFee,
          M3M3_MINT,
          VAULT_KEY
        );
        const tx = await manualSendTransactionV0(
          ix,
          publicKey,
          connection,
          pool.lut,
          signTransaction
        );
        toast.success("Stake Success");
        setIsStakeModalOpen(false);
        updateStates();
      } catch (error) {
        toast.error(error?.toString());
      }
    } else {
      toast.error("Not ready");
    }
  };

  const unstakeHandler = async (amount: number) => {
    if (
      wallet &&
      publicKey &&
      program &&
      stakeForFee &&
      pool &&
      !isDataLoading()
    ) {
      const unstakeKeypair = Keypair.generate();
      const requestUnstakeKeypair = Keypair.generate();
      const ix = await requestUnstake(
        amount * 10 ** TOKENS.M3M3.decimals,
        program,
        publicKey,
        stakeForFee,
        unstakeKeypair,
        requestUnstakeKeypair,
        M3M3_MINT,
        VAULT_KEY
      );
      const tx = await manualSendTransactionV0(
        ix,
        publicKey,
        connection,
        pool.lut,
        signTransaction,
        [unstakeKeypair, requestUnstakeKeypair]
      );
      toast.success("Unstake request sent");
      setIsUnstakeModalOpen(false);
      updateStates();
    } else {
      toast.error("Not ready");
    }
  };

  const withdrawHandler = async (request: UnstakeRequest) => {
    if (wallet && publicKey && program && stakeForFee && pool) {
      const ix = await withdraw(
        program,
        publicKey,
        stakeForFee,
        M3M3_MINT,
        request.unstakeKey,
        request.unstakeRequest,
        VAULT_KEY
      );
      const tx = await manualSendTransactionV0(
        ix,
        publicKey,
        connection,
        pool.lut,
        signTransaction
      );
      toast.success("Withdraw request sent");
      updateStates();
    } else {
      toast.error("Not ready");
    }
  };

  const cancelHandler = async (request: UnstakeRequest) => {
    if (wallet && publicKey && program && stakeForFee && pool) {
      const ix = await cancelUnstake(
        program,
        publicKey,
        stakeForFee,
        request.unstakeKey,
        request.unstakeRequest,
        M3M3_MINT,
        VAULT_KEY
      );
      const tx = await manualSendTransactionV0(
        ix,
        publicKey,
        connection,
        pool.lut,
        signTransaction
      );
      toast.success("Cancel request sent");
      updateStates();
    } else {
      toast.error("Not ready");
    }
  };

  const updateStates = async () => {
    if (!publicKey || !program || !stakeFeeProgram) return;
    const newM3M3Balance = await getTokenBalance(
      connection,
      publicKey,
      TOKENS.M3M3.mint
    );
    const newRestakedBalance = await getTokenBalance(
      connection,
      publicKey,
      TOKENS.M3M3.restakedMint
    );
    setM3M3Balance(newM3M3Balance || 0);
    setTokenRestakedBalance(newRestakedBalance || 0);
    const [liquidStakingPool, _liquidPoolBump] =
      await getLiquidStakingPoolAddress(REMEME_PROGRAM_ID, TOKENS.M3M3.mint);
    const updatedPool = await program.account.liquidStakingPool.fetch(
      liquidStakingPool
    );
    const updatedEscrow = await stakeFeeProgram?.account.stakeEscrow.fetch(
      updatedPool?.escrow
    );
    setPoolEscrow(updatedEscrow);
    setPool(updatedPool);

    const poolTokenVaultData = await connection.getTokenAccountBalance(
      updatedPool?.tokenVaultAccount
    );
    const poolTokenVaultAmount = poolTokenVaultData?.value.uiAmount ?? 0;
    setRestakedAmount(
      bnToNumberWithDecimals(updatedEscrow?.stakeAmount) +
        +poolTokenVaultAmount -
        bnToNumberWithDecimals(updatedPool.protocolFeesToken)
    );
    setUnstakeRequests([]);
    const fetchUnstakeRequests = async () => {
      try {
        const unstakes = await getUnstakeByUser(program, publicKey);
        const unstakePromises = await Promise.all(
          unstakes.map(async (x) => {
            try {
              return {
                unstake: await stakeFeeProgram.account.unstake.fetch(
                  x.account.unstake
                ),
                unstakeRequest: x.publicKey,
                unstakeKey: x.account.unstake,
              };
            } catch (error) {
              return null;
            }
          })
        ).then((results) => results.filter((result) => result !== null));
        setUnstakeRequests(unstakePromises);
      } catch (error) {
        setUnstakeRequests([]);
      }
    };
    fetchUnstakeRequests();
  };

  useEffect(() => {
    setUnstakeRequests([]);
    if (!publicKey || !program || !stakeFeeProgram) return;
    const fetchUnstakeRequests = async () => {
      try {
        const unstakes = await getUnstakeByUser(program, publicKey);

        const unstakePromises = await Promise.all(
          unstakes.map(async (x) => {
            try {
              return {
                unstake: await stakeFeeProgram.account.unstake.fetch(
                  x.account.unstake
                ),
                unstakeRequest: x.publicKey,
                unstakeKey: x.account.unstake,
              };
            } catch (error) {
              return null;
            }
          })
        ).then((results) => results.filter((result) => result !== null));

        setUnstakeRequests(unstakePromises);
      } catch (error) {
        setUnstakeRequests([]);
      }
    };

    fetchUnstakeRequests();
  }, [publicKey]);

  useEffect(() => {
    if (!connection) return;
    StakeForFee.create(connection, FEE_POOL).then((x) => setStakeForFee(x));
  }, [connection]);

  useEffect(() => {
    if (!restakedAmount || !pool) return;
    const price = restakedAmount / bnToNumberWithDecimals(pool.liquidSupply);
    setRestakedPrice(price);
  }, [restakedAmount, pool]);

  useEffect(() => {
    async function fetchPool() {
      // const accountInfo = await connection.getAccountInfo(POOL_KEY);
      const [poolKey, _poolBump] = await getLiquidStakingPoolAddress(
        REMEME_PROGRAM_ID,
        TOKENS.M3M3.mint
      );
      const pool = await program?.account.liquidStakingPool.fetch(poolKey);
      if (!pool) return;
      const escrow = await stakeFeeProgram?.account.stakeEscrow.fetch(
        pool?.escrow
      );
      setPoolEscrow(escrow);
      const poolTokenVaultData = await connection.getTokenAccountBalance(
        pool?.tokenVaultAccount
      );
      const poolTokenVaultAmount = poolTokenVaultData?.value.uiAmount ?? 0;
      setRestakedAmount(
        bnToNumberWithDecimals(escrow?.stakeAmount) +
          +poolTokenVaultAmount -
          bnToNumberWithDecimals(pool.protocolFeesToken)
      );
      
      return pool;
    }
    if (program) {
      fetchPool().then((x) => setPool(x));
    }
  }, [program]);

  useEffect(() => {
    async function getBalance(mint: PublicKey) {
      if (!publicKey) return 0;
      const balance = await getTokenBalance(connection, publicKey, mint);
      if (balance) {
        return balance;
      }
      return 0;
    }
    if (publicKey) {
      getBalance(TOKENS.M3M3.mint).then((x) => setM3M3Balance(x));
      getBalance(TOKENS.M3M3.restakedMint).then((x) =>
        setTokenRestakedBalance(x)
      );
    } else {
      setM3M3Balance(0);
      setTokenRestakedBalance(0);
    }
  }, [publicKey]);

  return (
    <div
      className="min-h-screen bg-black pt-20"
      style={{
        backgroundImage:
          'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avcsv-dD8AK9Trxr6ZWWmGLiptQDLcsPxBbo.svg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Header />
      <main className="container mx-auto p-4 max-w-4xl relative">
        <div className="relative z-10">
          <div
            className="relative rounded-2xl p-8 mb-6 overflow-hidden"
            style={{
              background:
                "linear-gradient(to top, rgb(249, 115, 22), rgb(245, 158, 11))",
            }}
          >
            <div className="flex flex-col gap-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-4">
                    <img
                      src={TOKENS.M3M3.img.src}
                      alt="M3M3"
                      className="h-16 w-16 rounded-full bg-amber-500 border-2 border-black relative z-10"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold text-black tracking-tight">
                      M3M3 LIQUID STAKING POOL
                    </h1>
                    <div className="text-black/60 text-sm">
                      Stake any M3M3 amount to earn rewards. s3M3M3 is LST for
                      M3M3.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col">
                  <div className="text-black/60 text-sm mb-2">
                    Total <span className="text-black">M3M3</span> Staked
                  </div>
                  <div className="text-4xl font-bold text-black">
                    {bnToStringWithDecimals(
                      poolEscrow?.stakeAmount?.sub(
                        pool ? pool.protocolFeesToken : new BN(0)
                      )
                    )}
                  </div>
                  {/* <div className="text-black/60 text-sm mt-1">
                    ≈ $
                    {(
                      bnToNumberWithDecimals(poolEscrow?.stakeAmount) *
                      restakedPrice
                    ).toFixed(2)}
                  </div> */}
                </div>
                <div className="flex flex-col">
                  <div className="text-black/60 text-sm mb-2">
                    <span className="text-black">s3M3M3</span> supply
                  </div>
                  <div className="text-4xl font-bold text-black">
                    {bnToStringWithDecimals(pool?.liquidSupply)}
                  </div>
                  <div className="text-black/60 text-sm mt-1">
                    1 s3M3M3 ≈ {restakedPrice.toFixed(3)} M3M3
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-black/30 text-sm mb-2">APY</div>
                  <div className="text-4xl font-bold text-black/20">Soon..</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-b from-amber-950/30 to-black/30 border border-amber-700/20 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-8 mb-2">
            <div className="flex-1">
              <div className="text-gray-400 mb-2">
                Your <span className="text-amber-600">M3M3</span> balance
              </div>
              <div className="text-3xl font-bold text-white">
                {m3m3Balance.toFixed(1)}{" "}
                <span className="text-gray-400">M3M3</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                The more you stake, the more you earn
              </div>
              <Button
                variant="outline"
                className="mt-4 w-40 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-bold border-0 hover:bg-amber-600 transition-colors duration-300"
                onClick={() => {
                  if (!publicKey) {
                    toast.error("Please connect your wallet");
                    return;
                  }
                  setIsStakeModalOpen(true);
                }}
              >
                Stake
              </Button>
            </div>
            <div className="flex-1">
              <div className="text-gray-400 mb-2">
                Your <span className="text-amber-600">s3M3M3</span> balance
              </div>
              <div className="text-3xl font-bold text-white">
                {tokenRestakedBalance.toFixed(1)}{" "}
                <span className="text-gray-400">s3M3M3</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Restaked tokens earn additional rewards
              </div>
              <Button
                variant="outline"
                className="mt-4 w-40 rounded-xl text-amber-500 border-amber-700 hover:bg-amber-600 hover:text-white transition-colors duration-300 bg-transparent"
                onClick={() => {
                  if (!publicKey) {
                    toast.error("Please connect your wallet");
                    return;
                  }
                  setIsUnstakeModalOpen(true);
                }}
              >
                Unstake
              </Button>
            </div>
          </div>
        </div>
        <UnstakeRequests
          requests={unstakeRequests}
          onCancelRequest={cancelHandler}
          onWithdraw={withdrawHandler}
        />
        <FAQ />
      </main> 
      <StakeModal
        isOpen={isStakeModalOpen}
        onClose={() => {
          setIsStakeModalOpen(false);
        }}
        onStake={stakeHandler}
        maxAmount={m3m3Balance}
        restakedPrice={restakedPrice}
      />
      <UnstakeModal
        isOpen={isUnstakeModalOpen}
        onClose={() => setIsUnstakeModalOpen(false)}
        onUnstake={unstakeHandler}
        maxAmount={tokenRestakedBalance}
        restakedPrice={restakedPrice}
      />
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  );
}
