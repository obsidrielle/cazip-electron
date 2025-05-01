"use client"
import { useTranslation } from "react-i18next"
import { X, Folder, Plus } from "lucide-react"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { AnimatePresence, motion } from "framer-motion"

interface Tab {
  id: string
  title: string
  path: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onNewTab: () => void
}

export function Tabs({ tabs, activeTab, onTabChange, onTabClose, onNewTab }: TabsProps) {
  const { t } = useTranslation()

  return (
    <div className="border-b border-border">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center h-10">
          <AnimatePresence initial={false}>
            {tabs.map((tab, index) => (
              <motion.div
                key={tab.id}
                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                animate={{
                  width: "auto",
                  opacity: 1,
                  marginRight: index < tabs.length - 1 ? 1 : 0,
                }}
                exit={{
                  width: 0,
                  opacity: 0,
                  marginRight: 0,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  opacity: { duration: 0.2 },
                }}
                className="flex items-center"
                style={{ overflow: "hidden" }}
              >
                {index > 0 && <Separator orientation="vertical" className="h-6 mx-1" />}
                <Button
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={`
                    px-4 py-2 text-sm font-medium group relative
                    ${
                      activeTab === tab.id
                        ? "bg-background text-foreground hover:bg-background"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                    transition-colors duration-200 ease-in-out
                  `}
                  onClick={() => onTabChange(tab.id)}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  <span className="truncate max-w-[150px]">{tab.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`
                      ml-2 h-4 w-4 p-0 opacity-50 hover:opacity-100
                      ${
                        activeTab === tab.id
                          ? "hover:bg-accent hover:text-accent-foreground"
                          : "hover:bg-background hover:text-foreground"
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTabClose(tab.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.div initial={false} animate={{ opacity: 1 }} className="flex items-center ml-1">
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="default" size="icon" className="w-8 h-8 p-0" onClick={onNewTab}>
              <Plus className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

