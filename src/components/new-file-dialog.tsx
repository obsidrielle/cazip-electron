"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog"

interface NewFileDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreateFile: (fileName: string, overwrite: boolean) => Promise<{ success: boolean; error?: string }>
}

export function NewFileDialog({ isOpen, onClose, onCreateFile }: NewFileDialogProps) {
    const { t } = useTranslation()
    const [fileName, setFileName] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)

    const handleCreateFile = async (overwrite = false) => {
        if (!fileName.trim()) {
            setError(t("fileNameRequired"))
            return
        }

        setIsProcessing(true)
        setError(null)

        try {
            const result = await onCreateFile(fileName, overwrite)

            if (!result.success) {
                if (result.error === "File already exists" && !overwrite) {
                    setShowOverwriteConfirm(true)
                    setIsProcessing(false)
                    return
                }

                setError(result.error || t("errorCreatingFile"))
                setIsProcessing(false)
                return
            }

            // Success
            setFileName("")
            setIsProcessing(false)
            onClose()
        } catch (err) {
            setError(String(err) || t("errorCreatingFile"))
            setIsProcessing(false)
        }
    }

    const handleConfirmOverwrite = async () => {
        setShowOverwriteConfirm(false)
        await handleCreateFile(true)
    }

    const handleCancel = () => {
        setFileName("")
        setError(null)
        setIsProcessing(false)
        onClose()
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t("newFile")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fileName" className="text-right">
                                {t("fileName")}
                            </Label>
                            <Input
                                id="fileName"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="col-span-3"
                                placeholder={t("enterFileName")}
                                autoFocus
                                disabled={isProcessing}
                            />
                        </div>
                        {error && <div className="col-span-4 text-sm text-destructive">{error}</div>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
                            {t("cancel")}
                        </Button>
                        <Button onClick={() => handleCreateFile()} disabled={isProcessing || !fileName.trim()}>
                            {isProcessing ? t("creating") : t("create")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showOverwriteConfirm} onOpenChange={setShowOverwriteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("fileAlreadyExists")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("fileOverwriteConfirmation", { fileName })}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmOverwrite} className="bg-destructive text-destructive-foreground">
                            {t("overwrite")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
