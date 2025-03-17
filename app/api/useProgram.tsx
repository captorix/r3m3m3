import { AnchorProvider, Program, Wallet, workspace } from '@coral-xyz/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'

import { Rememe, IDL } from '@/lib/IDL/rememe'
import { FEE_POOL, REMEME_PROGRAM_ID, STAKE_FOR_FEE_PROGRAM_ID } from '@/lib/constants'
import { createStakeFeeProgram } from '@/lib/stake/helpers'

export function useProgram(connection?: Connection) {
    const mock_key = Keypair.generate();
    const wallet = {
        publicKey: mock_key.publicKey,
        signTransaction: undefined,
        signAllTransactions: undefined
    };
    
    return useMemo(() => {
        if (!connection) return undefined
        // @ts-ignore
        const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())

        return new Program<Rememe>(IDL, REMEME_PROGRAM_ID, provider)
    }, [connection])
}

export function useStakeForFeeProgram(connection?: Connection) {
    return useMemo(() => {
        if (!connection) return undefined
        return createStakeFeeProgram(
            connection,
            new PublicKey(STAKE_FOR_FEE_PROGRAM_ID)
        );
    }, [connection])
}