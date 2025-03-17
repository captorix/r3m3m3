"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStake: (amount: number) => void;
  maxAmount: number;
  restakedPrice: number;
}

export function StakeModal({
  isOpen,
  onClose,
  onStake,
  maxAmount,
  restakedPrice
}: StakeModalProps) {
  const [percentage, setPercentage] = useState(100);
  const amount = (maxAmount * percentage) / 100;
  const receiveAmount = (amount / restakedPrice * 0.99).toFixed(2)
  const [isStaking, setIsStaking] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/95 border border-amber-900/20">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-amber-500">
            Stake
          </DialogTitle>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-auto p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-8">
            If you're in top 999 stakers, you'll start instantly earning
            rewards. Once you unstake, there's a 18 hours cooldown period.
          </p>
          <div className="bg-black/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-white">
                {percentage}%
              </span>
              <div className="flex items-center gap-2">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OYoSeWss6LRmDydTY38rTuocXVStxl.png"
                  alt="M3M3"
                  className="h-6 w-6 rounded-full bg-amber-500"
                />
                <span className="text-2xl font-bold text-gray-400">
                  {amount.toFixed(1)} M3M3
                </span>
              </div>
            </div>

            <Slider
              defaultValue={[100]}
              max={100}
              step={1}
              className="w-full"
              onValueChange={([value]) => setPercentage(value)}
              value={[percentage]}
            />
            <style jsx global>{`
              .w-full [data-orientation="horizontal"] {
                height: 6px;
                background-color: rgba(0, 0, 0, 0.5);
              }
              .w-full [data-orientation="horizontal"] > span {
                background-color: rgb(245, 158, 11);
              }
              .w-full [role="slider"] {
                background-color: rgb(245, 158, 11);
                border-color: rgb(245, 158, 11);
                width: 16px;
                height: 16px;
              }
            `}</style>
          </div>
          <div className="py-4 px-6 bg-gradient-to-r from-amber-900/30 to-black/30 rounded-lg mb-6 flex justify-between items-center">
            <span className="text-sm text-gray-400">Receive</span>
            <div className="text-xl font-bold text-amber-500 text-right">
              {receiveAmount} reM3M3
            </div>
          </div>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-6 text-lg"
            onClick={async () => {
              setIsStaking(true);
              try {
                await onStake(amount);
              } finally {
                setIsStaking(false);
              }
            }}
            disabled={isStaking}
          >
            {isStaking ? "Staking..." : "Stake"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
