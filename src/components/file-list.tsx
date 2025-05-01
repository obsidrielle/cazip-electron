"use client"

import type React from "react"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { File, FileArchive, FileText, FileImage, FileCode, Folder, ArrowUp, ChevronDown, ChevronUp } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Checkbox } from "./ui/checkbox"
import { ScrollArea } from "./ui/scroll-area"
import path from "path-browserify"

interface FileListProps {
  currentPath: string
  files: any[]
  selectedFiles: string[]
  onFileSelect: (filename: string, filePath: string) => void
  onOpenArchive: (filename: string) => void
  onNavigate: (path: string) => void
  searchTerm: string
  moveSelectedToTop: boolean
  showHiddenFiles: boolean
  onContextMenu?: (e: React.MouseEvent, item: any) => void
}

export function FileList({
                           currentPath,
                           files,
                           selectedFiles,
                           onFileSelect,
                           onOpenArchive,
                           onNavigate,
                           searchTerm,
                           moveSelectedToTop,
                           showHiddenFiles,
                           onContextMenu,
                         }: FileListProps) {
  const { t } = useTranslation()
  const [sortColumn, setSortColumn] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectAll, setSelectAll] = useState(false)

  const filteredFiles = files.filter((file) => {
    // Filter by search term
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter hidden files if needed
    const isHidden = file.name.startsWith(".")
    const showFile = showHiddenFiles || !isHidden

    return matchesSearch && showFile
  })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (moveSelectedToTop) {
      if (selectedFiles.includes(a.path) && !selectedFiles.includes(b.path)) return -1
      if (!selectedFiles.includes(a.path) && selectedFiles.includes(b.path)) return 1
    }

    if (a.type === "folder" && b.type !== "folder") return -1
    if (a.type !== "folder" && b.type === "folder") return 1

    if (sortColumn === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }

    if (sortColumn === "type") {
      return sortDirection === "asc" ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
    }

    if (sortColumn === "size") {
      return sortDirection === "asc" ? a.size.localeCompare(b.size) : b.size.localeCompare(a.size)
    }

    if (sortColumn === "modified") {
      return sortDirection === "asc" ? a.modified.localeCompare(b.modified) : b.modified.localeCompare(a.modified)
    }

    return 0
  })

  const getFileIcon = (type: string, name: string) => {
    if (type === "folder") {
      return <Folder className="h-4 w-4 text-yellow-500" />
    }

    const extension = name.split(".").pop()?.toLowerCase()

    if (extension === "zip" || extension === "rar" || extension === "7z" || extension === "tar" || extension === "gz") {
      return <FileArchive className="h-4 w-4 text-purple-500" />
    }

    if (
        extension === "doc" ||
        extension === "docx" ||
        extension === "pdf" ||
        extension === "txt" ||
        extension === "rtf"
    ) {
      return <FileText className="h-4 w-4 text-blue-500" />
    }

    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png" ||
        extension === "gif" ||
        extension === "bmp" ||
        extension === "svg"
    ) {
      return <FileImage className="h-4 w-4 text-green-500" />
    }

    if (
        extension === "js" ||
        extension === "ts" ||
        extension === "html" ||
        extension === "css" ||
        extension === "json" ||
        extension === "xml"
    ) {
      return <FileCode className="h-4 w-4 text-red-500" />
    }

    return <File className="h-4 w-4 text-gray-500" />
  }

  const handleDoubleClick = (file: any) => {
    if (file.type === "folder") {
      onNavigate(file.path)
      files = []
    } else {
      const extension = file.name.split(".").pop()?.toLowerCase()
      if (
          extension === "zip" ||
          extension === "rar" ||
          extension === "7z" ||
          extension === "tar" ||
          extension === "gz"
      ) {
        onOpenArchive(file.path)
      }
    }
  }

  const handleNavigateUp = () => {
    const parentPath = path.dirname(currentPath)
    if (parentPath !== currentPath) {
      onNavigate(parentPath)
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectAll(false)
      onFileSelect("", "") // This will trigger the parent component to clear selections
    } else {
      // Select all
      setSelectAll(true)
      sortedFiles.forEach((file) => {
        if (!selectedFiles.includes(file.path)) {
          onFileSelect(file.name, file.path)
        }
      })
    }
  }

  const handleRowContextMenu = (e: React.MouseEvent, file: any) => {
    if (onContextMenu) {
      onContextMenu(e, file)
    }
  }

  return (
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-muted">
          <button className="flex items-center text-sm text-primary" onClick={handleNavigateUp}>
            <ArrowUp className="h-4 w-4 mr-1" />
            {t("upToParentDirectory")}
          </button>
          <div className="ml-4 text-sm text-muted-foreground truncate">
            {t("currentPath")}: {currentPath}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-13.5rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    {t("name")}
                    {sortColumn === "name" &&
                        (sortDirection === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("type")}>
                  <div className="flex items-center">
                    {t("type")}
                    {sortColumn === "type" &&
                        (sortDirection === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("size")}>
                  <div className="flex items-center">
                    {t("size")}
                    {sortColumn === "size" &&
                        (sortDirection === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("modified")}>
                  <div className="flex items-center">
                    {t("modified")}
                    {sortColumn === "modified" &&
                        (sortDirection === "asc" ? (
                            <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFiles.map((file) => (
                  <TableRow
                      key={file.path}
                      className={`
                  ${selectedFiles.includes(file.path) ? "bg-accent" : ""}
                  ${file.name.startsWith(".") ? "text-muted-foreground" : ""}
                  hover:bg-accent-hover
                  cursor-pointer
                  transition-colors duration-200 ease-in-out
                `}
                      onClick={() => onFileSelect(file.name, file.path)}
                      onDoubleClick={() => handleDoubleClick(file)}
                      onContextMenu={(e) => handleRowContextMenu(e, file)}
                  >
                    <TableCell className="w-8">
                      <Checkbox
                          checked={selectedFiles.includes(file.path)}
                          onCheckedChange={() => onFileSelect(file.name, file.path)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getFileIcon(file.type, file.name)}
                        <span className="ml-2">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{file.modified}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
  )
}
