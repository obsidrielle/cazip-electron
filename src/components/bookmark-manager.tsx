"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Star, Folder, File, Edit, Trash, Plus, BookmarkIcon, FolderHeart } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface BookmarkManagerProps {
  onNavigate: (path: string) => void
  currentPath: string
}

export function BookmarkManager({ onNavigate, currentPath }: BookmarkManagerProps) {
  const { t } = useTranslation()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newBookmarkName, setNewBookmarkName] = useState("")
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  // 从 localStorage 加载书签
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("bookmarks")
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks))
      }

      const savedCategories = localStorage.getItem("bookmarkCategories")
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories))
      } else {
        // 初始化默认分类
        const defaultCategories: BookmarkCategory[] = [
          {
            id: uuidv4(),
            name: t("favorites"),
            bookmarks: []
          },
          {
            id: uuidv4(),
            name: t("recentlyUsed"),
            bookmarks: []
          }
        ]
        setCategories(defaultCategories)
        localStorage.setItem("bookmarkCategories", JSON.stringify(defaultCategories))
      }
    } catch (error) {
      console.error("Error loading bookmarks from localStorage:", error)
    }
  }, [t])

  // 保存书签到 localStorage
  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks)
    localStorage.setItem("bookmarks", JSON.stringify(newBookmarks))
  }

  // 保存分类到 localStorage
  const saveCategories = (newCategories: BookmarkCategory[]) => {
    setCategories(newCategories)
    localStorage.setItem("bookmarkCategories", JSON.stringify(newCategories))
  }

  // 添加当前路径到书签
  const addCurrentPathToBookmarks = () => {
    setNewBookmarkName(currentPath.split("/").pop() || currentPath)
    setIsAddDialogOpen(true)
  }

  // 添加书签
  const handleAddBookmark = () => {
    const newBookmark: Bookmark = {
      id: uuidv4(),
      name: newBookmarkName,
      path: currentPath,
      type: "folder", // 假设当前路径是文件夹
      timestamp: Date.now()
    }

    // 添加到所有书签
    const updatedBookmarks = [...bookmarks, newBookmark]
    saveBookmarks(updatedBookmarks)

    // 添加到默认分类（收藏夹）
    const updatedCategories = categories.map(category => {
      if (category.name === t("favorites")) {
        return {
          ...category,
          bookmarks: [...category.bookmarks, newBookmark]
        }
      }
      return category
    })
    saveCategories(updatedCategories)

    // 重置状态
    setNewBookmarkName("")
    setIsAddDialogOpen(false)
  }

  // 编辑书签
  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setNewBookmarkName(bookmark.name)
    setIsAddDialogOpen(true)
  }

  // 保存编辑后的书签
  const handleSaveEdit = () => {
    if (!editingBookmark) return

    // 更新书签列表
    const updatedBookmarks = bookmarks.map(b => 
      b.id === editingBookmark.id 
        ? { ...b, name: newBookmarkName } 
        : b
    )
    saveBookmarks(updatedBookmarks)

    // 更新分类中的书签
    const updatedCategories = categories.map(category => ({
      ...category,
      bookmarks: category.bookmarks.map(b => 
        b.id === editingBookmark.id 
          ? { ...b, name: newBookmarkName } 
          : b
      )
    }))
    saveCategories(updatedCategories)

    // 重置状态
    setEditingBookmark(null)
    setNewBookmarkName("")
    setIsAddDialogOpen(false)
  }

  // 删除书签
  const handleDeleteBookmark = (bookmarkId: string) => {
    // 从主书签列表中删除
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId)
    saveBookmarks(updatedBookmarks)

    // 从所有分类中删除
    const updatedCategories = categories.map(category => ({
      ...category,
      bookmarks: category.bookmarks.filter(b => b.id !== bookmarkId)
    }))
    saveCategories(updatedCategories)
  }

  // 添加最近使用的路径
  const addToRecentlyUsed = (path: string) => {
    // 检查是否已存在于最近使用
    const recentCategory = categories.find(c => c.name === t("recentlyUsed"))
    if (!recentCategory) return

    // 检查是否已存在相同路径
    const existingBookmark = recentCategory.bookmarks.find(b => b.path === path)
    if (existingBookmark) {
      // 更新时间戳
      const updatedCategories = categories.map(category => {
        if (category.name === t("recentlyUsed")) {
          return {
            ...category,
            bookmarks: category.bookmarks.map(b => 
              b.path === path 
                ? { ...b, timestamp: Date.now() } 
                : b
            )
          }
        }
        return category
      })
      saveCategories(updatedCategories)
      return
    }

    // 创建新的最近使用书签
    const newRecentBookmark: Bookmark = {
      id: uuidv4(),
      name: path.split("/").pop() || path,
      path: path,
      type: "folder",
      timestamp: Date.now()
    }

    // 更新最近使用分类
    const updatedCategories = categories.map(category => {
      if (category.name === t("recentlyUsed")) {
        // 保持最近使用列表不超过10项
        const updatedBookmarks = [
          newRecentBookmark,
          ...category.bookmarks.filter(b => b.path !== path)
        ].slice(0, 10)

        return {
          ...category,
          bookmarks: updatedBookmarks
        }
      }
      return category
    })
    saveCategories(updatedCategories)
  }

  // 当导航到某个路径时
  const handleNavigateToBookmark = (path: string) => {
    onNavigate(path)
    addToRecentlyUsed(path)
  }

  return (
    <div className="bg-card rounded-md h-full flex flex-col border-border border">
      <div className="flex justify-between items-center p-2 border-b border-border">
        <div className="text-sm font-medium">{t("bookmarks")}</div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={addCurrentPathToBookmarks}
          title={t("addCurrentToBookmarks")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-grow">
        {categories.map((category) => (
          <div key={category.id} className="p-2">
            <div className="text-xs text-muted-foreground uppercase mb-2 flex items-center">
              {category.name === t("favorites") ? (
                <Star className="h-3 w-3 mr-1" />
              ) : (
                <BookmarkIcon className="h-3 w-3 mr-1" />
              )}
              {category.name}
            </div>
            
            {category.bookmarks.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">{t("noBookmarks")}</div>
            ) : (
              <div className="space-y-1">
                {category.bookmarks
                  .sort((a, b) => b.timestamp - a.timestamp) // 按时间戳排序
                  .map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className={cn(
                        "text-sm flex items-center justify-between p-2 rounded-md",
                        "hover:bg-accent cursor-pointer",
                        bookmark.path === currentPath && "bg-accent"
                      )}
                    >
                      <div 
                        className="flex items-center flex-1 truncate"
                        onClick={() => handleNavigateToBookmark(bookmark.path)}
                      >
                        {bookmark.type === "folder" ? (
                          <Folder className="h-4 w-4 text-blue-500 mr-2 shrink-0" />
                        ) : (
                          <File className="h-4 w-4 text-gray-500 mr-2 shrink-0" />
                        )}
                        <span className="truncate">{bookmark.name}</span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBookmark(bookmark)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="text-red-500"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </ScrollArea>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBookmark ? t("editBookmark") : t("addBookmark")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bookmark-name" className="text-right">
                {t("name")}
              </Label>
              <Input
                id="bookmark-name"
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
            {!editingBookmark && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bookmark-path" className="text-right">
                  {t("path")}
                </Label>
                <Input
                  id="bookmark-path"
                  value={currentPath}
                  className="col-span-3"
                  disabled
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false)
                setEditingBookmark(null)
                setNewBookmarkName("")
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={editingBookmark ? handleSaveEdit : handleAddBookmark}>
              {editingBookmark ? t("save") : t("add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 