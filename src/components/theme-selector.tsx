"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { Check, Monitor } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import type { Theme } from "@/lib/themes"

const themeOptions: { id: Theme; name: string; color?: string; icon?: React.ElementType }[] = [
  { id: "light", name: "themeLight", color: "bg-white" },
  { id: "dark", name: "themeDark", color: "bg-slate-950" },
  { id: "system", name: "themeSystem", icon: Monitor },
  { id: "rose", name: "themeRose", color: "bg-rose-500" },
  { id: "green", name: "themeGreen", color: "bg-emerald-500" },
  { id: "blue", name: "themeBlue", color: "bg-blue-500" },
  { id: "purple", name: "themePurple", color: "bg-purple-500" },
  { id: "orange", name: "themeOrange", color: "bg-orange-500" },
]

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className={`h-4 w-4 rounded ${themeOptions.find((th) => th.id === theme)?.color || "bg-foreground"}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {themeOptions.map((th) => (
          <DropdownMenuItem key={th.id} onClick={() => setTheme(th.id)} className="flex items-center justify-between">
            <div className="flex items-center">
              {th.icon ? <th.icon className="h-4 w-4 mr-2" /> : <div className={`h-4 w-4 rounded mr-2 ${th.color}`} />}
              {t(th.name)}
            </div>
            {theme === th.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

