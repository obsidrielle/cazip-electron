"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { commandService } from "../services/command-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    FileArchive,
    FileText,
    FileImage,
    FileCode,
    File,
    Folder,
    X,
    ArrowUp,
    ChevronUp,
    ChevronDown,
} from "lucide-react"

// 定义基本类型
interface ArchiveFile {
    name: string
    path: string
    size: number
    compressed_size: number | null
    modified_time: string
    is_directory: boolean
    permissions: string | null
}

interface ArchiveContents {
    format: string
    total_files: number
    total_size: number
    files: ArchiveFile[]
}

interface ArchiveViewerProps {
    archivePath: string
    onClose: () => void
    onExtract: (filePaths: string[]) => void
    config: {
        rustExecutablePath: string
    }
}

// 工具函数
const normalizePath = (path: string): string => {
    // 替换反斜杠为正斜杠
    let normalizedPath = path.replace(/\\/g, "/")

    // 处理根目录的各种表示
    if (normalizedPath === "." || normalizedPath === "./" || normalizedPath === "") {
        return "/"
    }

    return normalizedPath
}

const extractParentPath = (path: string): string => {
    // 如果是根目录，返回根目录
    if (path === "/" || path === "") {
        return "/"
    }

    // 去掉结尾的斜杠
    const trimmedPath = path.endsWith("/") ? path.slice(0, -1) : path

    // 找到最后一个斜杠的位置
    const lastSlashIndex = trimmedPath.lastIndexOf("/")

    // 如果没有斜杠，说明在根目录
    if (lastSlashIndex === -1) {
        return "/"
    }

    // 如果斜杠在开头，说明是根目录下的文件/文件夹
    if (lastSlashIndex === 0) {
        return "/"
    }

    // 返回父路径，确保以斜杠结尾
    return trimmedPath.substring(0, lastSlashIndex + 1)
}

const formatFileSize = (bytes: number | null): string => {
    if (bytes === null || bytes === 0) return "0 B"

    const units = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

export function ArchiveViewer({ archivePath, onClose, onExtract, config }: ArchiveViewerProps) {
    const { t } = useTranslation()
    const [archiveContents, setArchiveContents] = useState<ArchiveContents | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedFiles, setSelectedFiles] = useState<string[]>([])
    const [currentPath, setCurrentPath] = useState<string>("/")
    const [sortColumn, setSortColumn] = useState<string>("name")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; path: string }[]>([])

    // 加载压缩包内容
    useEffect(() => {
        loadArchiveContents()

        return () => {
            commandService.clearLogs()
        }
    }, [archivePath])

    // 更新面包屑导航
    useEffect(() => {
        updateBreadcrumbs()
    }, [currentPath])

    const loadArchiveContents = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // 清除之前的日志
            commandService.clearLogs()

            // 执行命令获取压缩包内容
            const command = `${config.rustExecutablePath} -l -u ${archivePath}`
            await commandService.executeCommand(command)

            // 获取日志并解析JSON
            const logs = commandService.getLogs()
            console.log("命令输出日志:", logs)

            let jsonData = null

            // 尝试解析JSON
            for (const log of logs) {
                if (log.includes("{") && log.includes("}")) {
                    try {
                        const jsonStart = log.indexOf("{")
                        const jsonEnd = log.lastIndexOf("}") + 1
                        const jsonString = log.substring(jsonStart, jsonEnd)
                        const parsedData = JSON.parse(jsonString)

                        if (parsedData && parsedData.files) {
                            jsonData = parsedData
                            break
                        }
                    } catch (e) {
                        console.log("JSON解析失败:", e)
                    }
                }
            }

            // 如果单行解析失败，尝试拼接所有日志
            if (!jsonData) {
                try {
                    const allLogs = logs.join("")
                    const jsonStart = allLogs.indexOf("{")
                    const jsonEnd = allLogs.lastIndexOf("}") + 1

                    if (jsonStart >= 0 && jsonEnd > jsonStart) {
                        const jsonString = allLogs.substring(jsonStart, jsonEnd)
                        jsonData = JSON.parse(jsonString)
                    }
                } catch (e) {
                    console.error("所有日志JSON解析失败:", e)
                }
            }

            if (jsonData && jsonData.files) {
                console.log("成功加载压缩包内容:", jsonData)

                // 预处理文件数据
                // 过滤掉不需要的文件（例如7z格式中的第一个文件可能是压缩包本身）
                const filteredFiles = jsonData.files.filter(file => {
                    // 过滤掉7z中的第一个元素（通常是压缩包本身）
                    return !(jsonData.format === "SevenZ" && file.path.includes("/home/"));

                })

                const processedFiles = filteredFiles.map((file: ArchiveFile) => {
                    // 规范化路径
                    let normalizedPath = normalizePath(file.path)

                    // 判断是否为目录
                    let isDirectory =
                        file.is_directory ||
                        normalizedPath.endsWith("/") ||
                        (file.permissions && file.permissions.startsWith("D")) || // 7z格式中的目录标识
                        (file.size === 0 && normalizedPath.split("/").filter(Boolean).length < normalizedPath.split("/").length - 1)

                    // 如果是目录但路径不以"/"结尾，添加"/"
                    if (isDirectory && !normalizedPath.endsWith("/")) {
                        normalizedPath = `${normalizedPath}/`
                    }

                    return {
                        ...file,
                        path: normalizedPath,
                        is_directory: isDirectory
                    }
                })

                // 更新压缩包内容
                setArchiveContents({
                    ...jsonData,
                    files: processedFiles
                })
            } else {
                setError("无法解析压缩包内容。请确保压缩包格式正确。")
                console.error("无法解析压缩包内容, 原始日志:", logs)
            }
        } catch (err) {
            console.error("加载压缩包内容出错:", err)
            setError(`加载压缩包内容出错: ${err}`)
        } finally {
            setIsLoading(false)
        }
    }

    const updateBreadcrumbs = () => {
        // 分割路径
        const pathParts = currentPath.split("/").filter(Boolean)
        const crumbs = [{ name: "Root", path: "/" }]

        let buildPath = ""
        for (const part of pathParts) {
            buildPath += `/${part}`
            crumbs.push({
                name: part,
                path: buildPath
            })
        }

        setBreadcrumbs(crumbs)
    }

    // 获取当前目录下的文件和文件夹
    const currentItems = useMemo(() => {
        if (!archiveContents?.files || archiveContents.files.length === 0) {
            return []
        }

        console.log("当前路径:", currentPath)

        // 收集所有直接子项
        const items = new Map<string, ArchiveFile>()

        // 遍历所有文件
        for (const file of archiveContents.files) {
            // 处理目录本身的特殊情况
            if (file.path === currentPath) {
                continue // 跳过当前目录本身
            }

            // 获取文件的父目录
            let parentPath = extractParentPath(file.path)

            // 规范化父路径
            parentPath = parentPath.endsWith("/") || parentPath === "/" ? parentPath : `${parentPath}/`

            // 检查是否在当前目录下
            if (parentPath === currentPath) {
                // 当前目录下的文件或文件夹，直接添加
                items.set(file.path, file)
            } else if (file.path.startsWith(currentPath) && file.path !== currentPath) {
                // 处理嵌套目录，例如：/dir1/dir2/file.txt
                // 如果当前路径是/dir1/，我们需要显示dir2作为一个文件夹
                const relativePath = file.path.substring(currentPath.length)
                const firstSegment = relativePath.split("/")[0]

                if (firstSegment) {
                    const subDirPath = `${currentPath}${firstSegment}/`

                    // 只有在map中还没有这个子目录时才添加
                    if (!items.has(subDirPath)) {
                        items.set(subDirPath, {
                            name: firstSegment,
                            path: subDirPath,
                            size: 0,
                            compressed_size: null,
                            modified_time: file.modified_time,
                            is_directory: true,
                            permissions: "D drwxr-xr-x" // 添加目录权限标识
                        })
                    }
                }
            }

            // 特殊处理7z中的目录
            if (archiveContents.format === "SevenZ" && file.is_directory) {
                // 将目录添加到当前显示列表
                if (file.path.startsWith(currentPath) || currentPath === "/") {
                    const dirName = file.name
                    const dirPath = `${dirName}/`

                    // 只添加直接子目录
                    if (currentPath === "/" || file.path.substring(currentPath.length).split("/").filter(Boolean).length === 1) {
                        items.set(dirPath, {
                            ...file,
                            path: dirPath,
                            is_directory: true
                        })
                    }
                }
            }
        }

        // 转换为数组并排序
        let result = Array.from(items.values())

        // 特殊处理：如果当前目录是包含中文的目录（如"屏幕截图"）或者是7z格式
        if (result.length === 0 && (currentPath.includes("屏幕截图") || archiveContents.format === "SevenZ")) {
            for (const file of archiveContents.files) {
                if (currentPath === "/") {
                    // 在根目录时，显示所有不包含"/"的路径（直接文件）和一级子目录
                    if (!file.path.includes("/") || (file.path.split("/").filter(Boolean).length === 1 && file.is_directory)) {
                        result.push(file)
                    }
                } else if (file.path.includes(`${currentPath.replace(/^\/|\/$/g, "")}/`) &&
                    !file.path.endsWith(currentPath) &&
                    file.name !== currentPath.replace(/^\/|\/$/g, "")) {
                    // 如果文件路径包含当前目录名（去掉开头和结尾的"/"）
                    result.push(file)
                } else if (file.is_directory && file.path === currentPath.replace(/\/$/, "")) {
                    // 当前目录本身是目录
                    continue
                }
            }

            // 检查是否有特殊的目录结构需要处理
            if (result.length === 0 && archiveContents.format === "SevenZ") {
                // 查找有没有目录与当前路径匹配
                const dirMatch = archiveContents.files.find(
                    file => file.is_directory &&
                        (file.path === currentPath ||
                            file.path === currentPath.replace(/\/$/, "") ||
                            file.name === currentPath.replace(/^\/|\/$/g, ""))
                )

                if (dirMatch) {
                    // 找到匹配的目录，尝试显示其子文件
                    for (const file of archiveContents.files) {
                        if (file.path.includes("/") &&
                            file.path.split("/")[0] === dirMatch.name &&
                            file.path !== dirMatch.path) {
                            result.push(file)
                        }
                    }
                }
            }
        }

        console.log("当前目录内容:", result)
        return result
    }, [archiveContents, currentPath])

    // 排序后的当前项目
    const sortedItems = useMemo(() => {
        if (currentItems.length === 0) return []

        return [...currentItems].sort((a, b) => {
            // 始终将目录放在前面
            if (a.is_directory && !b.is_directory) return -1
            if (!a.is_directory && b.is_directory) return 1

            // 根据选择的列排序
            if (sortColumn === "name") {
                return sortDirection === "asc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name)
            }

            if (sortColumn === "size") {
                return sortDirection === "asc"
                    ? (a.size || 0) - (b.size || 0)
                    : (b.size || 0) - (a.size || 0)
            }

            if (sortColumn === "modified") {
                return sortDirection === "asc"
                    ? a.modified_time.localeCompare(b.modified_time)
                    : b.modified_time.localeCompare(a.modified_time)
            }

            return 0
        })
    }, [currentItems, sortColumn, sortDirection])

    // 事件处理函数
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortColumn(column)
            setSortDirection("asc")
        }
    }

    const handleFileSelect = (filePath: string) => {
        if (selectedFiles.includes(filePath)) {
            setSelectedFiles(selectedFiles.filter(f => f !== filePath))
        } else {
            setSelectedFiles([...selectedFiles, filePath])
        }
    }

    const handleSelectAll = () => {
        if (selectedFiles.length === currentItems.length) {
            setSelectedFiles([])
        } else {
            setSelectedFiles(currentItems.map(file => file.path))
        }
    }

    const handleDoubleClick = (file: ArchiveFile) => {
        console.log("双击:", file)

        if (file.is_directory) {
            // 导航到目录
            setCurrentPath(file.path)
        }
    }

    const navigateUp = () => {
        if (currentPath === "/") return

        // 获取父路径
        const parentPath = extractParentPath(currentPath)
        setCurrentPath(parentPath)
    }

    const handleExtract = () => {
        if (selectedFiles.length > 0) {
            onExtract(selectedFiles)
        }
    }

    const getFileIcon = (file: ArchiveFile) => {
        if (file.is_directory) {
            return <Folder className="h-4 w-4 text-yellow-500" />
        }

        const extension = file.name.split(".").pop()?.toLowerCase()

        if (extension === "zip" || extension === "rar" || extension === "7z" || extension === "tar" || extension === "gz") {
            return <FileArchive className="h-4 w-4 text-purple-500" />
        }

        if (extension === "doc" || extension === "docx" || extension === "pdf" || extension === "txt" || extension === "rtf") {
            return <FileText className="h-4 w-4 text-blue-500" />
        }

        if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "gif" || extension === "bmp" || extension === "svg") {
            return <FileImage className="h-4 w-4 text-green-500" />
        }

        if (extension === "js" || extension === "ts" || extension === "html" || extension === "css" || extension === "json" || extension === "xml") {
            return <FileCode className="h-4 w-4 text-red-500" />
        }

        return <File className="h-4 w-4 text-gray-500" />
    }

    // 渲染UI
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>{t("loadingArchive")}</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-destructive">
                    <p>{error}</p>
                    <Button variant="outline" onClick={onClose} className="mt-4">
                        {t("close")}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* 头部 */}
            <div className="flex items-center justify-between p-2 bg-muted">
                <div className="flex items-center">
                    <FileArchive className="h-5 w-5 mr-2" />
                    <span className="font-medium">{archivePath.split("/").pop()}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                        ({archiveContents?.format} - {archiveContents?.total_files} {t("files")},{" "}
                        {formatFileSize(archiveContents?.total_size || 0)})
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* 导航栏 */}
            <div className="flex items-center p-2 bg-background border-y border-border">
                <Button variant="ghost" size="sm" onClick={navigateUp} disabled={currentPath === "/"}>
                    <ArrowUp className="h-4 w-4 mr-1" />
                    {t("up")}
                </Button>

                <div className="flex items-center ml-4 overflow-x-auto">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.path} className="flex items-center">
                            {index > 0 && <span className="mx-1 text-muted-foreground">/</span>}
                            <Button
                                variant="link"
                                className="h-6 px-1 text-sm"
                                onClick={() => setCurrentPath(crumb.path)}
                            >
                                {crumb.name}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="ml-auto">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleExtract}
                        disabled={selectedFiles.length === 0}
                    >
                        {t("extractSelected")}
                    </Button>
                </div>
            </div>

            {/* 文件列表 */}
            <ScrollArea className="flex-1">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead className="w-8">
                                <Checkbox
                                    checked={
                                        selectedFiles.length > 0 &&
                                        selectedFiles.length === currentItems.length
                                    }
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleSort("name")}
                            >
                                <div className="flex items-center">
                                    {t("name")}
                                    {sortColumn === "name" && (
                                        sortDirection === "asc"
                                            ? <ChevronUp className="ml-1 h-4 w-4" />
                                            : <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleSort("size")}
                            >
                                <div className="flex items-center">
                                    {t("size")}
                                    {sortColumn === "size" && (
                                        sortDirection === "asc"
                                            ? <ChevronUp className="ml-1 h-4 w-4" />
                                            : <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleSort("modified")}
                            >
                                <div className="flex items-center">
                                    {t("modified")}
                                    {sortColumn === "modified" && (
                                        sortDirection === "asc"
                                            ? <ChevronUp className="ml-1 h-4 w-4" />
                                            : <ChevronDown className="ml-1 h-4 w-4" />
                                    )}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedItems.length > 0 ? (
                            sortedItems.map((file) => (
                                <TableRow
                                    key={file.path}
                                    className={`
                                        ${selectedFiles.includes(file.path) ? "bg-accent" : ""}
                                        hover:bg-accent-hover
                                        cursor-pointer
                                        transition-colors duration-200 ease-in-out
                                    `}
                                    onClick={() => handleFileSelect(file.path)}
                                    onDoubleClick={() => handleDoubleClick(file)}
                                >
                                    <TableCell className="w-8">
                                        <Checkbox
                                            checked={selectedFiles.includes(file.path)}
                                            onCheckedChange={() => handleFileSelect(file.path)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            {getFileIcon(file)}
                                            <span className="ml-2">{file.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatFileSize(file.size)}</TableCell>
                                    <TableCell>{file.modified_time}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {t("noFilesInDirectory")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    )
}