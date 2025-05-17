export enum Format {
  Zip = "zip",
  Gz = "gz",
  SevenZ = "7z",
  Xz = "xz",
}

export enum Method {
  Deflate = "deflate",
  Deflate64 = "deflate64",
  Bzip2 = "bzip2",
  Zstd = "zstd",
}

export interface CompressionOptions {
  target: string
  sources: string[]
  format?: Format
  method?: Method
  password?: string
  unzip: boolean
  debug: boolean
  volumeSize?: number
  rustExecutablePath: string
  selectedFiles?: string[] // Add support for extracting specific files
  
  // 新增脚本相关选项
  useScript?: boolean
  scriptFile?: string
  virtualEnvDir?: string
}

export class CompressionService {
  private logCallback: (message: string) => void = () => {}

  setLogCallback(callback: (message: string) => void) {
    this.logCallback = callback
  }

  async executeCommand(options: CompressionOptions): Promise<boolean> {
    const { 
      rustExecutablePath, 
      unzip, 
      target, 
      sources, 
      format, 
      method, 
      password, 
      debug, 
      volumeSize, 
      selectedFiles,
      useScript,
      scriptFile,
      virtualEnvDir
    } = options

    if (!rustExecutablePath) {
      this.logCallback("Error: Rust executable path not configured.")
      return false
    }

    // Build command arguments
    const args: string[] = []
    
    // 添加debug标志（如果启用）
    if (debug) {
      args.push("--debug")
    }

    // 如果使用脚本，使用脚本子命令
    if (useScript && scriptFile) {
      // 添加script子命令
      args.push("script")
      
      // 添加脚本选项
      if (unzip) {
        args.push("--unzip")
      }
      
      // 添加脚本文件路径
      args.push("--script-file", scriptFile)
      
      // 添加虚拟环境目录（如果指定）
      if (virtualEnvDir) {
        args.push("--virtual-env-dir", virtualEnvDir)
      }
      
      // 添加源文件（被选中的文件）
      args.push(...sources)
      
      return this.runCommand(rustExecutablePath, args);
    }
    
    // 常规压缩/解压命令逻辑，使用新的子命令结构
    if (unzip) {
      // 使用extract子命令
      args.push("extract");
      
      // 添加target参数 (解压目标位置)
      args.push(target);
      
      // 添加源文件
      args.push(...sources);
      
      // 添加格式参数（如果指定）
      if (format) {
        args.push("--format", format);
      }
      
      // 添加密码参数（如果指定）
      if (password) {
        args.push("--password", password);
      }
      
      // 添加使用外部工具选项
      args.push("--use-external");
      
      // 添加特定文件参数（如果指定）
      if (selectedFiles && selectedFiles.length > 0) {
        args.push("--files");
        args.push(...selectedFiles);
      }
    } else {
      // 使用compress子命令
      args.push("compress");
      
      // 添加目标文件路径
      args.push(target);
      
      // 添加源文件
      args.push(...sources);
      
      // 添加格式参数（如果指定）
      if (format) {
        args.push("--format", format);
      }
      
      // 添加压缩方法参数（如果指定）
      if (method) {
        args.push("--method", method);
      }
      
      // 添加密码参数（如果指定）
      if (password) {
        args.push("--password", password);
      }
      
      // 添加使用外部工具选项
      args.push("--use-external");
      
      // 添加分卷大小参数（如果指定）
      if (volumeSize) {
        args.push("--volume-size", volumeSize.toString());
      }
    }

    return this.runCommand(rustExecutablePath, args);
  }
  
  // 提取命令执行逻辑为单独方法以避免代码重复
  private async runCommand(executablePath: string, args: string[]): Promise<boolean> {
    try {
      this.logCallback(`Executing: ${executablePath} ${args.join(" ")}`)

      return new Promise((resolve, reject) => {
        const process = window.electron.childProcess.spawn(executablePath, args)

        process.stdout.on("data", (data: string) => {
          this.logCallback(data)
        })

        process.stderr.on("data", (data: string) => {
          this.logCallback(data)
        })

        process.on("close", (code: number | undefined) => {
          if (code === 0) {
            this.logCallback(`Process completed successfully with code ${code}`)
            resolve(true)
          } else {
            this.logCallback(`Process failed with code ${code || 'unknown'}`)
            resolve(false)
          }
        })

        process.on("error", (err: any) => {
          this.logCallback(`Process error: ${err.message || err}`)
          reject(err)
        })
      })
    } catch (error) {
      this.logCallback(`Error executing command: ${error}`)
      return false
    }
  }
}

export const compressionService = new CompressionService()
