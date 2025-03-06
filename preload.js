const { contextBridge, ipcRenderer, remote, shell} = require("electron")
const os = require("os")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
    openFile: (options) => ipcRenderer.invoke("dialog:openFile", options),
  },
  fs: {
    readDirectory: (path) => ipcRenderer.invoke("fs:readDirectory", path),
    getUserHome: () => os.homedir(),
  },
  os: {
    platform: os.platform(),
  },
})

