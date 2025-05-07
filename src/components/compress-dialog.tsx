"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Slider } from "./ui/slider"
import { Checkbox } from "./ui/checkbox"
import path from "path-browserify"
import { compressionService, Format, Method } from "../services/compression-service"

interface CompressDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedFiles: string[]
  config: {
    rustExecutablePath: string
    logLevel: string
  }
}

export function CompressDialog({ isOpen, onClose, selectedFiles, config }: CompressDialogProps) {
  const { t } = useTranslation()
  const [archiveName, setArchiveName] = useState("archive.zip")
  const [archiveType, setArchiveType] = useState<Format>(Format.Zip)
  const [compressionLevel, setCompressionLevel] = useState(5)
  const [savePath, setSavePath] = useState(() => {
    return window.electron.fs.getUserHome()
  })
  const [password, setPassword] = useState("")
  const [usePassword, setUsePassword] = useState(false)
  const [splitVolumes, setSplitVolumes] = useState(false)
  const [volumeSize, setVolumeSize] = useState(100)
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if password protection is available for the selected format
  const isPasswordAvailable = archiveType === Format.Zip || archiveType === Format.SevenZ

  // Update archive name extension when archive type changes
  const updateArchiveNameExtension = (newType: Format) => {
    // Get the current name without extension
    const nameWithoutExt = path.basename(archiveName, path.extname(archiveName))

    // Add the new extension based on the selected type
    let newExt = ".zip"
    switch (newType) {
      case Format.SevenZ:
        newExt = ".7z"
        break
      case Format.Gz:
        newExt = ".tar.gz"
        break
      case Format.Xz:
        newExt = ".tar.xz"
        break
    }

    setArchiveName(nameWithoutExt + newExt)
  }

  // Reset password if switching to a format that doesn't support it
  const handleArchiveTypeChange = (value: Format) => {
    setArchiveType(value)
    updateArchiveNameExtension(value)

    if (!isPasswordAvailable && usePassword) {
      setUsePassword(false)
      setPassword("")
    }
  }

  const handleBrowse = async () => {
    const selectedPath = await window.electron.dialog.openDirectory()
    if (selectedPath) {
      setSavePath(selectedPath)
    }
  }

  const getCompressionMethod = (): Method | undefined => {
    if (archiveType === Format.Zip) {
      if (compressionLevel <= 3) return Method.Deflate
      if (compressionLevel <= 6) return Method.Deflate64
      return Method.Bzip2
    }
    if (archiveType === Format.SevenZ) {
      if (compressionLevel <= 3) return Method.Deflate
      if (compressionLevel <= 6) return Method.Bzip2
      return Method.Zstd
    }
    return undefined
  }

  const handleCompress = async () => {
    setIsProcessing(true)

    try {
      const targetPath = path.join(savePath, archiveName)

      await compressionService.executeCommand({
        rustExecutablePath: config.rustExecutablePath,
        target: targetPath,
        sources: selectedFiles.map(e => `'${e}'`),
        format: archiveType,
        method: getCompressionMethod(),
        password: usePassword && isPasswordAvailable ? password : undefined,
        debug: config.logLevel === "debug",
        unzip: false,
        volumeSize: splitVolumes ? volumeSize : undefined,
      })
    } catch (error) {
      console.error("Compression failed:", error)
    } finally {
      setIsProcessing(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("createArchive")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="archive-name" className="text-right">
              {t("archiveName")}:
            </Label>
            <div className="col-span-3">
              <Input
                id="archive-name"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="archive-type" className="text-right">
              {t("archiveType")}:
            </Label>
            <div className="col-span-3">
              <Select
                value={archiveType}
                onValueChange={(v) => handleArchiveTypeChange(v as Format)}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectArchiveType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Format.Zip}>ZIP</SelectItem>
                  <SelectItem value={Format.SevenZ}>7Z</SelectItem>
                  <SelectItem value={Format.Gz}>GZ</SelectItem>
                  <SelectItem value={Format.Xz}>XZ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="save-path" className="text-right">
              {t("saveTo")}:
            </Label>
            <div className="col-span-3 flex">
              <Input
                id="save-path"
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
                className="flex-1"
                disabled={isProcessing}
              />
              <Button variant="outline" className="ml-2" onClick={handleBrowse} disabled={isProcessing}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="compression-level" className="text-right">
              {t("compression")}:
            </Label>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">{t("store")}</span>
                <Slider
                  id="compression-level"
                  min={0}
                  max={9}
                  step={1}
                  value={[compressionLevel]}
                  onValueChange={(value) => setCompressionLevel(value[0])}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <span className="text-sm">{t("maximum")}</span>
              </div>
              <div className="text-center text-sm text-muted-foreground mt-1">
                {t("level")} {compressionLevel}:{" "}
                {compressionLevel < 3 ? t("faster") : compressionLevel > 6 ? t("smaller") : t("balanced")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">{t("options")}:</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="password-protect"
                  checked={usePassword}
                  onCheckedChange={(checked) => setUsePassword(!!checked)}
                  disabled={isProcessing || !isPasswordAvailable}
                />
                <Label htmlFor="password-protect" className={!isPasswordAvailable ? "text-muted-foreground" : ""}>
                  {t("passwordProtect")} {!isPasswordAvailable && "(ZIP/7Z only)"}
                </Label>
              </div>
              {usePassword && (
                <div className="pl-6 pt-2">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="split-volumes"
                  checked={splitVolumes}
                  onCheckedChange={(checked) => setSplitVolumes(!!checked)}
                  disabled={isProcessing || (archiveType !== Format.Zip && archiveType !== Format.SevenZ)}
                />
                <Label
                  htmlFor="split-volumes"
                  className={archiveType !== Format.Zip && archiveType !== Format.SevenZ ? "text-muted-foreground" : ""}
                >
                  {t("splitIntoVolumes")}{" "}
                  {archiveType !== Format.Zip && archiveType !== Format.SevenZ && "(ZIP/7Z only)"}
                </Label>
              </div>
              {splitVolumes && (
                <div className="pl-6 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Volume size (MB):</span>
                    <Input
                      type="number"
                      min="1"
                      value={volumeSize.toString()}
                      onChange={(e) => setVolumeSize(Number.parseInt(e.target.value, 10) || 100)}
                      disabled={isProcessing}
                      className="w-20"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">{t("selectedFiles")}:</Label>
            <div className="col-span-3">
              <div className="text-sm text-muted-foreground">
                {selectedFiles.length} {t("filesSelected")}
              </div>
              <div className="mt-1 max-h-20 overflow-y-auto text-sm border rounded p-2">
                {selectedFiles.map((file, index) => (
                  <div key={index}>{file}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCompress}
            disabled={isProcessing || selectedFiles.length === 0 || !config.rustExecutablePath}
          >
            {isProcessing ? t("processingFiles") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

