"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Separator } from "./ui/separator"
import { FolderOpen } from "lucide-react"

interface ConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  config: {
    logLevel: string
    logFilePath: string
    moveSelectedToTop: boolean
    rustExecutablePath: string
  }
  onSave: (config: {
    logLevel: string
    logFilePath: string
    moveSelectedToTop: boolean
    rustExecutablePath: string
  }) => void
}

export function ConfigDialog({ isOpen, onClose, config, onSave }: ConfigDialogProps) {
  const { t } = useTranslation()
  const [logLevel, setLogLevel] = useState(config.logLevel)
  const [logFilePath, setLogFilePath] = useState(config.logFilePath)
  const [moveSelectedToTop, setMoveSelectedToTop] = useState(config.moveSelectedToTop)
  const [rustExecutablePath, setRustExecutablePath] = useState(config.rustExecutablePath)

  // Update state when config changes
  useEffect(() => {
    setLogLevel(config.logLevel)
    setLogFilePath(config.logFilePath)
    setMoveSelectedToTop(config.moveSelectedToTop)
    setRustExecutablePath(config.rustExecutablePath)
  }, [config])

  const handleSave = () => {
    onSave({
      logLevel,
      logFilePath,
      moveSelectedToTop,
      rustExecutablePath,
    })
    onClose()
  }

  const handleSelectExecutable = async () => {
    const path = await window.electron.dialog.openFile({
      filters: [{ name: "Executables", extensions: ["exe", "*"] }],
    })
    if (path) setRustExecutablePath(path)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("configDialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground mb-4">{t("loggingSection")}</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logLevel" className="text-right">
                {t("logLevel")}
              </Label>
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("selectLogLevel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trace">Trace</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logFilePath" className="text-right">
                {t("logFilePath")}
              </Label>
              <Input
                id="logFilePath"
                value={logFilePath}
                onChange={(e) => setLogFilePath(e.target.value)}
                placeholder={t("logFilePathPlaceholder")}
                className="col-span-3"
              />
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground mb-4">{t("fileSection")}</h3>
            <div className="grid grid-cols-12 items-center gap-4">
              <Label htmlFor="moveSelectedToTop" className="col-span-4 text-right whitespace-nowrap">
                {t("moveSelectedToTop")}
              </Label>
              <div className="col-span-8 flex items-center">
                <Switch id="moveSelectedToTop" checked={moveSelectedToTop} onCheckedChange={setMoveSelectedToTop} />
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground mb-4">{t("backendSection")}</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rustExecutablePath" className="text-right">
                {t("rustExecutablePath")}
              </Label>
              <div className="col-span-3 flex">
                <Input
                  id="rustExecutablePath"
                  value={rustExecutablePath}
                  onChange={(e) => setRustExecutablePath(e.target.value)}
                  placeholder={t("rustExecutablePathPlaceholder")}
                  className="flex-1"
                />
                <Button variant="outline" className="ml-2" onClick={handleSelectExecutable}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

