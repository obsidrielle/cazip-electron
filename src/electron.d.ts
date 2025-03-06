interface ElectronAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
  }
  dialog: {
    openDirectory: () => Promise<string | null>
    openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>
  }
  fs: {
    readDirectory: (path: string) => Promise<any[]>
    getUserHome: () => string
  }
  os: {
    platform: string
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}

