import { useTranslation } from "react-i18next"
import { useTheme } from "next-themes"
import { Moon, Sun, Globe } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

export function SettingsMenu() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {t("darkMode")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("en")}>🇺🇸 English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("zh")}>🇨🇳 中文</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

