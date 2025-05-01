import { FolderOpen, HardDrive, Home, FileArchive, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps {
  currentPath: string
  setCurrentPath: (path: string) => void
}

export function Sidebar({ currentPath, setCurrentPath }: SidebarProps) {
  const favorites = [
    { name: "Desktop", path: "C:/Users/User/Desktop" },
    { name: "Downloads", path: "C:/Users/User/Downloads" },
    { name: "Documents", path: "C:/Users/User/Documents" },
    { name: "Pictures", path: "C:/Users/User/Pictures" },
  ]

  const drives = [
    { name: "C:", path: "C:/" },
    { name: "D:", path: "D:/" },
  ]

  const recentArchives = [
    { name: "project.zip", path: "C:/Users/User/Downloads/project.zip" },
    { name: "photos.rar", path: "C:/Users/User/Pictures/photos.rar" },
    { name: "documents.7z", path: "C:/Users/User/Documents/documents.7z" },
  ]

  return (
    <div className="w-56 bg-gray-100 border-r border-gray-200 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-4">
            <div className="flex items-center px-2 py-1 text-sm font-medium text-gray-600">
              <Home className="w-4 h-4 mr-2" />
              <span>Quick Access</span>
            </div>
            {favorites.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start text-sm h-8 px-4 ${
                  currentPath === item.path ? "bg-blue-100 text-blue-700" : ""
                }`}
                onClick={() => setCurrentPath(item.path)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {item.name}
              </Button>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center px-2 py-1 text-sm font-medium text-gray-600">
              <HardDrive className="w-4 h-4 mr-2" />
              <span>Drives</span>
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
            <div className="flex items-center px-2 py-1 text-sm font-medium text-gray-600">
              <FileArchive className="w-4 h-4 mr-2" />
              <span>Recent Archives</span>
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
            <div className="flex items-center justify-between px-2 py-1 text-sm font-medium text-gray-600">
              <div className="flex items-center">
                <FolderOpen className="w-4 h-4 mr-2" />
                <span>Folder Tree</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="pl-4">
              <div className="flex items-center">
                <ChevronDown className="w-4 h-4" />
                <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  C:
                </Button>
              </div>
              <div className="pl-4">
                <div className="flex items-center">
                  <ChevronDown className="w-4 h-4" />
                  <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                </div>
                <div className="pl-4">
                  <div className="flex items-center">
                    <ChevronRight className="w-4 h-4" />
                    <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      User
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

