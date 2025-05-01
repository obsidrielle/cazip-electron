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
    deleteFile: (path: string) => Promise<boolean>
    fileExists: (path: string) => Promise<boolean>
    createFile: (path: string) => Promise<boolean>
  }
  os: {
    platform: string
  }
  childProcess: {
    spawn: (
        command: string,
        args: string[],
    ) => {
      stdout: {
        on: (event: string, callback: (data: string) => void) => void
      }
      stderr: {
        on: (event: string, callback: (data: string) => void) => void
      }
      on: (event: string, callback: (code?: number) => void) => void
    }
  }
  windowControls: (action: "minimize" | "maximize" | "close") => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
