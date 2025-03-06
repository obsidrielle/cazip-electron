"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ThemeProvider } from "next-themes"
import { AppHeader } from "./components/app-header"
import { Sidebar } from "./components/sidebar"
import { FileList } from "./components/file-list"
import { StatusBar } from "./components/status-bar"
import { Toolbar } from "./components/toolbar"
import { ExtractDialog } from "./components/extract-dialog"
import { CompressDialog } from "./components/compress-dialog"
import { Console } from "./components/console"
import { Tabs } from "./components/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog"
import { ConfigDialog } from "./components/config-dialog"
import { themes } from "@/lib/themes"

interface Tab {
  id: string
  title: string
  path: string
}

export default function App() {
  const { t } = useTranslation()
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState<string>("")
  const [isExtractDialogOpen, setIsExtractDialogOpen] = useState(false)
  const [isCompressDialogOpen, setIsCompressDialogOpen] = useState(false)
  const [currentArchive, setCurrentArchive] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [tabToClose, setTabToClose] = useState<string | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [config, setConfig] = useState({
    logLevel: "warn",
    logFilePath: "",
  })

  useEffect(() => {
    const userHome = window.electron.fs.getUserHome()
    setCurrentPath(userHome)
    const initialTab = { id: "1", title: t("home"), path: userHome }
    setTabs([initialTab])
    setActiveTab("1")
  }, [t])

  useEffect(() => {
    if (currentPath) {
      loadFiles(currentPath)
    }
  }, [currentPath])

  const loadFiles = async (path: string) => {
    try {
      const fileList = await window.electron.fs.readDirectory(path)
      setFiles(fileList)
    } catch (error) {
      console.error("Error loading files:", error)
    }
  }

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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const tab = tabs.find((t) => t.id === tabId)
    if (tab) {
      setCurrentPath(tab.path)
    }
  }

  const handleTabClose = (tabId: string) => {
    if (tabs.length > 1) {
      setTabToClose(tabId)
    }
  }

  const confirmTabClose = () => {
    if (tabToClose) {
      const newTabs = tabs.filter((t) => t.id !== tabToClose)
      setTabs(newTabs)
      if (activeTab === tabToClose) {
        setActiveTab(newTabs[0].id)
        setCurrentPath(newTabs[0].path)
      }
      setTabToClose(null)
    }
  }

  const handleNewTab = () => {
    const newTabId = String(tabs.length + 1)
    const newTab = { id: newTabId, title: t("newTab"), path: currentPath }
    setTabs([...tabs, newTab])
    setActiveTab(newTabId)
  }

  const handleOpenConfig = () => {
    setIsConfigOpen(true)
  }

  const handleSaveConfig = (newConfig: { logLevel: string; logFilePath: string }) => {
    setConfig(newConfig)
    // Here you would typically save the config to a file or database
    console.log("New config:", newConfig)
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      value={Object.keys(themes).reduce(
        (acc, theme) => ({
          ...acc,
          [theme]: theme,
        }),
        {},
      )}
    >
      <div className="flex flex-col h-screen bg-background text-foreground">
        <AppHeader />
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentPath={currentPath} setCurrentPath={setCurrentPath} />
          <div className="flex flex-col flex-1">
            <Toolbar
              onExtract={handleExtract}
              onCompress={handleCompress}
              selectedFiles={selectedFiles}
              currentArchive={currentArchive}
              onOpenConfig={handleOpenConfig}
            />
            <FileList
              currentPath={currentPath}
              files={files}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onOpenArchive={handleOpenArchive}
              onNavigate={setCurrentPath}
            />
          </div>
        </div>
        <StatusBar fileCount={files.length} />

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

        <ConfigDialog
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={config}
          onSave={handleSaveConfig}
        />

        <Console isOpen={isConsoleOpen} onToggle={() => setIsConsoleOpen(!isConsoleOpen)} />

        <AlertDialog open={tabToClose !== null} onOpenChange={() => setTabToClose(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("closeTabConfirmation")}</AlertDialogTitle>
              <AlertDialogDescription>{t("closeTabConfirmationDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmTabClose}>{t("confirm")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ThemeProvider>
  )
}

