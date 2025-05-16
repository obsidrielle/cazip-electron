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
    copyFile: (sourcePath, destinationPath) => ipcRenderer.invoke("fs:copyFile", sourcePath, destinationPath),
    moveFile: (sourcePath, destinationPath) => ipcRenderer.invoke("fs:moveFile", sourcePath, destinationPath),
    getFileInfo: (path) => ipcRenderer.invoke("fs:getFileInfo", path),
    readTextFile: (path) => ipcRenderer.invoke("fs:readTextFile", path),
    readImageAsBase64: (path) => ipcRenderer.invoke("fs:readImageAsBase64", path),
  },
  os: {
    platform: os.platform(),
  },
  // 添加终端相关 API
  terminal: {
    // 创建一个新的终端进程，并设置数据回调
    create: (shell, dataCallback) => {
      // 设置数据回调
      ipcRenderer.on('terminal:data', (_, data) => {
        dataCallback(data);
      });

      // 创建终端进程
      return ipcRenderer.invoke('terminal:create', shell);
    },

    // 向终端发送数据
    write: (data) => {
      ipcRenderer.invoke('terminal:write', data);
    },

    // 调整终端大小
    resize: (cols, rows) => {
      ipcRenderer.invoke('terminal:resize', cols, rows);
    },

    // 销毁终端
    destroy: () => {
      ipcRenderer.invoke('terminal:destroy');
      ipcRenderer.removeAllListeners('terminal:data');
    }
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
