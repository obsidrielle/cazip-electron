export class CommandService {
    private logCallback: (message: string) => void = () => {}
    private logs: string[] = []

    setLogCallback(callback: (message: string) => void) {
        this.logCallback = callback
    }

    getLogs(): string[] {
        return this.logs
    }

    clearLogs(): void {
        this.logs = []
    }

    // 修改 executeCommand 方法，确保命令参数处理正确
    async executeCommand(command: string): Promise<boolean> {
        try {
            // 记录命令
            this.logCallback(`$ ${command}`)
            this.logs.push(`$ ${command}`)

            // 简单地分割命令为可执行文件和参数，不尝试处理引号
            const parts = command.split(" ")
            const executable = parts[0]
            const args = parts.slice(1)

            // 移除参数中的引号
            const cleanArgs = args.map((arg) => {
                // 如果参数以引号开始和结束，则移除引号
                if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                    return arg.substring(1, arg.length - 1)
                }
                return arg
            })

            return new Promise((resolve, reject) => {
                // 不要在这里添加引号，让 childProcess.spawn 处理参数
                const process = window.electron.childProcess.spawn(executable, cleanArgs)

                process.stdout.on("data", (data: string) => {
                    console.log(data)
                    this.logCallback(data)
                    this.logs.push(data)
                })

                process.stderr.on("data", (data: string) => {
                    this.logCallback(data)
                    this.logs.push(data)
                })

                process.on("close", (code: number) => {
                    if (code === 0) {
                        this.logCallback(`Command completed with code ${code}`)
                        this.logs.push(`Command completed with code ${code}`)
                        resolve(true)
                    } else {
                        this.logCallback(`Command failed with code ${code}`)
                        this.logs.push(`Command failed with code ${code}`)
                        resolve(false)
                    }
                })

                process.on("error", (err: Error) => {
                    this.logCallback(`Error executing command: ${err.message}`)
                    this.logs.push(`Error executing command: ${err.message}`)
                    reject(err)
                })
            })
        } catch (error) {
            this.logCallback(`Error executing command: ${error}`)
            this.logs.push(`Error executing command: ${error}`)
            return false
        }
    }
}

export const commandService = new CommandService()
