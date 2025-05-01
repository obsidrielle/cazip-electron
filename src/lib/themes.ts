export const themes = {
  light: {
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    primary: "222.2 47.4% 11.2%",
    secondary: "210 40% 96.1%",
    muted: "210 40% 96.1%",
    accent: "210 40% 96.1%",
  },
  dark: {
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    primary: "210 40% 98%",
    secondary: "217.2 32.6% 17.5%",
    muted: "217.2 32.6% 17.5%",
    accent: "217.2 32.6% 17.5%",
  },
  system: {
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    primary: "222.2 47.4% 11.2%",
    secondary: "210 40% 96.1%",
    muted: "210 40% 96.1%",
    accent: "210 40% 96.1%",
  },
}

export type Theme = keyof typeof themes
