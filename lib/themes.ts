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
  rose: {
    background: "0 100% 97%",
    foreground: "0 84% 4.9%",
    primary: "0 72.2% 50.6%",
    secondary: "0 0% 96.1%",
    muted: "0 0% 96.1%",
    accent: "0 72.2% 50.6%",
  },
  green: {
    background: "150 100% 97%",
    foreground: "150 84% 4.9%",
    primary: "142.1 76.2% 36.3%",
    secondary: "150 0% 96.1%",
    muted: "150 0% 96.1%",
    accent: "142.1 76.2% 36.3%",
  },
  blue: {
    background: "210 100% 97%",
    foreground: "210 84% 4.9%",
    primary: "221.2 83.2% 53.3%",
    secondary: "210 0% 96.1%",
    muted: "210 0% 96.1%",
    accent: "221.2 83.2% 53.3%",
  },
  purple: {
    background: "270 100% 97%",
    foreground: "270 84% 4.9%",
    primary: "262.1 83.3% 57.8%",
    secondary: "270 0% 96.1%",
    muted: "270 0% 96.1%",
    accent: "262.1 83.3% 57.8%",
  },
  orange: {
    background: "30 100% 97%",
    foreground: "30 84% 4.9%",
    primary: "24.6 95% 53.1%",
    secondary: "30 0% 96.1%",
    muted: "30 0% 96.1%",
    accent: "24.6 95% 53.1%",
  },
}

export type Theme = keyof typeof themes

