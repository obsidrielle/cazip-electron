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
// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
