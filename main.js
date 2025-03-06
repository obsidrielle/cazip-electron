const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const path = require("path")
const fs = require("fs")
const isDev = require("electron-is-dev")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false, // Frameless window for custom title bar
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

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

