import { HardDrive } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function StatusBar() {
  return (
    <div className="flex items-center justify-between h-6 px-4 text-xs border-t border-gray-200 bg-gray-100">
      <div className="flex items-center">
        <span>13 items (3 folders, 10 files)</span>
      </div>

      <div className="flex items-center">
        <HardDrive className="h-3 w-3 mr-1" />
        <span>Free Space: 120.5 GB / 500 GB</span>
        <Progress value={24} className="w-24 h-2 ml-2" />
      </div>
    </div>
  )
}

