"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
import { ArchiveViewer } from "./components/archive-viewer"
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
import { compressionService } from "./services/compression-service"
import path from "path-browserify"
import { NewFileDialog } from "./components/new-file-dialog"
import { RenameDialog } from "./components/rename-dialog"
import { commandService } from "./services/command-service"
import { ContextMenu } from "./components/context-menu"
import XTerminal from "@/src/components/console/Xterm";
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./components/ui/toast"
import { useToast } from "./components/ui/use-toast"
import { FilePreviewDialog } from "./components/file-preview-dialog"

interface Tab {
  id: string
  title: string
  path: string
  selectedFiles: string[]
}

interface AppConfig {
  logLevel: string
  logFilePath: string
  moveSelectedToTop: boolean
  rustExecutablePath: string
}

interface RecentArchive {
  name: string
  path: string
  timestamp: number
}

// Default configuration
const DEFAULT_CONFIG: AppConfig = {
  logLevel: "warn",
  logFilePath: "",
  moveSelectedToTop: false, // Default to false as requested
  rustExecutablePath: "",
}

const MAX_RECENT_ARCHIVES = 10

export default function App() {
  const { t, i18n } = useTranslation()
  const [currentPath, setCurrentPath] = useState<string>("")
  const [isExtractDialogOpen, setIsExtractDialogOpen] = useState(false)
  const [isCompressDialogOpen, setIsCompressDialogOpen] = useState(false)
  const [currentArchive, setCurrentArchive] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [isConsoleOpen, setIsConsoleOpen] = useState(true)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [tabToClose, setTabToClose] = useState<string | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [searchTerm, setSearchTerm] = useState("")
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [recentArchives, setRecentArchives] = useState<RecentArchive[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showHiddenFiles, setShowHiddenFiles] = useState(false)
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<string>("")
  const [clipboard, setClipboard] = useState<{
    files: string[],
    operation: "copy" | "cut" | null
  }>({ files: [], operation: null })
  const [contextMenuProps, setContextMenuProps] = useState<{
    show: boolean
    x: number
    y: number
    item: any
  }>({
    show: false,
    x: 0,
    y: 0,
    item: null,
  })
  const [extractToCurrentPath, setExtractToCurrentPath] = useState(false)
  const [isArchiveViewerOpen, setIsArchiveViewerOpen] = useState(false)
  const [archiveViewerPath, setArchiveViewerPath] = useState<string>("")
  const [selectedArchiveFiles, setSelectedArchiveFiles] = useState<string[]>([])
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [fileToPreview, setFileToPreview] = useState<string>("")

  // Get selected files from the active tab
  const getSelectedFiles = useCallback(() => {
    const currentTab = tabs.find((tab) => tab.id === activeTab)
    return currentTab ? currentTab.selectedFiles : []
  }, [tabs, activeTab])

  // Update selected files in the active tab
  const updateSelectedFiles = useCallback(
      (selectedFiles: string[]) => {
        setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === activeTab ? { ...tab, selectedFiles } : tab)))
      },
      [activeTab],
  )

  // Load configuration from localStorage on startup
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("compressionAppConfig")
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig))
      }

      const savedArchives = localStorage.getItem("recentArchives")
      if (savedArchives) {
        setRecentArchives(JSON.parse(savedArchives))
      }

      const savedShowHiddenFiles = localStorage.getItem("showHiddenFiles")
      if (savedShowHiddenFiles) {
        setShowHiddenFiles(JSON.parse(savedShowHiddenFiles))
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
    }
  }, [])

  // Set default language to Chinese
  useEffect(() => {
    i18n.changeLanguage("zh")
  }, [i18n])

  // Save showHiddenFiles to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("showHiddenFiles", JSON.stringify(showHiddenFiles))
    } catch (error) {
      console.error("Failed to save showHiddenFiles to localStorage:", error)
    }
  }, [showHiddenFiles])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  useEffect(() => {
    const userHome = window.electron.fs.getUserHome()
    setCurrentPath(userHome)
    const initialTab = { id: "1", title: t("home"), path: userHome, selectedFiles: [] }
    setTabs([initialTab])
    setActiveTab("1")
  }, [t])

  useEffect(() => {
    if (currentPath) {
      loadFiles(currentPath)
    }
  }, [currentPath, showHiddenFiles])

  const loadFiles = async (path: string) => {
    try {
      const fileList = await window.electron.fs.readDirectory(path)

      // Filter hidden files if needed
      const filteredFiles = showHiddenFiles ? fileList : fileList.filter((file) => !file.name.startsWith("."))

      setFiles(filteredFiles)
    } catch (error) {
      console.error("Error loading files:", error)
    }
  }

  const handleRefresh = useCallback(() => {
    if (currentPath) {
      loadFiles(currentPath)
    }
  }, [currentPath, showHiddenFiles])

  const handleDeselectAll = useCallback(() => {
    updateSelectedFiles([])
  }, [updateSelectedFiles])

  const handleDelete = useCallback(() => {
    const selectedFiles = getSelectedFiles()
    if (selectedFiles.length > 0) {
      setIsDeleteDialogOpen(true)
    }
  }, [getSelectedFiles])

  const confirmDelete = async () => {
    try {
      const selectedFiles = getSelectedFiles()
      for (const filePath of selectedFiles) {
        await window.electron.fs.deleteFile(filePath)
        addLog(`Deleted: ${filePath}`)
      }
      updateSelectedFiles([])
      handleRefresh()
    } catch (error) {
      console.error("Error deleting files:", error)
      addLog(`Error deleting files: ${error}`)
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const handleExtract = () => {
    setExtractToCurrentPath(false)
    setIsExtractDialogOpen(true)
  }

  const handleExtractToCurrentPath = (archivePath: string) => {
    setCurrentArchive(archivePath)
    setExtractToCurrentPath(true)
    setIsExtractDialogOpen(true)
  }

  const handleExtractToSpecifiedPath = (archivePath: string) => {
    setCurrentArchive(archivePath)
    setExtractToCurrentPath(false)
    setIsExtractDialogOpen(true)
  }

  const handleCompress = () => {
    setIsCompressDialogOpen(true)
  }

  const handleFileSelect = (filename: string, filePath: string) => {
    const selectedFiles = getSelectedFiles()
    if (selectedFiles.includes(filePath)) {
      updateSelectedFiles(selectedFiles.filter((f) => f !== filePath))
    } else {
      updateSelectedFiles([...selectedFiles, filePath])
    }
  }

  const addToRecentArchives = (archivePath: string) => {
    const archiveName = path.basename(archivePath)

    // Create new archive entry
    const newArchive: RecentArchive = {
      name: archiveName,
      path: archivePath,
      timestamp: Date.now(),
    }

    // Filter out any existing entry with the same path
    const filteredArchives = recentArchives.filter((a) => a.path !== archivePath)

    // Add new archive to the beginning of the list
    const updatedArchives = [newArchive, ...filteredArchives]

    // Limit to MAX_RECENT_ARCHIVES
    const limitedArchives = updatedArchives.slice(0, MAX_RECENT_ARCHIVES)

    // Update state and localStorage
    setRecentArchives(limitedArchives)
    try {
      localStorage.setItem("recentArchives", JSON.stringify(limitedArchives))
    } catch (error) {
      console.error("Failed to save recent archives to localStorage:", error)
    }
  }

  // 修改 handleOpenArchive 函数，确保每次打开压缩包前清理状态
  const handleOpenArchive = (filename: string) => {
    // 关闭之前可能打开的压缩包查看器
    if (isArchiveViewerOpen) {
      handleCloseArchiveViewer()
    }

    // 清除命令服务的日志
    commandService.clearLogs()

    // 设置当前压缩包和更新最近使用的压缩包列表
    setCurrentArchive(filename)
    addToRecentArchives(filename)

    // 打开压缩包查看器
    setArchiveViewerPath(filename)
    setIsArchiveViewerOpen(true)
  }

  // 修改 handleCloseArchiveViewer 函数，确保完全清理状态
  const handleCloseArchiveViewer = () => {
    setIsArchiveViewerOpen(false)
    setArchiveViewerPath("")
    setSelectedArchiveFiles([])

    // 清除命令服务的日志
    commandService.clearLogs()
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
    const newTab = { id: newTabId, title: t("newTab"), path: currentPath, selectedFiles: [] }
    setTabs([...tabs, newTab])
    setActiveTab(newTabId)
  }

  const handleOpenConfig = () => {
    setIsConfigOpen(true)
  }

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig)

    // Save to localStorage
    try {
      localStorage.setItem("compressionAppConfig", JSON.stringify(newConfig))
    } catch (error) {
      console.error("Failed to save config to localStorage:", error)
    }
  }

  const toggleShowHiddenFiles = () => {
    setShowHiddenFiles(!showHiddenFiles)
  }

  const handleNewFile = () => {
    setIsNewFileDialogOpen(true)
  }

  const handleCreateNewFile = async (fileName: string, overwrite: boolean) => {
    try {
      const filePath = path.join(currentPath, fileName)
      const fileExists = await window.electron.fs.fileExists(filePath)

      if (fileExists && !overwrite) {
        return { success: false, error: "File already exists" }
      }

      await window.electron.fs.createFile(filePath)
      addLog(`Created new file: ${filePath}`)
      handleRefresh()
      return { success: true }
    } catch (error) {
      console.error("Error creating file:", error)
      addLog(`Error creating file: ${error}`)
      return { success: false, error: String(error) }
    }
  }

  // Function to add a log to the console
  const addLog = useCallback((message: string) => {
    // Split the message by newlines to handle multiple log entries
    const logLines = message.split(/\r?\n/).filter((line) => line.trim() !== "")

    if (logLines.length > 0) {
      setConsoleLogs((prevLogs) => [
        ...prevLogs,
        ...logLines.map((line) => `${new Date().toLocaleTimeString()}: ${line}`),
      ])
    }
  }, [])

  // Clear console logs
  const clearLogs = useCallback(() => {
    setConsoleLogs([])
    commandService.clearLogs()
  }, [])

  // Set up the compression service log callback
  useEffect(() => {
    compressionService.setLogCallback(addLog)
    commandService.setLogCallback(addLog)
  }, [addLog])

  const executeCommand = async (command: string) => {
    try {
      await commandService.executeCommand(command)
    } catch (error) {
      console.error("Error executing command:", error)
      addLog(`Error executing command: ${error}`)
    }
  }

  // Refresh files after compression or extraction
  const handleCompressDialogClose = () => {
    setIsCompressDialogOpen(false)
    handleRefresh()
  }

  const handleExtractDialogClose = () => {
    setIsExtractDialogOpen(false)
    handleRefresh()
  }

  // Handle path change with clearing selections
  const handlePathChange = (newPath: string) => {
    // Clear selections when changing path
    updateSelectedFiles([])
    setCurrentPath(newPath)

    // Update the current tab's path
    setTabs((prevTabs) =>
        prevTabs.map((tab) =>
            tab.id === activeTab ? { ...tab, path: newPath, title: path.basename(newPath) || newPath } : tab,
        ),
    )
  }

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault()
    setContextMenuProps({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item,
    })
  }

  const closeContextMenu = () => {
    setContextMenuProps({
      show: false,
      x: 0,
      y: 0,
      item: null,
    })
  }

  // Check if the item is an archive
  const isArchive = (filename: string) => {
    const ext = path.extname(filename).toLowerCase()
    return [".zip", ".rar", ".7z", ".tar", ".gz", ".xz"].includes(ext)
  }

  // Handle archive extraction from the archive viewer
  const handleExtractFromArchiveViewer = (filePaths: string[]) => {
    setSelectedArchiveFiles(filePaths)
    setCurrentArchive(archiveViewerPath)
    setIsExtractDialogOpen(true)
  }

  // 处理文件复制
  const handleCopy = useCallback(() => {
    const selectedFiles = getSelectedFiles()
    if (selectedFiles.length > 0) {
      setClipboard({
        files: selectedFiles,
        operation: "copy"
      })
      // 添加到控制台日志
      if (consoleLogs) {
        setConsoleLogs([...consoleLogs, `📋 ${t("fileCopied")}: ${selectedFiles.length} ${t("filesSelected")}`])
      }
    }
  }, [getSelectedFiles, consoleLogs, t])

  // 处理文件剪切
  const handleCut = useCallback(() => {
    const selectedFiles = getSelectedFiles()
    if (selectedFiles.length > 0) {
      setClipboard({
        files: selectedFiles,
        operation: "cut"
      })
      // 添加到控制台日志
      if (consoleLogs) {
        setConsoleLogs([...consoleLogs, `✂️ ${t("fileMoved")}: ${selectedFiles.length} ${t("filesSelected")}`])
      }
    }
  }, [getSelectedFiles, consoleLogs, t])

  // 处理文件粘贴
  const handlePaste = useCallback(async () => {
    if (clipboard.files.length === 0 || !clipboard.operation) return
    
    try {
      // 在控制台日志中添加开始操作的消息
      const action = clipboard.operation === "copy" ? "复制" : "移动"
      setConsoleLogs([...consoleLogs, `🔄 ${action}文件中...`])
      
      for (const filePath of clipboard.files) {
        const fileName = path.basename(filePath)
        const destinationPath = path.join(currentPath, fileName)
        
        // 检查目标路径是否已存在
        const exists = await window.electron.fs.fileExists(destinationPath)
        
        if (exists && filePath !== destinationPath) {
          // 可以添加覆盖确认对话框，这里简单处理为自动重命名
          const extension = path.extname(fileName)
          const baseName = path.basename(fileName, extension)
          const newFileName = `${baseName}_copy${extension}`
          const newDestinationPath = path.join(currentPath, newFileName)
          
          if (clipboard.operation === "copy") {
            await window.electron.fs.copyFile(filePath, newDestinationPath)
          } else {
            await window.electron.fs.moveFile(filePath, newDestinationPath)
          }
        } else if (filePath !== destinationPath) { // 防止在相同位置粘贴
          if (clipboard.operation === "copy") {
            await window.electron.fs.copyFile(filePath, destinationPath)
          } else {
            await window.electron.fs.moveFile(filePath, destinationPath)
          }
        }
      }
      
      // 如果是剪切操作，清空剪贴板
      if (clipboard.operation === "cut") {
        setClipboard({ files: [], operation: null })
      }
      
      // 刷新当前目录
      loadFiles(currentPath)
      
      // 添加到控制台日志
      const successMessage = clipboard.operation === "copy" 
        ? `✅ ${t("fileCopied")}: ${clipboard.files.length} ${t("filesSelected")}`
        : `✅ ${t("fileMoved")}: ${clipboard.files.length} ${t("filesSelected")}`
      setConsoleLogs([...consoleLogs, successMessage])
    } catch (error) {
      console.error("Error pasting files:", error)
      
      // 添加错误消息到控制台日志
      const errorMessage = clipboard.operation === "copy" 
        ? `❌ ${t("errorCopyingFile")}: ${error.message}`
        : `❌ ${t("errorMovingFile")}: ${error.message}`
      setConsoleLogs([...consoleLogs, errorMessage])
    }
  }, [clipboard, currentPath, consoleLogs, t])

  // 处理文件重命名
  const handleOpenRenameDialog = useCallback((filePath) => {
    setFileToRename(filePath)
    setIsRenameDialogOpen(true)
  }, [])

  // 执行文件重命名
  const handleRenameFile = async (oldPath, newName) => {
    try {
      const directoryPath = path.dirname(oldPath)
      const newPath = path.join(directoryPath, newName)
      
      // 检查新文件名是否已存在
      const exists = await window.electron.fs.fileExists(newPath)
      if (exists && oldPath !== newPath) {
        throw new Error(t("fileAlreadyExists"))
      }
      
      await window.electron.fs.moveFile(oldPath, newPath)
      
      // 刷新文件列表
      loadFiles(currentPath)
      
      // 添加到控制台日志
      setConsoleLogs([...consoleLogs, `✅ ${t("fileRenamed")}: ${path.basename(oldPath)} → ${newName}`])
      
      return true
    } catch (error) {
      console.error("Error renaming file:", error)
      throw error
    }
  }

  // 处理上下文菜单中的文件操作
  const handleContextMenuRename = useCallback(() => {
    if (contextMenuProps.item) {
      handleOpenRenameDialog(contextMenuProps.item.path)
      closeContextMenu()
    }
  }, [contextMenuProps.item, handleOpenRenameDialog, closeContextMenu])

  const handleContextMenuCopy = useCallback(() => {
    if (contextMenuProps.item) {
      setClipboard({
        files: [contextMenuProps.item.path],
        operation: "copy"
      })
      // 添加到控制台日志
      setConsoleLogs([...consoleLogs, `📋 ${t("fileCopied")}: ${contextMenuProps.item.name}`])
      closeContextMenu()
    }
  }, [contextMenuProps.item, consoleLogs, t, closeContextMenu])

  const handleContextMenuCut = useCallback(() => {
    if (contextMenuProps.item) {
      setClipboard({
        files: [contextMenuProps.item.path],
        operation: "cut"
      })
      // 添加到控制台日志
      setConsoleLogs([...consoleLogs, `✂️ ${t("fileMoved")}: ${contextMenuProps.item.name}`])
      closeContextMenu()
    }
  }, [contextMenuProps.item, consoleLogs, t, closeContextMenu])

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenuProps.item) {
      // 更新选中文件为上下文菜单项
      updateSelectedFiles([contextMenuProps.item.path])
      // 打开删除确认对话框
      setIsDeleteDialogOpen(true)
      closeContextMenu()
    }
  }, [contextMenuProps.item, updateSelectedFiles, closeContextMenu])

  // 处理文件预览
  const handlePreviewFile = useCallback((filePath: string) => {
    setFileToPreview(filePath)
    setIsPreviewDialogOpen(true)
  }, [])

  // 处理文件双击
  const handleFileDoubleClick = useCallback((file: any) => {
    if (file.type === "folder") {
      // 导航到文件夹
      handlePathChange(file.path)
    } else {
      // 检查是否为存档文件
      const isArchiveFile = isArchive(file.name)
      if (isArchiveFile) {
        // 打开存档查看器
        handleOpenArchive(file.path)
      } else {
        // 尝试预览文件
        handlePreviewFile(file.path)
      }
    }
  }, [handlePathChange, handleOpenArchive, handlePreviewFile, isArchive])

  // 在上下文菜单中添加预览选项
  const handleContextMenuPreview = useCallback(() => {
    if (contextMenuProps.item && contextMenuProps.item.type !== "folder") {
      handlePreviewFile(contextMenuProps.item.path)
      closeContextMenu()
    }
  }, [contextMenuProps.item, handlePreviewFile, closeContextMenu])

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
        <div className="flex flex-col h-screen bg-background text-foreground" onClick={closeContextMenu}>
          <AppHeader
              onNewFile={handleNewFile}
              showHiddenFiles={showHiddenFiles}
              onToggleHiddenFiles={toggleShowHiddenFiles}
          />
          <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              onNewTab={handleNewTab}
          />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar currentPath={currentPath} setCurrentPath={handlePathChange} showHiddenFiles={showHiddenFiles} />
            <div className="flex flex-col flex-1">
              <Toolbar
                  onExtract={handleExtract}
                  onCompress={handleCompress}
                  selectedFiles={getSelectedFiles()}
                  currentArchive={currentArchive}
                  onOpenConfig={handleOpenConfig}
                  onSearch={handleSearch}
                  onRefresh={handleRefresh}
                  onDeselectAll={handleDeselectAll}
                  onDelete={handleDelete}
                  onAddFiles={() => setIsCompressDialogOpen(true)}
                  onCopy={handleCopy}
                  onCut={handleCut}
                  onPaste={handlePaste}
                  canPaste={clipboard.files.length > 0}
                  selectedFilesCount={getSelectedFiles().length}
              />

              {isArchiveViewerOpen ? (
                  <ArchiveViewer
                      archivePath={archiveViewerPath}
                      onClose={handleCloseArchiveViewer}
                      onExtract={handleExtractFromArchiveViewer}
                      config={config}
                  />
              ) : (
                  <FileList
                      currentPath={currentPath}
                      files={files}
                      selectedFiles={getSelectedFiles()}
                      onFileSelect={handleFileSelect}
                      onOpenArchive={handleOpenArchive}
                      onNavigate={handlePathChange}
                      searchTerm={searchTerm}
                      moveSelectedToTop={config.moveSelectedToTop}
                      showHiddenFiles={showHiddenFiles}
                      onContextMenu={handleContextMenu}
                      onFileDoubleClick={handleFileDoubleClick}
                  />
              )}
            </div>
          </div>
          <StatusBar fileCount={files.length} />

          <ExtractDialog
              isOpen={isExtractDialogOpen}
              onClose={handleExtractDialogClose}
              currentArchive={currentArchive}
              config={config}
              extractToCurrentPath={extractToCurrentPath}
              currentPath={currentPath}
              selectedFiles={selectedArchiveFiles}
          />

          <CompressDialog
              isOpen={isCompressDialogOpen}
              onClose={handleCompressDialogClose}
              selectedFiles={getSelectedFiles()}
              config={config}
          />

          <ConfigDialog
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
              config={config}
              onSave={handleSaveConfig}
          />

          <NewFileDialog
              isOpen={isNewFileDialogOpen}
              onClose={() => setIsNewFileDialogOpen(false)}
              onCreateFile={handleCreateNewFile}
          />

          <Console
              isOpen={isConsoleOpen}
              onToggle={() => setIsConsoleOpen(!isConsoleOpen)}
              logs={consoleLogs}
              onClear={clearLogs}
              onExecuteCommand={executeCommand}
              onRefresh={handleRefresh}
          />

          {/*<div style={{width:'100%', height: '400px'}}>*/}
          {/*  <XTerminal/>*/}
          {/*</div>*/}

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

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteConfirmation")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteConfirmationDescription", { count: getSelectedFiles().length })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                  {t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {contextMenuProps.show && (
              <ContextMenu
                  x={contextMenuProps.x}
                  y={contextMenuProps.y}
                  item={contextMenuProps.item}
                  onClose={closeContextMenu}
                  isArchive={contextMenuProps.item ? isArchive(contextMenuProps.item.name) : false}
                  onExtractToCurrentPath={() => {
                    handleExtractToCurrentPath(contextMenuProps.item.path)
                    closeContextMenu()
                  }}
                  onExtractToSpecifiedPath={() => {
                    handleExtractToSpecifiedPath(contextMenuProps.item.path)
                    closeContextMenu()
                  }}
                  onCopy={handleContextMenuCopy}
                  onCut={handleContextMenuCut}
                  onRename={handleContextMenuRename}
                  onDelete={handleContextMenuDelete}
                  onPreview={handleContextMenuPreview}
              />
          )}

          <RenameDialog
              isOpen={isRenameDialogOpen}
              onClose={() => setIsRenameDialogOpen(false)}
              onRename={handleRenameFile}
              filePath={fileToRename}
          />
          
          <FilePreviewDialog
              isOpen={isPreviewDialogOpen}
              onClose={() => setIsPreviewDialogOpen(false)}
              filePath={fileToPreview}
          />
        </div>
      </ThemeProvider>
  )
}
