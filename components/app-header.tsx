"use client"

import { Minus, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppHeader() {
  // In a real Electron app, these would interact with the Electron window API
  const handleMinimize = () => console.log("Minimize window")
  const handleMaximize = () => console.log("Maximize window")
  const handleClose = () => console.log("Close window")

  return (
    <div className="flex items-center justify-between h-10 px-2 bg-white border-b border-gray-200 select-none">
      <div className="flex items-center">
        <img src="/placeholder.svg?height=24&width=24" alt="App Logo" className="w-6 h-6 mr-2" />
        <span className="font-medium text-sm">Compression App</span>

        <div className="ml-4 flex items-center space-x-1">
          {["File", "Edit", "View", "Tools", "Help"].map((item) => (
            <DropdownMenu key={item}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-2 text-sm">
                  {item}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>{item === "File" ? "New Archive..." : `${item} Option 1`}</DropdownMenuItem>
                <DropdownMenuItem>{item === "File" ? "Open Archive..." : `${item} Option 2`}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{item === "File" ? "Exit" : `${item} Option 3`}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMinimize}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMaximize}>
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500 hover:text-white" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

