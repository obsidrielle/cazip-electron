const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const path = require("path")
const fs = require("fs")
const os = require("os")
// const pty = require('node-pty')
const isDev = require("electron-is-dev")

let mainWindow
let ptyProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      sandbox: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false, // Frameless window for custom title bar
    icon: path.join(__dirname, "public", "cazip.png"), // Set the application icon
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"))
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (ptyProcess) {
    ptyProcess.kill()
    ptyProcess = null
  }
})

// Window control handlers
ipcMain.on("window-controls", (event, action) => {
  switch (action) {
    case "minimize":
      mainWindow.minimize()
      break
    case "maximize":
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
      break
    case "close":
      mainWindow.close()
      break
  }
})

// File system handlers
ipcMain.handle("dialog:openDirectory", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  })
  if (canceled) {
    return null
  } else {
    return filePaths[0]
  }
})

ipcMain.handle("dialog:openFile", async (event, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: options?.filters || [],
  })
  if (canceled) {
    return null
  } else {
    return filePaths[0]
  }
})

ipcMain.handle("fs:readDirectory", async (event, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true })
    return files.map((file) => {
      const isDirectory = file.isDirectory()
      const filePath = path.join(dirPath, file.name)
      let stats = { size: 0, mtime: new Date() }

      try {
        stats = fs.statSync(filePath)
      } catch (err) {
        console.error(`Error getting stats for ${filePath}:`, err)
      }

      return {
        name: file.name,
        path: filePath,
        type: isDirectory ? "folder" : path.extname(file.name).slice(1) || "file",
        size: isDirectory ? "" : formatFileSize(stats.size),
        modified: stats.mtime.toLocaleString(),
      }
    })
  } catch (error) {
    console.error("Error reading directory:", error)
    return []
  }
})

ipcMain.handle("fs:deleteFile", async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath)

    if (stats.isDirectory()) {
      await fs.promises.rmdir(filePath, { recursive: true })
    } else {
      await fs.promises.unlink(filePath)
    }

    return true
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error)
    throw error
  }
})

ipcMain.handle("fs:fileExists", async (event, filePath) => {
  try {
    await fs.promises.access(filePath)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle("fs:createFile", async (event, filePath) => {
  try {
    // Create an empty file
    await fs.promises.writeFile(filePath, "")
    return true
  } catch (error) {
    console.error(`Error creating file ${filePath}:`, error)
    throw error
  }
})

// 获取文件信息
ipcMain.handle("fs:getFileInfo", async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath)
    return {
      size: stats.size,
      isDirectory: stats.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
    }
  } catch (error) {
    console.error(`Error getting file info for ${filePath}:`, error)
    throw error
  }
})

// 读取文本文件
ipcMain.handle("fs:readTextFile", async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, { encoding: 'utf8' })
    return content
  } catch (error) {
    console.error(`Error reading text file ${filePath}:`, error)
    throw error
  }
})

// 文件复制处理程序
ipcMain.handle("fs:copyFile", async (event, sourcePath, destinationPath) => {
  try {
    const stats = await fs.promises.stat(sourcePath)
    
    if (stats.isDirectory()) {
      // 使用递归函数复制目录
      const copyDir = async (src, dest) => {
        // 创建目标目录
        await fs.promises.mkdir(dest, { recursive: true })
        
        // 读取源目录内容
        const entries = await fs.promises.readdir(src, { withFileTypes: true })
        
        // 复制每个条目
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          
          if (entry.isDirectory()) {
            // 递归复制子目录
            await copyDir(srcPath, destPath)
          } else {
            // 复制文件
            await fs.promises.copyFile(srcPath, destPath)
          }
        }
      }
      
      await copyDir(sourcePath, destinationPath)
    } else {
      // 复制单个文件
      await fs.promises.copyFile(sourcePath, destinationPath)
    }
    
    return true
  } catch (error) {
    console.error(`Error copying ${sourcePath} to ${destinationPath}:`, error)
    throw error
  }
})

// 文件移动/重命名处理程序
ipcMain.handle("fs:moveFile", async (event, sourcePath, destinationPath) => {
  try {
    await fs.promises.rename(sourcePath, destinationPath)
    return true
  } catch (error) {
    // 如果简单的重命名失败（可能是跨设备），尝试复制然后删除
    if (error.code === 'EXDEV') {
      // 先复制文件
      await ipcMain.handle("fs:copyFile", event, sourcePath, destinationPath)
      // 然后删除源文件
      await fs.promises.rm(sourcePath, { recursive: true, force: true })
      return true
    }
    console.error(`Error moving ${sourcePath} to ${destinationPath}:`, error)
    throw error
  }
})

ipcMain.handle('terminal:create', (event, shell) => {
  try {
    // 如果已经存在终端进程，先销毁它
    if (ptyProcess !== null) {
      ptyProcess.kill();
      ptyProcess = null;
    }

    // 默认 shell
    const defaultShell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const shellToUse = shell || defaultShell;

    // 创建 pty 进程
    ptyProcess = pty.spawn(shellToUse, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: os.homedir(),
      env: process.env
    });

    // 处理 pty 进程输出的数据
    ptyProcess.onData(data => {
      // 确保窗口仍然存在
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:data', data);
      }
    });

    return true;
  } catch (error) {
    console.error('Error creating terminal:', error);
    return false;
  }
});

// 向终端写入数据
ipcMain.handle('terminal:write', (event, data) => {
  if (ptyProcess) {
    ptyProcess.write(data);
    return true;
  }
  return false;
});

// 调整终端大小
ipcMain.handle('terminal:resize', (event, cols, rows) => {
  if (ptyProcess) {
    try {
      ptyProcess.resize(cols, rows);
      return true;
    } catch (error) {
      console.error('Error resizing terminal:', error);
      return false;
    }
  }
  return false;
});

// 销毁终端
ipcMain.handle('terminal:destroy', () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
    return true;
  }
  return false;
});

// 读取图像文件并返回Base64编码的数据
ipcMain.handle("fs:readImageAsBase64", async (event, filePath) => {
  try {
    // 读取文件为二进制数据
    const fileData = await fs.promises.readFile(filePath)
    
    // 将二进制数据转换为Base64字符串
    const base64Data = fileData.toString('base64')
    
    // 获取文件扩展名以确定MIME类型
    const extname = path.extname(filePath).toLowerCase()
    let mimeType = 'image/jpeg' // 默认MIME类型
    
    if (extname === '.png') mimeType = 'image/png'
    else if (extname === '.gif') mimeType = 'image/gif'
    else if (extname === '.webp') mimeType = 'image/webp'
    else if (extname === '.svg') mimeType = 'image/svg+xml'
    else if (extname === '.bmp') mimeType = 'image/bmp'
    
    // 返回完整的Data URL
    return `data:${mimeType};base64,${base64Data}`
  } catch (error) {
    console.error(`Error reading image file ${filePath}:`, error)
    throw error
  }
})

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
