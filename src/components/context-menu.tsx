"use client"

import { useTranslation } from "react-i18next"
import { FileArchive, FolderOpen } from "lucide-react"

interface ContextMenuProps {
    x: number
    y: number
    item: any
    onClose: () => void
    isArchive: boolean
    onExtractToCurrentPath: () => void
    onExtractToSpecifiedPath: () => void
}

export function ContextMenu({
                                x,
                                y,
                                item,
                                onClose,
                                isArchive,
                                onExtractToCurrentPath,
                                onExtractToSpecifiedPath,
                            }: ContextMenuProps) {
    const { t } = useTranslation()

    // Adjust position if menu would go off screen
    const adjustedY = y + 200 > window.innerHeight ? window.innerHeight - 200 : y
    const adjustedX = x + 200 > window.innerWidth ? window.innerWidth - 200 : x

    return (
        <div
            className="fixed z-50 bg-background border border-border rounded-md shadow-md py-1 w-48"
            style={{ top: adjustedY, left: adjustedX }}
            onClick={(e) => e.stopPropagation()}
        >
            {isArchive && (
                <>
                    <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center"
                        onClick={onExtractToCurrentPath}
                    >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {t("extractToCurrentDir")}
                    </button>
                    <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center"
                        onClick={onExtractToSpecifiedPath}
                    >
                        <FileArchive className="mr-2 h-4 w-4" />
                        {t("extractToSpecifiedDir")}
                    </button>
                    <div className="border-t border-border my-1"></div>
                </>
            )}
            <div className="px-3 py-2 text-sm text-muted-foreground">{item.name}</div>
        </div>
    )
}
