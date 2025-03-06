"use client"

import { useTranslation } from "react-i18next"
import { Minus, Square, X } from "lucide-react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export function AppHeader() {
  const { t } = useTranslation()

  const handleMinimize = () => {
    window.electron.window.minimize()
  }

  const handleMaximize = () => {
    window.electron.window.maximize()
  }

  const handleClose = () => {
    window.electron.window.close()
  }

  return (
    <div className="flex items-center justify-between h-10 px-2 bg-background border-b border-border select-none">
      <div className="flex items-center">
        <img src="/icon.png" alt="App Logo" className="w-6 h-6 mr-2" />
        <span className="font-medium text-sm">{t("appName")}</span>

        <div className="ml-4 flex items-center space-x-1">
          {[t("file"), t("edit"), t("view"), t("tools"), t("help")].map((item) => (
            <DropdownMenu key={item}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-2 text-sm">
                  {item}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>{item === t("file") ? t("newArchive") : `${item} ${t("option")} 1`}</DropdownMenuItem>
                <DropdownMenuItem>
                  {item === t("file") ? t("openArchive") : `${item} ${t("option")} 2`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{item === t("file") ? t("exit") : `${item} ${t("option")} 3`}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMinimize}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMaximize}>
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500 hover:text-white" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

