"use client"

import { useState } from "react"
import { File, FileArchive, FileText, FileImage, FileCode, Folder, ArrowUp, ChevronDown, ChevronUp } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileListProps {
  currentPath: string
  selectedFiles: string[]
  onFileSelect: (filename: string) => void
  onOpenArchive: (filename: string) => void
}

export function FileList({ currentPath, selectedFiles, onFileSelect, onOpenArchive }: FileListProps) {
  const [sortColumn, setSortColumn] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Mock file data
  const files = [
    { name: "documents.zip", type: "archive", size: "1.2 MB", modified: "2023-10-15 14:30" },
    { name: "photos.rar", type: "archive", size: "4.5 MB", modified: "2023-10-14 09:15" },
    { name: "project.7z", type: "archive", size: "2.8 MB", modified: "2023-10-13 16:45" },
    { name: "report.docx", type: "document", size: "350 KB", modified: "2023-10-12 11:20" },
    { name: "presentation.pptx", type: "document", size: "1.8 MB", modified: "2023-10-11 13:10" },
    { name: "data.xlsx", type: "document", size: "420 KB", modified: "2023-10-10 15:30" },
    { name: "image.jpg", type: "image", size: "2.1 MB", modified: "2023-10-09 10:45" },
    { name: "logo.png", type: "image", size: "150 KB", modified: "2023-10-08 09:30" },
    { name: "script.js", type: "code", size: "12 KB", modified: "2023-10-07 14:20" },
    { name: "styles.css", type: "code", size: "8 KB", modified: "2023-10-06 16:15" },
    { name: "Documents", type: "folder", size: "", modified: "2023-10-05 11:30" },
    { name: "Pictures", type: "folder", size: "", modified: "2023-10-04 10:20" },
    { name: "Downloads", type: "folder", size: "", modified: "2023-10-03 09:15" },
  ]

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedFiles = [...files].sort((a, b) => {
    // Always put folders at the top
    if (a.type === "folder" && b.type !== "folder") return -1
    if (a.type !== "folder" && b.type === "folder") return 1

    // Sort by the selected column
    if (sortColumn === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }

    if (sortColumn === "type") {
      return sortDirection === "asc" ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
    }

    if (sortColumn === "size") {
      // Simple size comparison (in a real app, would need to parse the size properly)
      return sortDirection === "asc" ? a.size.localeCompare(b.size) : b.size.localeCompare(a.size)
    }

    if (sortColumn === "modified") {
      return sortDirection === "asc" ? a.modified.localeCompare(b.modified) : b.modified.localeCompare(a.modified)
    }

    return 0
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <Folder className="h-4 w-4 text-yellow-500" />
      case "archive":
        return <FileArchive className="h-4 w-4 text-purple-500" />
      case "document":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "image":
        return <FileImage className="h-4 w-4 text-green-500" />
      case "code":
        return <FileCode className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const handleDoubleClick = (file: (typeof files)[0]) => {
    if (file.type === "folder") {
      // Navigate to folder
    } else if (file.type === "archive") {
      onOpenArchive(file.name)
    }
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
        <button className="flex items-center text-sm text-blue-600">
          <ArrowUp className="h-4 w-4 mr-1" />
          Up to parent directory
        </button>
        <div className="ml-4 text-sm text-gray-600">Current path: {currentPath}</div>
      </div>

      <ScrollArea className="h-[calc(100vh-13.5rem)]">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead className="w-8">
                <Checkbox />
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("name")}>
                <div className="flex items-center">
                  Name
                  {sortColumn === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("type")}>
                <div className="flex items-center">
                  Type
                  {sortColumn === "type" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("size")}>
                <div className="flex items-center">
                  Size
                  {sortColumn === "size" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("modified")}>
                <div className="flex items-center">
                  Modified
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
                key={file.name}
                className={`${selectedFiles.includes(file.name) ? "bg-blue-50" : ""} hover:bg-gray-50 cursor-pointer`}
                onClick={() => onFileSelect(file.name)}
                onDoubleClick={() => handleDoubleClick(file)}
              >
                <TableCell className="w-8">
                  <Checkbox
                    checked={selectedFiles.includes(file.name)}
                    onCheckedChange={() => onFileSelect(file.name)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getFileIcon(file.type)}
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

