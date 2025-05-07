"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Checkbox } from "./ui/checkbox"
import { compressionService } from "../services/compression-service"

interface ExtractDialogProps {
  isOpen: boolean
  onClose: () => void
  currentArchive: string | null
  config: {
    rustExecutablePath: string
    logLevel: string
  }
  extractToCurrentPath?: boolean
  currentPath?: string
  selectedFiles?: string[] // Add support for extracting specific files
}

export function ExtractDialog({
                                isOpen,
                                onClose,
                                currentArchive,
                                config,
                                extractToCurrentPath = false,
                                currentPath = "",
                                selectedFiles = [],
                              }: ExtractDialogProps) {
  const { t } = useTranslation()
  const [extractPath, setExtractPath] = useState(() => {
    return window.electron.fs.getUserHome()
  })
  const [extractOption, setExtractOption] = useState("current")
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [keepFolderStructure, setKeepFolderStructure] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [password, setPassword] = useState("")
  const [usePassword, setUsePassword] = useState(false)

  // Check if the archive is a format that supports passwords
  const isPasswordSupported =
      currentArchive && (currentArchive.toLowerCase().endsWith(".zip") || currentArchive.toLowerCase().endsWith(".7z"))

  // Set extract path to current path when dialog opens and extractToCurrentPath is true
  useEffect(() => {
    if (isOpen) {
      if (extractToCurrentPath && currentPath) {
        setExtractPath(currentPath)
        setExtractOption("current")
      } else {
        setExtractPath(window.electron.fs.getUserHome())
      }
    }
  }, [isOpen, extractToCurrentPath, currentPath])

  const handleBrowse = async () => {
    const selectedPath = await window.electron.dialog.openDirectory()
    if (selectedPath) {
      setExtractPath(selectedPath)
    }
  }

  const handleExtract = async () => {
    if (!currentArchive) return

    setIsProcessing(true)

    try {
      const finalExtractPath = extractPath

      // Build the command with selected files if any
      const command = {
        rustExecutablePath: config.rustExecutablePath,
        target: finalExtractPath,
        sources: [currentArchive],
        password: usePassword && isPasswordSupported ? password : undefined,
        debug: config.logLevel === "debug",
        unzip: true,
        volumeSize: undefined,
        format: undefined,
        method: undefined,
        selectedFiles: selectedFiles.length > 0 ? [selectedFiles.map(e => `'${e}'`).join(",")]: undefined,
      }

      await compressionService.executeCommand(command)
    } catch (error) {
      console.error("Extraction failed:", error)
    } finally {
      setIsProcessing(false)
      onClose()
    }
  }

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("extractArchive")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {currentArchive && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="archive" className="text-right">
                    {t("archive")}:
                  </Label>
                  <div className="col-span-3">
                    <Input id="archive" value={currentArchive} readOnly />
                  </div>
                </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">{t("extractOptions")}:</Label>
              <div className="col-span-3">
                <RadioGroup
                    value={extractOption}
                    onValueChange={setExtractOption}
                    className="space-y-2"
                    disabled={isProcessing}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id="option-current" />
                    <Label htmlFor="option-current">{t("extractToCurrentFolder")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="option-custom" />
                    <Label htmlFor="option-custom">{t("extractToSpecifiedPath")}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destination" className="text-right">
                {t("destination")}:
              </Label>
              <div className="col-span-3 flex">
                <Input
                    id="destination"
                    value={extractPath}
                    onChange={(e) => setExtractPath(e.target.value)}
                    className="flex-1"
                    disabled={isProcessing || extractOption === "current"}
                />
                <Button
                    variant="outline"
                    className="ml-2"
                    onClick={handleBrowse}
                    disabled={isProcessing || extractOption === "current"}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedFiles.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">{t("selectedFiles")}:</Label>
                  <div className="col-span-3">
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.length} {t("filesSelected")}
                    </div>
                    <div className="mt-1 max-h-20 overflow-y-auto text-sm border rounded p-2">
                      {selectedFiles.slice(0, 5).map((file, index) => (
                          <div key={index} className="truncate">
                            {file}
                          </div>
                      ))}
                      {selectedFiles.length > 5 && (
                          <div className="text-muted-foreground">{t("andMore", { count: selectedFiles.length - 5 })}</div>
                      )}
                    </div>
                  </div>
                </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">{t("options")}:</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="overwrite"
                      checked={overwriteExisting}
                      onCheckedChange={(checked) => setOverwriteExisting(!!checked)}
                      disabled={isProcessing}
                  />
                  <Label htmlFor="overwrite">{t("overwriteExistingFiles")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="keep-structure"
                      checked={keepFolderStructure}
                      onCheckedChange={(checked) => setKeepFolderStructure(!!checked)}
                      disabled={isProcessing}
                  />
                  <Label htmlFor="keep-structure">{t("keepFolderStructure")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="password-protect"
                      checked={usePassword}
                      onCheckedChange={(checked) => setUsePassword(!!checked)}
                      disabled={isProcessing || !isPasswordSupported}
                  />
                  <Label htmlFor="password-protect" className={!isPasswordSupported ? "text-muted-foreground" : ""}>
                    {t("passwordProtect")} {!isPasswordSupported && "(ZIP/7Z only)"}
                  </Label>
                </div>
                {usePassword && (
                    <div className="pl-6 pt-2">
                      <Input
                          type="password"
                          placeholder={t("enterPassword")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isProcessing}
                      />
                    </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              {t("cancel")}
            </Button>
            <Button onClick={handleExtract} disabled={isProcessing || !currentArchive || !config.rustExecutablePath}>
              {isProcessing ? t("processingFiles") : t("extract")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
