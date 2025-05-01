const { contextBridge, ipcRenderer } = require("electron")
const os = require("os")
const { spawn } = require("child_process")

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
    deleteFile: (path) => ipcRenderer.invoke("fs:deleteFile", path),
    fileExists: (path) => ipcRenderer.invoke("fs:fileExists", path),
    createFile: (path) => ipcRenderer.invoke("fs:createFile", path),
  },
  os: {
    platform: os.platform(),
  },
  childProcess: {
    spawn: (command, args) => {
      const childProcess = spawn(command, args, {
        shell: true, // This allows executing shell commands
      })

      return {
        stdout: {
          on: (event, callback) => {
            childProcess.stdout.on(event, (data) => callback(data.toString()))
          },
        },
        stderr: {
          on: (event, callback) => {
            childProcess.stderr.on(event, (data) => callback(data.toString()))
          },
        },
        on: (event, callback) => {
          childProcess.on(event, callback)
        },
      }
    },
  },
  windowControls: (action) => ipcRenderer.send("window-controls", action),
})
