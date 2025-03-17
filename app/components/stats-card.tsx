import { LockIcon, TrendingUpIcon, Wallet2Icon, BarChart3Icon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: 'lock' | 'revenue' | 'treasury' | 'emissions'
}

function StatCard({ title, value, icon }: StatCardProps) {
  const icons = {
    lock: <LockIcon className="w-8 h-8 text-amber-700" />,
    revenue: <TrendingUpIcon className="w-8 h-8 text-amber-700" />,
    treasury: <Wallet2Icon className="w-8 h-8 text-amber-700" />,
    emissions: <BarChart3Icon className="w-8 h-8 text-amber-700" />
  }

  return (
    <div className="bg-gradient-to-br from-black to-amber-950/30 border-2 border-amber-700/30 rounded-xl p-6 hover:border-amber-600/50 transition-all duration-300 shadow-lg hover:shadow-amber-600/20">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          {icons[icon]}
          <h3 className="text-amber-600 font-semibold tracking-wide text-sm uppercase">{title}</h3>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-white mt-2">{value}</p>
      </div>
    </div>
  )
}

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="TOTAL VALUE LOCKED"
        value="$1,668.6m"
        icon="lock"
      />
      <StatCard
        title="PLATFORM REVENUE"
        value="$651.8m"
        icon="revenue"
      />
      <StatCard
        title="TREASURY"
        value="$58m"
        icon="treasury"
      />
    </div>
  )
}

