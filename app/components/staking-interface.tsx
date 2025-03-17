"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from 'lucide-react'

export function StakingInterface() {
  return (
    <div className="bg-black border border-amber-900/50 rounded-lg overflow-hidden">
      <div className="bg-red-900/20 p-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="text-red-400">Stake 69.7K M3M3 to start earning.</span>
      </div>
      
      <div className="p-6 grid grid-cols-2 gap-8">
        <div>
          <div className="text-gray-400 mb-2">Your Total Staked</div>
          <div className="text-3xl font-bold text-white">
            489.39 <span className="text-gray-400">M3M3</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            The more you stake, the more you earn
          </div>
          <Button variant="outline" className="mt-4 bg-black text-white border-amber-700">
            Unstake
          </Button>
        </div>
        
        <div>
          <div className="text-gray-400 mb-2">Unclaimed Earnings</div>
          <div className="text-3xl font-bold text-white">
            $0
          </div>
          <div className="text-sm mt-1">
            Earning <span className="text-red-400">$0/day</span>
          </div>
          <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
            Claim
          </Button>
        </div>
      </div>
      
      <Button className="w-full py-6 bg-amber-600 hover:bg-amber-700 text-white rounded-none">
        Stake more
      </Button>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-amber-900/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-400 rounded-full" />
            <span className="text-white">Completed Unstake</span>
            <span className="text-gray-400">154.54 M3M3</span>
          </div>
          <Button variant="link" className="text-amber-400 hover:text-amber-300">
            Withdraw
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-amber-900/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-400 rounded-full" />
            <span className="text-white">Completed Unstake</span>
            <span className="text-gray-400">378.18 M3M3</span>
          </div>
          <Button variant="link" className="text-amber-400 hover:text-amber-300">
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  )
}

