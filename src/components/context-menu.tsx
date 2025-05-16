"use client"

import { useTranslation } from "react-i18next"
import { FileArchive, FolderOpen, Copy, Scissors, FilePenLine, Trash, Eye } from "lucide-react"

interface ContextMenuProps {
    x: number
    y: number
    item: any
    onClose: () => void
    isArchive: boolean
    onExtractToCurrentPath: () => void
    onExtractToSpecifiedPath: () => void
    onCopy?: () => void
    onCut?: () => void
    onRename?: () => void
    onDelete?: () => void
    onPreview?: () => void
}

export function ContextMenu({
                                x,
                                y,
                                item,
                                onClose,
                                isArchive,
                                onExtractToCurrentPath,
                                onExtractToSpecifiedPath,
                                onCopy,
                                onCut,
                                onRename,
                                onDelete,
                                onPreview,
                            }: ContextMenuProps) {
    const { t } = useTranslation()

    // Adjust position if menu would go off screen
    const adjustedY = y + 200 > window.innerHeight ? window.innerHeight - 200 : y
    const adjustedX = x + 200 > window.innerWidth ? window.innerWidth - 200 : x

    // 检查是否为文件夹
    const isFolder = item && item.type === "folder"

    return (
        <div
            className="fixed z-50 bg-background border border-border rounded-md shadow-md py-1 w-48"
            style={{ top: adjustedY, left: adjustedX }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* 非文件夹项目显示预览选项 */}
            {onPreview && !isFolder && (
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center"
                    onClick={onPreview}
                >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("preview")}
                </button>
            )}
            
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
            
            {/* 文件操作菜单项 */}
            {onCopy && (
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center"
                    onClick={onCopy}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    {t("copy")}
                </button>
            )}
            
            {onCut && (
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center"
                    onClick={onCut}
                >
                    <Scissors className="mr-2 h-4 w-4" />
                    {t("cut")}
                </button>
            )}
            
            {onRename && (
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center"
                    onClick={onRename}
                >
                    <FilePenLine className="mr-2 h-4 w-4" />
                    {t("rename")}
                </button>
            )}
            
            {onDelete && (
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center text-red-500"
                    onClick={onDelete}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    {t("delete")}
                </button>
            )}
            
            <div className="border-t border-border my-1"></div>
            <div className="px-3 py-2 text-sm text-muted-foreground">{item.name}</div>
        </div>
    )
}
