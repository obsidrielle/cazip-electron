"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Terminal } from "lucide-react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"

interface ConsoleProps {
  isOpen: boolean
  onToggle: () => void
}

export function Console({ isOpen, onToggle }: ConsoleProps) {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<string[]>([])
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Here you would set up a connection to your Rust backend
    // For example, using WebSockets or Server-Sent Events
    const mockLogGenerator = setInterval(() => {
      setLogs((prevLogs) => [...prevLogs, `Log entry at ${new Date().toISOString()}`])
    }, 5000)

    return () => clearInterval(mockLogGenerator)
  }, [])

  useEffect(() => {
    if (isOpen && consoleRef.current) {
      consoleRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [isOpen])

  return (
    <div className="fixed bottom-0 left-0 right-0" ref={consoleRef}>
      <Button variant="outline" size="sm" onClick={onToggle} className="mb-1 ml-1">
        <Terminal className="mr-2 h-4 w-4" />
        {t("console")}
      </Button>
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isOpen ? "h-40 opacity-100" : "h-0 opacity-0"}
          overflow-hidden bg-background border-t
        `}
      >
        <ScrollArea className="h-full">
          {logs.map((log, index) => (
            <div key={index} className="p-2 text-sm">
              {log}
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}

