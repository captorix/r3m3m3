import { ChevronDown, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RewardCard() {
  return (
    <div className="relative bg-black border border-amber-900/50 rounded-lg p-6 mb-6">
      <Button 
        variant="ghost" 
        size="icon"
        className="absolute right-2 top-2 text-gray-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <Link href="/m3m3" className="block">
        <div className="flex items-center gap-4 group">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OYoSeWss6LRmDydTY38rTuocXVStxl.png" 
            alt="M3M3" 
            className="h-16 w-16 rounded-full bg-amber-500" 
          />
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-2">TOTAL $M3M3 M3M3 REWARD</div>
            <div className="text-4xl font-bold text-white group-hover:text-amber-500 transition-colors">$1,019,397.00</div>
            <div className="flex items-center gap-4 mt-2">
              <Button variant="outline" className="bg-black text-white border-amber-700">
                M3M3...5F2K <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

