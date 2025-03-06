"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface ConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  config: {
    logLevel: string
    logFilePath: string
  }
  onSave: (config: { logLevel: string; logFilePath: string }) => void
}

export function ConfigDialog({ isOpen, onClose, config, onSave }: ConfigDialogProps) {
  const { t } = useTranslation()
  const [logLevel, setLogLevel] = useState(config.logLevel)
  const [logFilePath, setLogFilePath] = useState(config.logFilePath)

  const handleSave = () => {
    onSave({ logLevel, logFilePath })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("configDialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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

