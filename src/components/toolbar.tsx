"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { 
  FileArchive, 
  FolderOpen, 
  Trash2, 
  Search, 
  Settings, 
  Globe, 
  RefreshCw, 
  X, 
  Copy, 
  Scissors, 
  ClipboardPaste,
  FilePlus
} from "lucide-react"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { ThemeSelector } from "./theme-selector"
import { useTheme } from "next-themes"
import { Input } from "./ui/input"
import path from "path-browserify"

interface ToolbarProps {
  onAddFiles?: () => void
  onExtract?: () => void
  onCompress?: () => void
  onSearch: (term: string) => void
  onRefresh: () => void
  onDeselectAll: () => void
  onDelete: () => void
  onCopy?: () => void
  onCut?: () => void
  onPaste?: () => void
  canPaste?: boolean
  onOpenConfig?: () => void
  onToggleHiddenFiles?: () => void
  onNewFile?: () => void
  selectedFilesCount: number
}

export function Toolbar({
  onAddFiles,
  onExtract,
  onCompress,
  onSearch,
  onRefresh,
  onDeselectAll,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  canPaste,
  onOpenConfig,
  onToggleHiddenFiles,
  onNewFile,
  selectedFilesCount
}: ToolbarProps) {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <TooltipProvider>
      <div className="flex items-center p-1 border-b border-border bg-background">
        <div className="flex items-center space-x-1">
          {onNewFile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent-hover hover:text-accent-foreground"
                  onClick={onNewFile}
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("newFile")}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {onCompress && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent-hover hover:text-accent-foreground"
                  onClick={onCompress}
                  disabled={selectedFilesCount === 0}
                >
                  <FileArchive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("compress")}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onExtract && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
                  onClick={onExtract}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("extract")}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <div className="flex items-center space-x-1">
          {onCopy && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
                  disabled={selectedFilesCount === 0}
                  onClick={onCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("copy")}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {onCut && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
                  disabled={selectedFilesCount === 0}
                  onClick={onCut}
                >
                  <Scissors className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("cut")}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {onPaste && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
                  disabled={!canPaste}
                  onClick={onPaste}
                >
                  <ClipboardPaste className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("paste")}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
                disabled={selectedFilesCount === 0}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("delete")}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <div className="flex items-center space-x-1">
          <Input
            type="text"
            placeholder={t("searchFiles")}
            className="h-8 w-40"
            onChange={(e) => onSearch(e.target.value)}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("search")}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-2 h-6" />

        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("refresh")}</p>
            </TooltipContent>
          </Tooltip>

          {selectedFilesCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
                  onClick={onDeselectAll}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("deselectAll")}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="ml-auto flex items-center space-x-1">
          <ThemeSelector />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage("en")}>
                <Globe className="mr-2 h-4 w-4" />
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage("zh")}>
                <Globe className="mr-2 h-4 w-4" />
                中文
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onToggleHiddenFiles && (
                <DropdownMenuItem onClick={onToggleHiddenFiles}>
                  <Globe className="mr-2 h-4 w-4" />
                  {t("showHiddenFiles")}
                </DropdownMenuItem>
              )}
              {onOpenConfig && (
                <DropdownMenuItem onClick={onOpenConfig}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("openConfigWindow")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  )
}
