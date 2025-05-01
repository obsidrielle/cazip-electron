"use client"

import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"

interface AboutDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
    const { t } = useTranslation()

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">{t("aboutApp")}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center py-4 space-y-4">
                    <div className="h-24 flex items-center justify-center">
                        <img
                            src="/cazip.png"
                            alt="App Logo"
                            className="h-full w-auto object-contain"
                            style={{ maxWidth: "120px" }}
                        />
                    </div>
                    <h2 className="text-2xl font-bold">{t("appName")}</h2>
                    <p className="text-sm text-muted-foreground">{t("appVersion")}: 1.0.0</p>
                </div>

                <Separator className="my-2" />

                <div className="space-y-4 py-4">
                    <p>{t("aboutDescription")}</p>

                    <div className="space-y-2">
                        <h3 className="font-semibold">{t("features")}:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t("featureCompress")}</li>
                            <li>{t("featureExtract")}</li>
                            <li>{t("featureManage")}</li>
                            <li>{t("featureMultiFormat")}</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">{t("credits")}:</h3>
                        <p>{t("developedBy")}</p>
                        <p className="text-sm text-muted-foreground">© 2023-2024 {t("copyright")}</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>{t("close")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
