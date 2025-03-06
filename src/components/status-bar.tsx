import { useTranslation } from "react-i18next"
import { HardDrive } from "lucide-react"
import { Progress } from "./ui/progress"

interface StatusBarProps {
  fileCount: number
}

export function StatusBar({ fileCount }: StatusBarProps) {
  const { t } = useTranslation()
  const freeSpace = "120.5 GB"
  const totalSpace = "500 GB"
  const percentUsed = 24

  const folderCount = 3
  const fileCount2 = fileCount - folderCount

  return (
    <div className="flex items-center justify-between h-6 px-4 text-xs border-t border-border bg-background">
      <div className="flex items-center">
        <span>{t("itemCount", { count: fileCount, folders: folderCount, files: fileCount2 })}</span>
      </div>

      <div className="flex items-center">
        <HardDrive className="h-3 w-3 mr-1" />
        <span>{t("freeSpace", { free: freeSpace, total: totalSpace })}</span>
        <Progress value={percentUsed} className="w-24 h-2 ml-2" />
      </div>
    </div>
  )
}

