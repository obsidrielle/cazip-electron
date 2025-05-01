"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { Check, Monitor, Sun, Moon } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import type { Theme } from "@/lib/themes"

const themeOptions: { id: Theme; name: string; icon: React.ElementType }[] = [
    { id: "light", name: "themeLight", icon: Sun },
    { id: "dark", name: "themeDark", icon: Moon },
    { id: "system", name: "themeSystem", icon: Monitor },
]

export function ThemeSelector() {
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    {theme === "light" ? (
                        <Sun className="h-4 w-4" />
                    ) : theme === "dark" ? (
                        <Moon className="h-4 w-4" />
                    ) : (
                        <Monitor className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {themeOptions.map((ts) => (
                    <DropdownMenuItem key={ts.id} onClick={() => setTheme(ts.id)} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <ts.icon className="h-4 w-4 mr-2" />
                            {t(ts.name)}
                        </div>
                        {theme === ts.id && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
