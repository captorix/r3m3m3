import { Button } from "@/components/ui/button";
import { Loader, Check } from "lucide-react";
import { Unstake } from "@/lib/stake/types";
import { bnToStringWithDecimals } from "@/lib/utils";
import { CountdownTimer } from "./countdown-timer";
import { UnstakeRequest } from "@/lib/types";
import { useState } from "react";

interface UnstakeRequestsProps {
  requests: UnstakeRequest[];
  onCancelRequest?: (request: UnstakeRequest) => void;
  onWithdraw?: (request: UnstakeRequest) => void;
}

export function UnstakeRequests({ requests, onCancelRequest, onWithdraw }: UnstakeRequestsProps) {
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  const COOLDOWN_PERIOD = 18 * 3600; // 18 hours in seconds

  return (
    <div className="bg-black/30 border border-amber-700/20 rounded-2xl p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Unstake Requests
      </h3>
      <div className="grid md:grid-cols-1 gap-4">
        {requests.map((request, index) => {
          const createdAtTimestamp = request.unstake.createdAt.toNumber();
          const endTime = createdAtTimestamp + COOLDOWN_PERIOD;
          const now = Math.floor(Date.now() / 1000);
          const isWithdrawable = now >= endTime;
          const isLoading = loadingRequestId === request.unstakeRequest.toBase58();

          return (
            <div
              className="flex items-center justify-between p-4 bg-black/10 rounded-2xl border border-amber-900/20"
              key={index}
            >
              <div className="flex items-center gap-2">
                {isWithdrawable ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-white">
                  {isWithdrawable ? "Ready to withdraw" : "Unstake Request"}
                </span>
                <span className="text-gray-400">
                  {bnToStringWithDecimals(request.unstake.unstakeAmount)} M3M3
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isWithdrawable && (
                  <span className="text-amber-500 text-sm">
                    Cooldown period:{" "}
                    <CountdownTimer endTime={endTime} />
                  </span>
                )}
                {isWithdrawable ? (
                  <Button
                    variant="link"
                    className="text-green-400 hover:text-green-300"
                    disabled={isLoading}
                    onClick={async () => {
                      setLoadingRequestId(request.unstakeRequest.toBase58());
                      try {
                        await onWithdraw?.(request);
                      } finally {
                        setLoadingRequestId(null);
                      }
                    }}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : "Withdraw"}
                  </Button>
                ) : (
                  <Button
                    variant="link"
                    className="text-amber-400 hover:text-amber-300"
                    disabled={isLoading}
                    onClick={async () => {
                      setLoadingRequestId(request.unstakeRequest.toBase58());
                      try {
                        await onCancelRequest?.(request);
                      } finally {
                        setLoadingRequestId(null);
                      }
                    }}
                  >
                    {isLoading ? (
                        "Processing..."
                    ) : "Cancel"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 