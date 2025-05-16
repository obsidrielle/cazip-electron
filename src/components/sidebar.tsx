"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FolderOpen, HardDrive, Home, FileArchive, ChevronRight, ChevronDown, Plus, X, Download, Image, Computer } from "lucide-react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import path from "path-browserify"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { BookmarkManager } from "./bookmark-manager"

interface SidebarProps {
  currentPath: string
  setCurrentPath: (path: string) => void
  showHiddenFiles: boolean
}

interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
  isExpanded: boolean
  isLoaded: boolean
}

interface RecentArchive {
  name: string
  path: string
  timestamp: number
}

interface QuickAccessItem {
  name: string
  path: string
  isDefault?: boolean
}

const MAX_RECENT_ARCHIVES = 10

export function Sidebar({ currentPath, setCurrentPath, showHiddenFiles }: SidebarProps) {
  const { t } = useTranslation()
  const [userHome, setUserHome] = useState("")
  const [drives, setDrives] = useState<string[]>([])
  const [recentArchives, setRecentArchives] = useState<RecentArchive[]>([])
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null)
  const [isRecentArchivesOpen, setIsRecentArchivesOpen] = useState(true)
  const [isFolderTreeOpen, setIsFolderTreeOpen] = useState(true)
  const [quickAccessItems, setQuickAccessItems] = useState<QuickAccessItem[]>([])
  const [isAddPathDialogOpen, setIsAddPathDialogOpen] = useState(false)
  const [newPathName, setNewPathName] = useState("")
  const [newPathLocation, setNewPathLocation] = useState("")
  const [editingQuickAccess, setEditingQuickAccess] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    quickAccess: true,
    drives: false,
    bookmarks: true,
  })

  // Load user home and drives
  useEffect(() => {
    const home = window.electron.fs.getUserHome()
    setUserHome(home)

    if (window.electron.os.platform === "win32") {
      setDrives(["C:", "D:"])
    } else if (window.electron.os.platform === "darwin") {
      setDrives(["/", "/Volumes"])
    } else {
      setDrives(["/", "/home", "/mnt", "/media"])
    }

    // Load recent archives from localStorage
    try {
      const savedArchives = localStorage.getItem("recentArchives")
      if (savedArchives) {
        setRecentArchives(JSON.parse(savedArchives))
      }

      // Load custom quick access paths
      const savedQuickAccess = localStorage.getItem("quickAccessPaths")
      if (savedQuickAccess) {
        setQuickAccessItems(JSON.parse(savedQuickAccess))
      } else {
        // Initialize with default paths
        const defaultPaths = getDefaultQuickAccessPaths(home)
        setQuickAccessItems(defaultPaths)
        localStorage.setItem("quickAccessPaths", JSON.stringify(defaultPaths))
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
    }

    // Initialize folder tree
    initializeFolderTree(home)
  }, [])

  // Get default quick access paths
  const getDefaultQuickAccessPaths = (homePath: string): QuickAccessItem[] => {
    return [
      { name: t("home"), path: homePath, isDefault: true },
      { name: t("desktop"), path: path.join(homePath, "Desktop"), isDefault: true },
      { name: t("downloads"), path: path.join(homePath, "Downloads"), isDefault: true },
      { name: t("documents"), path: path.join(homePath, "Documents"), isDefault: true },
      { name: t("pictures"), path: path.join(homePath, "Pictures"), isDefault: true },
    ]
  }

  // Initialize folder tree with root folders
  const initializeFolderTree = async (homePath: string) => {
    const rootPath = window.electron.os.platform === "win32" ? "C:\\" : "/"

    try {
      const rootNode: FolderNode = {
        name: window.electron.os.platform === "win32" ? "C:" : "/",
        path: rootPath,
        children: [],
        isExpanded: true,
        isLoaded: false,
      }

      // Load first level of folders
      await loadFolderChildren(rootNode)
      setFolderTree(rootNode)
    } catch (error) {
      console.error("Error initializing folder tree:", error)
    }
  }

  // Load children for a folder node
  const loadFolderChildren = async (node: FolderNode) => {
    try {
      const items = await window.electron.fs.readDirectory(node.path)

      // Filter only folders and optionally hidden files
      const folders = items.filter((item) => {
        const isFolder = item.type === "folder"
        const isHidden = item.name.startsWith(".")
        return isFolder && (showHiddenFiles || !isHidden)
      })

      // Create child nodes
      node.children = folders.map((folder) => ({
        name: folder.name,
        path: folder.path,
        children: [],
        isExpanded: false,
        isLoaded: false,
      }))

      node.isLoaded = true
      return node
    } catch (error) {
      console.error(`Error loading children for ${node.path}:`, error)
      return node
    }
  }

  // Reload folder tree when showHiddenFiles changes
  useEffect(() => {
    if (folderTree) {
      initializeFolderTree(userHome)
    }
  }, [showHiddenFiles, userHome])

  // Toggle folder expansion
  const toggleFolder = async (node: FolderNode) => {
    // Create a deep copy of the folder tree
    const updatedTree = JSON.parse(JSON.stringify(folderTree))

    // Find the node to toggle
    const findAndToggleNode = async (searchNode: FolderNode, targetPath: string): Promise<boolean> => {
      if (searchNode.path === targetPath) {
        searchNode.isExpanded = !searchNode.isExpanded

        // If expanding and no children loaded yet, load them
        if (searchNode.isExpanded && !searchNode.isLoaded) {
          try {
            const items = await window.electron.fs.readDirectory(searchNode.path)

            // Filter only folders and optionally hidden files
            const folders = items.filter((item) => {
              const isFolder = item.type === "folder"
              const isHidden = item.name.startsWith(".")
              return isFolder && (showHiddenFiles || !isHidden)
            })

            // Create child nodes
            searchNode.children = folders.map((folder) => ({
              name: folder.name,
              path: folder.path,
              children: [],
              isExpanded: false,
              isLoaded: false,
            }))

            searchNode.isLoaded = true
          } catch (error) {
            console.error(`Error loading children for ${searchNode.path}:`, error)
          }
        }
        return true
      }

      for (let i = 0; i < searchNode.children.length; i++) {
        if (await findAndToggleNode(searchNode.children[i], targetPath)) {
          return true
        }
      }

      return false
    }

    if (updatedTree) {
      await findAndToggleNode(updatedTree, node.path)
      setFolderTree(updatedTree)
    }
  }

  // Render folder tree recursively
  const renderFolderTree = (node: FolderNode, level = 0) => {
    return (
        <div key={node.path} className="pl-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => toggleFolder(node)}>
              {node.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Button
                variant="ghost"
                className="w-full justify-start text-sm h-8 px-2"
                onClick={() => setCurrentPath(node.path)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {node.name}
            </Button>
          </div>

          {node.isExpanded && (
              <div className="pl-2">{node.children.map((child) => renderFolderTree(child, level + 1))}</div>
          )}
        </div>
    )
  }

  // Add a new quick access path
  const handleAddQuickAccessPath = async () => {
    if (!newPathName.trim()) {
      return
    }

    const pathToAdd = newPathLocation || (await window.electron.dialog.openDirectory())

    if (pathToAdd) {
      const newItem: QuickAccessItem = {
        name: newPathName,
        path: pathToAdd,
        isDefault: false,
      }

      const updatedItems = [...quickAccessItems, newItem]
      setQuickAccessItems(updatedItems)
      localStorage.setItem("quickAccessPaths", JSON.stringify(updatedItems))

      // Reset form
      setNewPathName("")
      setNewPathLocation("")
      setIsAddPathDialogOpen(false)
    }
  }

  // Remove a quick access path
  const handleRemoveQuickAccessPath = (indexToRemove: number) => {
    const updatedItems = quickAccessItems.filter((_, index) => index !== indexToRemove)
    setQuickAccessItems(updatedItems)
    localStorage.setItem("quickAccessPaths", JSON.stringify(updatedItems))
  }

  // Browse for a path
  const handleBrowsePath = async () => {
    const selectedPath = await window.electron.dialog.openDirectory()
    if (selectedPath) {
      setNewPathLocation(selectedPath)
    }
  }

  const toggleExpanded = (section: string) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  const getDesktopPath = () => {
    return path.join(getUserHome(), "Desktop");
  };

  const getDownloadsPath = () => {
    return path.join(getUserHome(), "Downloads");
  };

  const getDocumentsPath = () => {
    return path.join(getUserHome(), "Documents");
  };

  const getPicturesPath = () => {
    return path.join(getUserHome(), "Pictures");
  };

  return (
      <div className="w-60 border-r border-border shrink-0 bg-card py-2 h-full flex flex-col">
        <ScrollArea className="flex-grow">
          <div className="p-2">
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  <span>{t("quickAccess")}</span>
                </div>
                <div className="flex items-center">
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0"
                      onClick={() => setIsAddPathDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {quickAccessItems.map((item, index) => (
                  <div key={index} className="flex items-center group">
                    <Button
                        variant="ghost"
                        className={`w-full justify-start text-sm h-8 px-4 ${
                            currentPath === item.path ? "bg-accent text-accent-foreground" : ""
                        }`}
                        onClick={() => setCurrentPath(item.path)}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {item.name}
                    </Button>
                    {!item.isDefault && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveQuickAccessPath(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                    )}
                  </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
                <HardDrive className="w-4 h-4 mr-2" />
                <span>{t("drives")}</span>
              </div>
              {drives.map((drive) => (
                  <Button
                      key={drive}
                      variant="ghost"
                      className="w-full justify-start text-sm h-8 px-4"
                      onClick={() => setCurrentPath(drive)}
                  >
                    <HardDrive className="w-4 h-4 mr-2" />
                    {drive}
                  </Button>
              ))}
            </div>

            <Collapsible open={isRecentArchivesOpen} onOpenChange={setIsRecentArchivesOpen} className="mb-4">
              <div className="flex items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground">
                <div className="flex items-center">
                  <FileArchive className="w-4 h-4 mr-2" />
                  <span>{t("recentArchives")}</span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                    {isRecentArchivesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                {recentArchives.length > 0 ? (
                    recentArchives.map((archive) => (
                        <Button
                            key={archive.path}
                            variant="ghost"
                            className="w-full justify-start text-sm h-8 px-4"
                            onClick={() => setCurrentPath(path.dirname(archive.path))}
                        >
                          <FileArchive className="w-4 h-4 mr-2" />
                          {archive.name}
                        </Button>
                    ))
                ) : (
                    <div className="px-4 py-2 text-sm text-muted-foreground">{t("noRecentArchives")}</div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={isFolderTreeOpen} onOpenChange={setIsFolderTreeOpen} className="mb-4">
              <div className="flex items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground">
                <div className="flex items-center">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  <span>{t("folderTree")}</span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                    {isFolderTreeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>{folderTree && renderFolderTree(folderTree)}</CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {/* Add Quick Access Path Dialog */}
        <Dialog open={isAddPathDialogOpen} onOpenChange={setIsAddPathDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("addQuickAccessPath")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  {t("name")}:
                </label>
                <Input
                    id="name"
                    value={newPathName}
                    onChange={(e) => setNewPathName(e.target.value)}
                    className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="path" className="text-right">
                  {t("path")}:
                </label>
                <div className="col-span-3 flex">
                  <Input
                      id="path"
                      value={newPathLocation}
                      onChange={(e) => setNewPathLocation(e.target.value)}
                      className="flex-1"
                  />
                  <Button variant="outline" className="ml-2" onClick={handleBrowsePath}>
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPathDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleAddQuickAccessPath} disabled={!newPathName.trim()}>
                {t("add")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="px-2 py-1 mb-2 flex flex-col">
          <div 
            className="flex items-center justify-between cursor-pointer p-1 hover:bg-accent rounded-md"
            onClick={() => toggleExpanded("bookmarks")}
          >
            <span className="text-sm font-medium flex items-center">
              {expanded.bookmarks ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
              {t("bookmarks")}
            </span>
          </div>
          
          {expanded.bookmarks && (
            <div className="mt-1">
              <BookmarkManager 
                onNavigate={navigateTo} 
                currentPath={currentPath} 
              />
            </div>
          )}
        </div>
      </div>
  )
}
