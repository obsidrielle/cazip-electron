"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import path from "path-browserify"

interface RenameDialogProps {
  isOpen: boolean
  onClose: () => void
  onRename: (oldPath: string, newName: string) => Promise<void>
  filePath: string
}

export function RenameDialog({ isOpen, onClose, onRename, filePath }: RenameDialogProps) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 在对话框打开时初始化新名称为当前文件名
  useEffect(() => {
    if (isOpen && filePath) {
      setNewName(path.basename(filePath))
    }
  }, [isOpen, filePath])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!newName.trim()) {
      setError(t("fileNameRequired"))
      return
    }
    
    try {
      setIsProcessing(true)
      await onRename(filePath, newName)
      setIsProcessing(false)
      onClose()
    } catch (err: any) {
      setIsProcessing(false)
      setError(err.message || t("errorRenamingFile"))
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("renameFile")}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t("fileName")}
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                placeholder={t("enterFileName")}
                autoFocus
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm px-4">
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? t("renaming") : t("rename")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 