import { BN } from "@coral-xyz/anchor";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function bnToStringWithDecimals(bn: BN | undefined, decimals: number = 9, round = 2): string {
  if (!bn) return "0";
  const num = bn.toNumber();
  const factor = Math.pow(10, decimals);
  const result = num / factor;
  return result.toFixed(round);
}

export function bnToNumberWithDecimals(bn: BN | undefined, decimals: number = 9, round = 2): number {
  if (!bn) return 0;
  const num = bn.toNumber();
  const factor = Math.pow(10, decimals);
  const result = num / factor;
  return result;
}

