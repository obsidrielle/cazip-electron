"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FolderOpen, HardDrive, Home, FileArchive, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import path from "path-browserify"

interface SidebarProps {
  currentPath: string
  setCurrentPath: (path: string) => void
}

export function Sidebar({ currentPath, setCurrentPath }: SidebarProps) {
  const { t } = useTranslation()
  const [userHome, setUserHome] = useState("")
  const [drives, setDrives] = useState<{ name: string; path: string }[]>([])
  const [recentArchives, setRecentArchives] = useState<{ name: string; path: string }[]>([])

  useEffect(() => {
    const home = window.electron.fs.getUserHome()
    setUserHome(home)

    if (window.electron.os.platform === "win32") {
      setDrives([
        { name: "C:", path: "C:\\" },
        { name: "D:", path: "D:\\" },
      ])
    } else {
      setDrives([{ name: "/", path: "/" }])
    }

    setRecentArchives([
      { name: "project.zip", path: path.join(home, "Downloads", "project.zip") },
      { name: "photos.rar", path: path.join(home, "Pictures", "photos.rar") },
      { name: "documents.7z", path: path.join(home, "Documents", "documents.7z") },
    ])
  }, [])

  const getFavorites = () => {
    if (!userHome) return []

    return [
      { name: t("desktop"), path: path.join(userHome, "Desktop") },
      { name: t("downloads"), path: path.join(userHome, "Downloads") },
      { name: t("documents"), path: path.join(userHome, "Documents") },
      { name: t("pictures"), path: path.join(userHome, "Pictures") },
    ]
  }

  return (
    <div className="w-56 bg-background border-r border-border flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-4">
            <div className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
              <Home className="w-4 h-4 mr-2" />
              <span>{t("quickAccess")}</span>
            </div>
            {getFavorites().map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start text-sm h-8 px-4 ${
                  currentPath === item.path ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => setCurrentPath(item.path)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {item.name}
              </Button>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
              <HardDrive className="w-4 h-4 mr-2" />
              <span>{t("drives")}</span>
            </div>
            {drives.map((drive) => (
              <Button
                key={drive.path}
                variant="ghost"
                className="w-full justify-start text-sm h-8 px-4"
                onClick={() => setCurrentPath(drive.path)}
              >
                <HardDrive className="w-4 h-4 mr-2" />
                {drive.name}
              </Button>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
              <FileArchive className="w-4 h-4 mr-2" />
              <span>{t("recentArchives")}</span>
            </div>
            {recentArchives.map((archive) => (
              <Button
                key={archive.path}
                variant="ghost"
                className="w-full justify-start text-sm h-8 px-4"
                onClick={() => setCurrentPath(archive.path)}
              >
                <FileArchive className="w-4 h-4 mr-2" />
                {archive.name}
              </Button>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground">
              <div className="flex items-center">
                <FolderOpen className="w-4 h-4 mr-2" />
                <span>{t("folderTree")}</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="pl-4">
              <div className="flex items-center">
                <ChevronDown className="w-4 h-4" />
                <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {window.electron.os.platform === "win32" ? "C:" : "/"}
                </Button>
              </div>
              <div className="pl-4">
                <div className="flex items-center">
                  <ChevronDown className="w-4 h-4" />
                  <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {window.electron.os.platform === "win32" ? "Users" : "home"}
                  </Button>
                </div>
                <div className="pl-4">
                  <div className="flex items-center">
                    <ChevronRight className="w-4 h-4" />
                    <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {userHome.split(path.sep).pop()}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

