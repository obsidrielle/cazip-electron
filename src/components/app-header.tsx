"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Minus, Square, X, Eye, EyeOff, FileText, Info } from "lucide-react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu"
import { AboutDialog } from "./about-dialog"

interface AppHeaderProps {
  onNewFile: () => void
  showHiddenFiles: boolean
  onToggleHiddenFiles: () => void
}

export function AppHeader({ onNewFile, showHiddenFiles, onToggleHiddenFiles }: AppHeaderProps) {
  const { t } = useTranslation()
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)

  const handleWindowControl = (action: "minimize" | "maximize" | "close") => {
    window.electron.windowControls(action)
  }

  return (
      <>
        <div
            className="flex items-center justify-between h-10 px-2 bg-background border-b border-border select-none"
            style={{ WebkitAppRegion: "drag" }}
        >
          <div className="flex items-center flex-1">
            <div className="h-6 mr-2 flex items-center">
              <img
                  src="/cazip.png"
                  alt="App Logo"
                  className="h-full w-auto object-contain"
                  style={{ maxWidth: "24px" }}
              />
            </div>
            <span className="font-medium text-sm">{t("appName")}</span>

            <div className="ml-4 flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 px-2 text-sm" style={{ WebkitAppRegion: "no-drag" }}>
                    {t("file")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={onNewFile}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t("newFile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{t("exit")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 px-2 text-sm" style={{ WebkitAppRegion: "no-drag" }}>
                    {t("edit")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem>{`${t("edit")} ${t("option")} 1`}</DropdownMenuItem>
                  <DropdownMenuItem>{`${t("edit")} ${t("option")} 2`}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{`${t("edit")} ${t("option")} 3`}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 px-2 text-sm" style={{ WebkitAppRegion: "no-drag" }}>
                    {t("view")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuCheckboxItem checked={showHiddenFiles} onCheckedChange={onToggleHiddenFiles}>
                    {showHiddenFiles ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {t("showHiddenFiles")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{`${t("view")} ${t("option")} 1`}</DropdownMenuItem>
                  <DropdownMenuItem>{`${t("view")} ${t("option")} 2`}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 px-2 text-sm" style={{ WebkitAppRegion: "no-drag" }}>
                    {t("tools")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem>{`${t("tools")} ${t("option")} 1`}</DropdownMenuItem>
                  <DropdownMenuItem>{`${t("tools")} ${t("option")} 2`}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{`${t("tools")} ${t("option")} 3`}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 px-2 text-sm" style={{ WebkitAppRegion: "no-drag" }}>
                    {t("help")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setIsAboutDialogOpen(true)}>
                    <Info className="mr-2 h-4 w-4" />
                    {t("about")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center space-x-1" style={{ WebkitAppRegion: "no-drag" }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleWindowControl("minimize")}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleWindowControl("maximize")}>
              <Square className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-500 hover:text-white"
                onClick={() => handleWindowControl("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AboutDialog isOpen={isAboutDialogOpen} onClose={() => setIsAboutDialogOpen(false)} />
      </>
  )
}
