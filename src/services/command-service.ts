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

            // 智能解析命令，正确处理带引号的参数
            const { executable, args } = this.parseCommand(command)

            return new Promise((resolve, reject) => {
                // 使用解析后的参数直接传递给 spawn
                const process = window.electron.childProcess.spawn(executable, args)

                process.stdout.on("data", (data: string) => {
                    console.log(data)
                    this.logCallback(data)
                    this.logs.push(data)
                })

                process.stderr.on("data", (data: string) => {
                    this.logCallback(data)
                    this.logs.push(data)
                })

                process.on("close", (code: number | undefined) => {
                    if (code === 0) {
                        this.logCallback(`Command completed with code ${code}`)
                        this.logs.push(`Command completed with code ${code}`)
                        resolve(true)
                    } else {
                        this.logCallback(`Command failed with code ${code || 'unknown'}`)
                        this.logs.push(`Command failed with code ${code || 'unknown'}`)
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

    // 智能命令解析器，正确处理引号
    private parseCommand(command: string): { executable: string; args: string[] } {
        const args: string[] = []
        let current = ''
        let inQuotes = false
        let quoteChar = ''
        
        for (let i = 0; i < command.length; i++) {
            const char = command[i]
            
            if (!inQuotes && (char === '"' || char === "'")) {
                // 开始引号
                inQuotes = true
                quoteChar = char
            } else if (inQuotes && char === quoteChar) {
                // 结束引号
                inQuotes = false
                quoteChar = ''
            } else if (!inQuotes && char === ' ') {
                // 空格分隔符（不在引号内）
                if (current.trim()) {
                    args.push(current.trim())
                    current = ''
                }
            } else {
                // 普通字符
                current += char
            }
        }
        
        // 添加最后一个参数
        if (current.trim()) {
            args.push(current.trim())
        }
        
        const executable = args.shift() || ''
        return { executable, args }
    }
}

export const commandService = new CommandService()
