"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { FileList } from "@/components/file-list"
import { StatusBar } from "@/components/status-bar"
import { Toolbar } from "@/components/toolbar"
import { ExtractDialog } from "@/components/extract-dialog"
import { CompressDialog } from "@/components/compress-dialog"

export default function CompressionApp() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState<string>("C:/Users/User/Documents")
  const [isExtractDialogOpen, setIsExtractDialogOpen] = useState(false)
  const [isCompressDialogOpen, setIsCompressDialogOpen] = useState(false)
  const [currentArchive, setCurrentArchive] = useState<string | null>(null)

  const handleExtract = () => {
    setIsExtractDialogOpen(true)
  }

  const handleCompress = () => {
    setIsCompressDialogOpen(true)
  }

  const handleFileSelect = (filename: string) => {
    if (selectedFiles.includes(filename)) {
      setSelectedFiles(selectedFiles.filter((f) => f !== filename))
    } else {
      setSelectedFiles([...selectedFiles, filename])
    }
  }

  const handleOpenArchive = (filename: string) => {
    setCurrentArchive(filename)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 select-none">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPath={currentPath} setCurrentPath={setCurrentPath} />
        <div className="flex flex-col flex-1">
          <Toolbar
            onExtract={handleExtract}
            onCompress={handleCompress}
            selectedFiles={selectedFiles}
            currentArchive={currentArchive}
          />
          <FileList
            currentPath={currentPath}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onOpenArchive={handleOpenArchive}
          />
        </div>
      </div>
      <StatusBar />

      <ExtractDialog
        isOpen={isExtractDialogOpen}
        onClose={() => setIsExtractDialogOpen(false)}
        currentArchive={currentArchive}
      />

      <CompressDialog
        isOpen={isCompressDialogOpen}
        onClose={() => setIsCompressDialogOpen(false)}
        selectedFiles={selectedFiles}
      />
    </div>
  )
}

