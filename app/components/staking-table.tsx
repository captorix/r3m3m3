import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown } from 'lucide-react'

interface StakingRowProps {
  icon: string
  name: string
  status: string
  yourStake: string
  rewards: string
  totalStaked: string
  isUnstaked?: boolean
}
``
function StakingRow({ icon, name, status, yourStake, rewards, totalStaked, isUnstaked }: StakingRowProps) {
  return (
    <TableRow className="hover:bg-amber-950/20">
      <TableCell className="w-48">
        <div className="flex items-center gap-3">
          <img src={icon} alt={name} className="w-8 h-8 rounded-full" />
          <div>
            <div className="font-medium text-white">{name}</div>
            {isUnstaked && <div className="text-sm text-gray-400">Unstaked</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-red-400 text-center">{status}</TableCell>
      <TableCell className="text-right font-mono text-white">{yourStake}</TableCell>
      <TableCell className="text-right font-mono text-white">{rewards}</TableCell>
      <TableCell className="text-right font-mono text-white relative">
        {totalStaked}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20"></div>
      </TableCell>
    </TableRow>
  )
}

export function StakingTable() {
  return (
    <div className="border border-amber-600/50 rounded-xl overflow-hidden">
      <Table className="bg-transparent">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-amber-600/50">
            <TableHead className="text-gray-400">M3M3</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span>Your Stake</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span>Rewards</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span>Total Staked</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <StakingRow
            icon="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OYoSeWss6LRmDydTY38rTuocXVStxl.png"
            name="M3M3"
            status="Not earning"
            yourStake="489.39"
            rewards="$1,014,907.00"
            totalStaked="242,400,535.00"
            isUnstaked
          />
          <StakingRow
            icon="/placeholder.svg"
            name="LGTB"
            status="0"
            yourStake="0"
            rewards="$245,841.08"
            totalStaked="807,394,657.00"
          />
        </TableBody>
      </Table>
    </div>
  )
}

