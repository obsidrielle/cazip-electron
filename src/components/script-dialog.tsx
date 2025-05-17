"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Checkbox } from "./ui/checkbox"
import path from "path-browserify"
import { compressionService } from "../services/compression-service"

interface ScriptDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedFiles: string[]
  config: {
    rustExecutablePath: string
    logLevel: string
  }
}

export function ScriptDialog({ isOpen, onClose, selectedFiles, config }: ScriptDialogProps) {
  const { t } = useTranslation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [scriptPath, setScriptPath] = useState<string>("")
  const [virtualEnvPath, setVirtualEnvPath] = useState<string>("")
  const [isUnzipMode, setIsUnzipMode] = useState(false)
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScriptPath("")
      setVirtualEnvPath("")
      setIsUnzipMode(false)
    }
  }, [isOpen])

  const handleBrowseScriptFile = async () => {
    const filePath = await window.electron.dialog.openFile({
      filters: [{ name: "Python Files", extensions: ["py"] }]
    })
    if (filePath) {
      setScriptPath(filePath)
    }
  }

  const handleBrowseVirtualEnv = async () => {
    const dirPath = await window.electron.dialog.openDirectory()
    if (dirPath) {
      setVirtualEnvPath(dirPath)
    }
  }

  const handleExecuteScript = async () => {
    if (!scriptPath) {
      // 显示错误：脚本路径不能为空
      return
    }

    setIsProcessing(true)

    try {
      await compressionService.executeCommand({
        rustExecutablePath: config.rustExecutablePath,
        target: '', // 空字符串占位，API需要这个参数
        sources: selectedFiles, // 直接传递文件路径，不需要额外的引号
        debug: config.logLevel === "debug",
        unzip: isUnzipMode,
        useScript: true,
        scriptFile: scriptPath,
        virtualEnvDir: virtualEnvPath || undefined,
      })
    } catch (error) {
      console.error("Script execution failed:", error)
    } finally {
      setIsProcessing(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("executeScript")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="script" className="text-right">
              {t("scriptFile")}
            </Label>
            <div className="col-span-3 flex">
              <Input 
                id="script" 
                value={scriptPath} 
                onChange={(e) => setScriptPath(e.target.value)} 
                placeholder={t("selectPythonScript")}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleBrowseScriptFile}
                className="ml-2"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="virtualenv" className="text-right">
              {t("virtualEnv")}
            </Label>
            <div className="col-span-3 flex">
              <Input 
                id="virtualenv" 
                value={virtualEnvPath} 
                onChange={(e) => setVirtualEnvPath(e.target.value)} 
                placeholder={t("selectVirtualEnv")}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleBrowseVirtualEnv}
                className="ml-2"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-4 flex items-center space-x-2">
              <Checkbox 
                id="unzip" 
                checked={isUnzipMode} 
                onCheckedChange={(checked) => setIsUnzipMode(checked === true)}
              />
              <Label htmlFor="unzip">
                {t("unzipMode")}
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleExecuteScript} 
            disabled={!scriptPath || isProcessing}
          >
            {isProcessing ? t("processing") : t("execute")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 