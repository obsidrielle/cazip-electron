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
}

export class CompressionService {
  private logCallback: (message: string) => void = () => {}

  setLogCallback(callback: (message: string) => void) {
    this.logCallback = callback
  }

  async executeCommand(options: CompressionOptions): Promise<boolean> {
    const { rustExecutablePath, unzip, target, sources, format, method, password, debug, volumeSize, selectedFiles } =
        options

    if (!rustExecutablePath) {
      this.logCallback("Error: Rust executable path not configured.")
      return false
    }

    // Build command arguments
    const args: string[] = []

    // Add target path
    args.push(target)

    // Add source files with full paths
    args.push(...sources)

    // Add format option if specified
    if (format) {
      args.push("--format", format)
    }

    // Add method option if specified
    if (method) {
      args.push("--method", method)
    }

    // Add password if specified
    if (password) {
      args.push("--password", password)
    }

    // Add unzip flag if extracting
    if (unzip) {
      args.push("--unzip")
    }

    // Add debug flag if enabled
    if (debug) {
      args.push("--debug")
    }

    // Always use external tools
    args.push("--use-external")

    // Add volume size if splitting archives
    if (volumeSize) {
      args.push("--volume-size", volumeSize.toString())
    }

    // Add selected files if specified (for selective extraction)
    if (selectedFiles && selectedFiles.length > 0) {
      args.push("--files")
      args.push(...selectedFiles)
    }

    try {
      this.logCallback(`Executing: ${rustExecutablePath} ${args.join(" ")}`)

      return new Promise((resolve, reject) => {
        const process = window.electron.childProcess.spawn(rustExecutablePath, args)

        process.stdout.on("data", (data: string) => {
          this.logCallback(data)
        })

        process.stderr.on("data", (data: string) => {
          this.logCallback(data)
        })

        process.on("close", (code: number) => {
          if (code === 0) {
            this.logCallback(`Process completed successfully with code ${code}`)
            resolve(true)
          } else {
            this.logCallback(`Process failed with code ${code}`)
            resolve(false)
          }
        })

        process.on("error", (err: Error) => {
          this.logCallback(`Process error: ${err.message}`)
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
