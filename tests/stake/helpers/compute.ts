import { getSimulationComputeUnits } from "@solana-developers/helpers";
import { ComputeBudgetProgram, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * Gets the estimated compute unit usage with a buffer.
 * @param connection A Solana connection object.
 * @param instructions The instructions of the transaction to simulate.
 * @param feePayer The public key of the fee payer.
 * @param buffer The buffer to add to the estimated compute unit usage. Max value is 1. Default value is 0.1 if not provided, and will be capped between 50k - 200k.
 * @returns The estimated compute unit usage with the buffer.
 */
export const getEstimatedComputeUnitUsageWithBuffer = async (
    connection: Connection,
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    buffer?: number
  ) => {
    if (!buffer) {
      buffer = 0.1;}
      // Avoid negative value
      buffer = Math.max(0, buffer);
      // Limit buffer to 1
      buffer = Math.min(1, buffer);
    
      const estimatedComputeUnitUsage = await getSimulationComputeUnits(
        connection,
        instructions,
        feePayer,
        []
      );
    
      const extraComputeUnitBuffer = estimatedComputeUnitUsage * buffer;
    
      return estimatedComputeUnitUsage + extraComputeUnitBuffer;
    };
    
    /**
     * Gets the estimated compute unit usage with a buffer and converts it to a SetComputeUnitLimit instruction.
     * If the estimated compute unit usage cannot be retrieved, returns a SetComputeUnitLimit instruction with the fallback unit.
     * @param connection A Solana connection object.
     * @param instructions The instructions of the transaction to simulate.
     * @param feePayer The public key of the fee payer.
     * @param buffer The buffer to add to the estimated compute unit usage. Max value is 1. Default value is 0.1 if not provided, and will be capped between 50k - 200k.
     * @returns A SetComputeUnitLimit instruction with the estimated compute unit usage.
     */
    export const getEstimatedComputeUnitIxWithBuffer = async (
      connection: Connection,
      instructions: TransactionInstruction[],
      feePayer: PublicKey,
      buffer?: number
    ) => {
      const units = await getEstimatedComputeUnitUsageWithBuffer(
        connection,
        instructions,
        feePayer,
        buffer
      ).catch((error) => {
        console.error("Error::getEstimatedComputeUnitUsageWithBuffer", error);
        return 400_000;
      });
    
      return ComputeBudgetProgram.setComputeUnitLimit({ units });
    };