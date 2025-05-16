// 文件类型定义
interface FileEntry {
  name: string;
  path: string;
  type: string;
  size: string;
  modified: string;
}

// 文件信息类型定义
interface FileInfo {
  size: number;
  isDirectory: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
}

// 书签定义
interface Bookmark {
  id: string;
  name: string;
  path: string;
  type: "folder" | "file";
  icon?: string;
  color?: string;
  timestamp: number;
}

// 书签分类
interface BookmarkCategory {
  id: string;
  name: string;
  bookmarks: Bookmark[];
}

// Electron API类型定义
interface ElectronAPI {
  window: {
    minimize(): Promise<void>
    maximize(): Promise<void>
    close(): Promise<void>
  }
  dialog: {
    openDirectory(): Promise<string | null>
    openFile(options?: any): Promise<string | null>
  }
  fs: {
    readDirectory(path: string): Promise<FileEntry[]>
    getUserHome(): string
    deleteFile(path: string): Promise<boolean>
    fileExists(path: string): Promise<boolean>
    createFile(path: string): Promise<boolean>
    copyFile(sourcePath: string, destinationPath: string): Promise<boolean>
    moveFile(sourcePath: string, destinationPath: string): Promise<boolean>
    getFileInfo(path: string): Promise<FileInfo>
    readTextFile(path: string): Promise<string>
    readImageAsBase64(path: string): Promise<string>
  }
  os: {
    platform: string
  }
  terminal: {
    create(shell: string, dataCallback: (data: string) => void): Promise<boolean>
    write(data: string): Promise<boolean>
    resize(cols: number, rows: number): Promise<boolean>
    destroy(): Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}; 