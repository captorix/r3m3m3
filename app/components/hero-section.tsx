import { StatsGrid } from "./stats-card"
import { StakingTable } from "./staking-table"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-black to-amber-950/20 pb-12">
      <div className="container mx-auto p-4 max-w-4xl pt-8">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
            Boosted Staking
          </h1>
          <p className="text-lg text-gray-400 mb-16 max-w-2xl">
            Stake M3M3, Earn Enhanced Rewards on Priority Pools with industry-leading APY and exclusive benefits for long-term holders
          </p>

          <StatsGrid />
          
          <div className="mt-8">
            <StakingTable />
          </div>
        </div>
        
        {/* Enhanced decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-20">
          <div className="absolute inset-0 grid grid-cols-6 gap-2">
            {Array.from({ length: 36 }).map((_, i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-amber-500 rounded-sm transform rotate-45"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random(),
                  animation: `float ${2 + Math.random() * 4}s infinite ease-in-out`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

