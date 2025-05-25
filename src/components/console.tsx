"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Terminal, Trash2, Send, Copy, Download, Pause, Play, ChevronDown, ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"

// 日志条目类型
interface LogEntry {
  id: string
  timestamp: Date
  level: "info" | "error" | "warning" | "success" | "command" | "output"
  message: string
  indent?: number
}

// 控制台属性
interface ConsoleProps {
  isOpen: boolean
  onToggle: () => void
  logs?: string[]
  onClear?: () => void
  onExecuteCommand?: (command: string) => Promise<void>
  onRefresh?: () => void
}

// 日志级别颜色映射
const LOG_LEVEL_COLORS = {
  info: "text-blue-400",
  error: "text-red-400", 
  warning: "text-yellow-400",
  success: "text-green-400",
  command: "text-purple-400",
  output: "text-gray-300"
}

// 日志级别标签
const LOG_LEVEL_BADGES = {
  info: "INFO",
  error: "ERR",
  warning: "WARN", 
  success: "OK",
  command: "CMD",
  output: "OUT"
}

export function Console({ isOpen, onToggle, logs = [], onClear, onExecuteCommand }: ConsoleProps) {
  const { t } = useTranslation()
  
  // 状态管理
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [commandInput, setCommandInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isPaused, setIsPaused] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const [filter, setFilter] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [processedLogsCount, setProcessedLogsCount] = useState(0) // 跟踪已处理的日志数量
  
  // 新增：当前工作目录和自动补全状态
  const [currentWorkingDir, setCurrentWorkingDir] = useState<string>(() => {
    // 使用 Electron 提供的真实系统路径
    try {
      console.log('🔧 Initializing current working directory...') // 调试日志
      
      if (typeof window !== 'undefined' && (window.electron as any)?.os?.cwd) {
        const cwd = (window.electron as any).os.cwd()
        console.log('📂 Got CWD from Electron:', cwd) // 调试日志
        
        // 检查路径是否有效
        if (cwd && typeof cwd === 'string' && !cwd.includes('??') && !cwd.includes('undefined')) {
          return cwd
        } else {
          console.warn('⚠️ Invalid CWD, trying homedir...') // 调试日志
        }
      }
      
      if (typeof window !== 'undefined' && (window.electron as any)?.os?.homedir) {
        const homedir = (window.electron as any).os.homedir()
        console.log('🏠 Got homedir from Electron:', homedir) // 调试日志
        
        // 检查路径是否有效
        if (homedir && typeof homedir === 'string' && !homedir.includes('??') && !homedir.includes('undefined')) {
          return homedir
        } else {
          console.warn('⚠️ Invalid homedir, using fallback...') // 调试日志
        }
      }
      
      console.log('🔄 Using fallback directory: /home/user') // 调试日志
      return "/home/user"
    } catch (error) {
      console.error('❌ Error initializing working directory:', error) // 调试日志
      return "/home/user"
    }
  })
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  
  // 添加日志的辅助函数
  const addLog = useCallback((message: string, level: LogEntry["level"] = "info") => {
    const logEntry: LogEntry = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message
    }
    setLogEntries(prev => [...prev, logEntry])
  }, [])
  
  // 路径规范化函数
  const normalizePath = useCallback((path: string): string => {
    // 处理空路径
    if (!path || path === '.') return '.'
    
    // 分割路径为组件
    const parts = path.split('/').filter(part => part !== '' && part !== '.')
    const normalizedParts: string[] = []
    const isAbsolute = path.startsWith('/')
    
    for (const part of parts) {
      if (part === '..') {
        // 处理 .. (上级目录)
        if (normalizedParts.length > 0 && normalizedParts[normalizedParts.length - 1] !== '..') {
          normalizedParts.pop()
        } else if (!isAbsolute) {
          // 只有在相对路径时才保留 ..
          normalizedParts.push('..')
        }
        // 绝对路径中的 .. 在根目录时被忽略
      } else {
        normalizedParts.push(part)
      }
    }
    
    // 重建路径
    let result = isAbsolute ? '/' : ''
    result += normalizedParts.join('/')
    
    // 处理特殊情况
    if (result === '' && !isAbsolute) {
      result = '.'
    } else if (result === '') {
      result = '/'
    }
    
    return result
  }, [])
  
  // 解析绝对路径
  const resolvePath = useCallback((path: string, basePath: string = currentWorkingDir): string => {
    if (path.startsWith('/')) {
      // 已经是绝对路径，直接规范化
      return normalizePath(path)
    }
    
    // 相对路径，与基础路径合并
    const combinedPath = basePath.endsWith('/') 
      ? basePath + path 
      : basePath + '/' + path
    
    return normalizePath(combinedPath)
  }, [currentWorkingDir, normalizePath])
  
  // 解析单条日志
  const parseLogEntry = useCallback((rawLog: string, index: number): LogEntry => {
    const id = `log-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date()
    
    // 清理ANSI转义序列，但保留空格和缩进
    let message = rawLog.replace(/\u001b\[[0-9;]*m/g, '')
    
    // 检测缩进级别（用于视觉层次）
    let indent = 0
    const indentMatch = message.match(/^(\s+)/)
    if (indentMatch) {
      indent = Math.floor(indentMatch[1].length / 2) // 每2个空格为一级缩进
    }
    
    // 不要移除前导空格，保留原始格式
    // message = message.trim() // 删除这行，保留缩进
    
    // 只移除尾部空格
    message = message.trimEnd()
    
    // 检测日志级别
    let level: LogEntry["level"] = "info"
    const trimmedMessage = message.trim() // 用于级别检测的临时变量
    if (trimmedMessage.startsWith('$') || trimmedMessage.includes('Command:')) {
      level = "command"
    } else if (trimmedMessage.toLowerCase().includes('error') || trimmedMessage.toLowerCase().includes('failed')) {
      level = "error"
    } else if (trimmedMessage.toLowerCase().includes('warning') || trimmedMessage.toLowerCase().includes('warn')) {
      level = "warning"
    } else if (trimmedMessage.toLowerCase().includes('success') || trimmedMessage.toLowerCase().includes('completed')) {
      level = "success"
    } else if (trimmedMessage.startsWith('>') || trimmedMessage.includes('Output:')) {
      level = "output"
    }
    
    return {
      id,
      timestamp,
      level,
      message,
      indent: Math.min(indent, 5) // 最大5级缩进
    }
  }, [])
  
  // 处理新日志 - 只处理新增的日志
  useEffect(() => {
    if (isPaused || logs.length <= processedLogsCount) return
    
    // 只处理新增的日志
    const newLogs = logs.slice(processedLogsCount)
    const newEntries = newLogs.map((log, index) => parseLogEntry(log, processedLogsCount + index))
    
    if (newEntries.length > 0) {
      setLogEntries(prev => {
        const combined = [...prev, ...newEntries]
        // 限制最大日志数量
        return combined.length > 1000 ? combined.slice(-1000) : combined
      })
      
      // 更新已处理的日志数量
      setProcessedLogsCount(logs.length)
      
      // 自动滚动到底部（如果用户没有手动滚动）
      setTimeout(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
        if (scrollContainer) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 50
          if (isNearBottom) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight
          }
        }
      }, 10)
    }
  }, [logs, processedLogsCount, isPaused, parseLogEntry])
  
  // 过滤日志
  const filteredLogs = useMemo(() => {
    return logEntries.filter(entry => {
      if (selectedLevel !== "all" && entry.level !== selectedLevel) {
        return false
      }
      if (filter && !entry.message.toLowerCase().includes(filter.toLowerCase())) {
        return false
      }
      return true
    })
  }, [logEntries, selectedLevel, filter])
  
  // 拖拽调整高度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY
      setConsoleHeight(Math.max(200, Math.min(newHeight, window.innerHeight * 0.8)))
    }
    
    const handleMouseUp = () => setIsDragging(false)
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])
  
  // 命令自动补全
  const getCommandSuggestions = useCallback(async (input: string): Promise<string[]> => {
    console.log('🔍 Getting suggestions for input:', input) // 调试日志
    
    const commonCommands = [
      'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'chmod', 'chown',
      'tar', 'zip', 'unzip', '7z', 'gzip', 'gunzip',
      'clear', 'pause', 'resume', 'help', 'exit',
      'git', 'npm', 'pnpm', 'yarn', 'node', 'python', 'python3', 'pip', 'pip3',
      'docker', 'docker-compose', 'kubectl', 'helm'
    ]
    
    const parts = input.trim().split(' ')
    const currentWord = parts[parts.length - 1]
    
    console.log('🔍 Input parts:', parts, 'Current word:', currentWord) // 调试日志
    
    if (parts.length === 1) {
      // 补全命令名
      const cmdSuggestions = commonCommands.filter(cmd => cmd.startsWith(currentWord.toLowerCase()))
      console.log('📝 Command suggestions:', cmdSuggestions) // 调试日志
      return cmdSuggestions
    } else if (parts[0] === 'cd' && parts.length === 2) {
      // cd 命令的路径补全
      console.log('📁 Starting directory completion for:', currentWord) // 调试日志
      
      try {
        // 获取当前输入的路径
        let searchPath = currentWord
        let basePath = currentWorkingDir
        
        console.log('📂 Initial search path:', searchPath, 'Base path:', basePath) // 调试日志
        
        if (searchPath.startsWith('/')) {
          // 绝对路径
          const lastSlash = searchPath.lastIndexOf('/')
          basePath = searchPath.substring(0, lastSlash) || '/'
          searchPath = searchPath.substring(lastSlash + 1)
          console.log('🔗 Absolute path - Base:', basePath, 'Search:', searchPath) // 调试日志
        } else if (searchPath.includes('/')) {
          // 相对路径包含目录
          const lastSlash = searchPath.lastIndexOf('/')
          const relativePath = searchPath.substring(0, lastSlash)
          basePath = resolvePath(relativePath, currentWorkingDir)
          searchPath = searchPath.substring(lastSlash + 1)
          console.log('🔗 Relative path - Base:', basePath, 'Search:', searchPath) // 调试日志
        }
        
        // 读取目录内容
        if (window.electron?.fs?.readDirectory) {
          console.log('📖 Reading directory:', basePath) // 调试日志
          
          const entries = await window.electron.fs.readDirectory(basePath)
          console.log('📋 Directory entries:', entries.length, entries.map(e => e.name)) // 调试日志
          
          const directories = entries
            .filter(entry => entry.type === 'folder') // 注意：这里应该是 'folder' 而不是 'directory'
            .map(entry => entry.name)
            .filter(name => name.startsWith(searchPath))
            .map(name => {
              if (currentWord.includes('/')) {
                const prefix = currentWord.substring(0, currentWord.lastIndexOf('/') + 1)
                return prefix + name
              }
              return name
            })
          
          console.log('📁 Filtered directories:', directories) // 调试日志
          
          // 添加特殊目录
          const specialDirs = ['~', '..', './']
          const filteredSpecial = specialDirs.filter(dir => dir.startsWith(searchPath))
          
          const allSuggestions = [...filteredSpecial, ...directories].slice(0, 10)
          console.log('✅ Final suggestions:', allSuggestions) // 调试日志
          
          return allSuggestions
        }
      } catch (error) {
        console.warn('❌ Directory completion failed:', error)
      }
      
      // 回退到静态建议
      const pathSuggestions = [
        '~', '/', './', '../',
        '~/Downloads', '~/Documents', '~/Desktop', '~/Pictures',
        '/home', '/tmp', '/var', '/usr', '/opt'
      ]
      const fallbackSuggestions = pathSuggestions.filter(path => path.startsWith(currentWord))
      console.log('🔄 Fallback suggestions:', fallbackSuggestions) // 调试日志
      return fallbackSuggestions
    }
    
    console.log('❌ No suggestions available') // 调试日志
    return []
  }, [currentWorkingDir, resolvePath])
  
  // 处理输入变化和自动补全
  const handleInputChange = useCallback(async (value: string) => {
    setCommandInput(value)
    
    if (value.trim()) {
      const suggestions = await getCommandSuggestions(value)
      setSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
      setSelectedSuggestion(-1)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }, [getCommandSuggestions])
  
  // 应用建议
  const applySuggestion = useCallback((suggestion: string) => {
    const parts = commandInput.trim().split(' ')
    parts[parts.length - 1] = suggestion
    const newCommand = parts.join(' ')
    setCommandInput(newCommand + ' ')
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedSuggestion(-1)
    
    // 重新聚焦输入框
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [commandInput])
  
  // 验证目录是否存在
  const validateDirectory = useCallback(async (path: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating directory:', path) // 调试日志
      
      // 首先检查路径是否包含无效字符
      if (path.includes('??') || path.includes('undefined') || path.includes('null')) {
        console.log('❌ Invalid path contains special characters:', path)
        return false
      }
      
      if (window.electron?.fs?.readDirectory) {
        try {
          console.log('🔧 Using Electron FS API to validate:', path)
          const entries = await window.electron.fs.readDirectory(path)
          console.log('✅ Directory validation successful:', path, `(${entries.length} entries)`)
          return true
        } catch (fsError: any) {
          console.log('❌ File system error details:', {
            path,
            error: fsError,
            code: fsError?.code,
            message: fsError?.message
          })
          
          // 明确检查错误类型
          if (fsError?.code === 'ENOENT') {
            console.log('❌ Directory does not exist:', path)
            return false
          } else if (fsError?.code === 'EACCES') {
            console.log('❌ Permission denied:', path)
            return false
          } else {
            console.log('❌ Other file system error:', path, fsError)
            return false
          }
        }
      } else {
        console.warn('⚠️ No file system API available for validation:', path)
        
        // 没有文件系统API时，进行更严格的路径检查
        if (!path || path.trim() === '' || path.includes('??')) {
          console.log('❌ Invalid path format:', path)
          return false
        }
        
        // 对于常见的系统路径，我们可以做一些基本检查
        const commonValidPaths = [
          '/home', '/tmp', '/var', '/usr', '/opt', '/etc', '/bin', '/sbin',
          '/home/user', '/home/cagliostro'
        ]
        
        // 检查是否是常见的有效路径或其子路径
        const isCommonPath = commonValidPaths.some(validPath => 
          path === validPath || path.startsWith(validPath + '/')
        )
        
        if (isCommonPath) {
          console.log('📁 Assuming common system path is valid:', path)
          return true
        } else {
          console.log('❌ Unknown path, cannot validate without API:', path)
          return false
        }
      }
    } catch (error) {
      console.log('❌ Directory validation failed with exception:', path, error)
      return false
    }
  }, [])
  
  // 命令处理
  const handleCommand = useCallback(async () => {
    if (!commandInput.trim()) return

    const input = commandInput.trim()
    const parts = input.split(' ')
    const command = parts[0]
    const args = parts.slice(1)
    
    // 添加到历史
    setCommandHistory(prev => {
      const newHistory = [...prev.filter(cmd => cmd !== input), input]
      return newHistory.slice(-50) // 保留最近50条
    })
    setHistoryIndex(-1)

    // 内置命令处理
    if (command === 'clear') {
      setLogEntries([])
      setProcessedLogsCount(0)
      if (onClear) onClear()
      setCommandInput("")
      return
    }

    if (command === 'pause') {
      setIsPaused(true)
      setCommandInput("")
      return
    }

    if (command === 'resume') {
      setIsPaused(false)
      setCommandInput("")
      return
    }

    if (command === 'pwd') {
      // 显示当前工作目录
      const logEntry: LogEntry = {
        id: `pwd-${Date.now()}`,
        timestamp: new Date(),
        level: "output",
        message: currentWorkingDir
      }
      setLogEntries(prev => [...prev, logEntry])
      setCommandInput("")
      return
    }

    // cd 命令处理
    if (command === 'cd') {
      let targetPath = ''
      
      console.log('🚀 CD command started, args:', args) // 调试日志
      
      if (!args.length || args[0] === '~') {
        // cd 或 cd ~ - 回到家目录
        try {
          targetPath = (window.electron as any)?.os?.homedir?.() || "/home/user"
          console.log('🏠 Using home directory:', targetPath) // 调试日志
        } catch {
          targetPath = "/home/user"
          console.log('🏠 Fallback to default home:', targetPath) // 调试日志
        }
      } else {
        // 处理其他路径（相对或绝对）
        const inputPath = args[0]
        console.log('📁 Input path:', inputPath) // 调试日志
        console.log('📂 Current working dir:', currentWorkingDir) // 调试日志
        
        if (inputPath.startsWith('/')) {
          // 绝对路径 - 直接规范化
          targetPath = normalizePath(inputPath)
          console.log('🔗 Absolute path normalized:', inputPath, '→', targetPath) // 调试日志
        } else {
          // 相对路径 - 基于当前目录解析
          targetPath = resolvePath(inputPath, currentWorkingDir)
          console.log('🔗 Relative path resolved:', inputPath, '+', currentWorkingDir, '→', targetPath) // 调试日志
        }
      }
      
      console.log('🎯 Final target path:', targetPath) // 调试日志
      
      // 验证目录是否存在
      try {
        const isValid = await validateDirectory(targetPath)
        if (isValid) {
          setCurrentWorkingDir(targetPath)
          addLog(`Changed directory to: ${targetPath}`, 'info')
          
          // 显示路径规范化信息（如果路径被规范化了）
          if (args.length > 0 && args[0] !== targetPath && !args[0].startsWith('/')) {
            addLog(`Path normalized: ${args[0]} → ${targetPath}`, 'info')
          }
        } else {
          addLog(`cd: ${args[0] || '~'}: No such file or directory`, 'error')
        }
      } catch (error) {
        console.error('❌ CD validation error:', error) // 调试日志
        addLog(`cd: ${args[0] || '~'}: Permission denied or directory not accessible`, 'error')
      }
      
      // 清除输入缓存
      setCommandInput("")
      return
    }

    // 清空输入
    setCommandInput("")

    // 执行外部命令（在当前工作目录下）
    if (onExecuteCommand) {
      try {
        // 构造带 cd 的命令
        const fullCommand = currentWorkingDir !== '/' 
          ? `cd "${currentWorkingDir}" && ${input}`
          : input
        await onExecuteCommand(fullCommand)
      } catch (error) {
        console.error('Command execution failed:', error)
      }
    }
  }, [commandInput, onClear, onExecuteCommand, currentWorkingDir, normalizePath, resolvePath, addLog, validateDirectory])
  
  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && selectedSuggestion >= 0) {
        // 应用选中的建议
        applySuggestion(suggestions[selectedSuggestion])
      } else {
        handleCommand()
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      console.log('⌨️ Tab pressed - Current suggestions:', suggestions.length, 'Show suggestions:', showSuggestions) // 调试日志
      
      if (showSuggestions && suggestions.length > 0) {
        if (selectedSuggestion >= 0) {
          // 应用当前选中的建议
          console.log('✅ Applying selected suggestion:', suggestions[selectedSuggestion]) // 调试日志
          applySuggestion(suggestions[selectedSuggestion])
        } else {
          // 选中第一个建议
          console.log('🎯 Selecting first suggestion') // 调试日志
          setSelectedSuggestion(0)
        }
      } else {
        // 触发补全
        console.log('🔍 Triggering completion for:', commandInput) // 调试日志
        
        // 强制重新获取建议
        const getSuggestionsAndShow = async () => {
          const newSuggestions = await getCommandSuggestions(commandInput)
          console.log('📋 Got new suggestions:', newSuggestions) // 调试日志
          
          if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions)
            setShowSuggestions(true)
            setSelectedSuggestion(0) // 自动选中第一个
          } else {
            console.log('❌ No suggestions found') // 调试日志
          }
        }
        
        getSuggestionsAndShow()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowSuggestions(false)
      setSuggestions([])
      setSelectedSuggestion(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSuggestions) {
        // 在建议中向上导航
        setSelectedSuggestion(prev => 
          prev <= 0 ? suggestions.length - 1 : prev - 1
        )
      } else if (commandHistory.length > 0) {
        // 历史命令导航
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
        setHistoryIndex(newIndex)
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex])
        // 清除建议
        setShowSuggestions(false)
        setSuggestions([])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSuggestions) {
        // 在建议中向下导航
        setSelectedSuggestion(prev => 
          prev >= suggestions.length - 1 ? 0 : prev + 1
        )
      } else if (historyIndex > 0) {
        // 历史命令导航
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex])
        // 清除建议
        setShowSuggestions(false)
        setSuggestions([])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommandInput("")
        // 清除建议
        setShowSuggestions(false)
        setSuggestions([])
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLogEntries([])
      setProcessedLogsCount(0)
      if (onClear) onClear()
    }
  }, [handleCommand, commandHistory, historyIndex, onClear, showSuggestions, suggestions, selectedSuggestion, applySuggestion, commandInput, handleInputChange])
  
  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [])
  
  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
  }, [])
  
  // 复制日志
  const copyLogs = useCallback(() => {
    const text = filteredLogs.map(entry => {
      const timestamp = `[${entry.timestamp.toLocaleTimeString()}]`
      const level = `[${entry.level.toUpperCase()}]`
      const indent = '  '.repeat(entry.indent || 0)
      return `${timestamp} ${level} ${indent}${entry.message}`
    }).join('\n')
    
    navigator.clipboard.writeText(text)
  }, [filteredLogs])
  
  // 下载日志
  const downloadLogs = useCallback(() => {
    const text = filteredLogs.map(entry => {
      const timestamp = entry.timestamp.toISOString()
      const indent = '  '.repeat(entry.indent || 0)
      return `${timestamp} [${entry.level.toUpperCase()}] ${indent}${entry.message}`
    }).join('\n')
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `console-logs-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredLogs])
  
  // 渲染日志条目
  const renderLogEntry = useCallback((entry: LogEntry) => {
    return (
      <div
        key={entry.id}
        className="flex items-start gap-2 py-1 hover:bg-muted/50 transition-colors text-sm"
      >
        <span className="text-xs text-muted-foreground font-mono shrink-0 w-20">
          {entry.timestamp.toLocaleTimeString()}
        </span>
        
        <Badge 
          variant="outline" 
          className={`text-xs shrink-0 ${LOG_LEVEL_COLORS[entry.level]}`}
        >
          {LOG_LEVEL_BADGES[entry.level]}
        </Badge>
        
        <pre 
          className={`font-mono text-sm break-all whitespace-pre-wrap ${LOG_LEVEL_COLORS[entry.level]} m-0 p-0`}
          style={{ fontFamily: 'inherit' }}
        >
          {entry.message}
        </pre>
      </div>
    )
  }, [])
  
  if (!isOpen) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between bg-background border-t p-2">
          <Button variant="outline" size="sm" onClick={onToggle}>
            <Terminal className="mr-2 h-4 w-4" />
            控制台
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* 拖拽条 */}
      <div
        className="h-1 w-full cursor-ns-resize hover:bg-primary/20 transition-colors bg-border"
        onMouseDown={handleMouseDown}
      />
      
      {/* 控制台主体 */}
      <div 
        className="bg-background border-t flex flex-col"
        style={{ height: `${consoleHeight}px` }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-2 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <Terminal className="mr-2 h-4 w-4" />
              控制台
            </Button>
            
            <Separator orientation="vertical" className="h-4" />
            
            <Badge variant="secondary" className="text-xs">
              {filteredLogs.length} 条日志
            </Badge>
            
            {isPaused && (
              <Badge variant="destructive" className="text-xs">
                已暂停
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* 级别过滤 */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="text-xs bg-background border rounded px-2 py-1"
            >
              <option value="all">全部</option>
              <option value="command">命令</option>
              <option value="output">输出</option>
              <option value="error">错误</option>
              <option value="warning">警告</option>
              <option value="success">成功</option>
              <option value="info">信息</option>
            </select>
            
            {/* 搜索 */}
            <Input
              placeholder="过滤..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-32 h-8 text-xs"
            />
            
            <Separator orientation="vertical" className="h-4" />
            
            {/* 控制按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "恢复" : "暂停"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              title="跳转到顶部"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToBottom}
              title="跳转到底部"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLogEntries([])
                setProcessedLogsCount(0)
                if (onClear) onClear()
              }}
              title="清空"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={copyLogs}
              title="复制"
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadLogs}
              title="下载"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* 日志区域 - 可滚动 */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div ref={logContainerRef} className="p-2">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(renderLogEntry)
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无日志</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* 命令输入区 - 固定在底部 */}
        <div className="border-t bg-background shrink-0">
          {/* 自动补全建议 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="border-b bg-muted/20 max-h-32 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-3 py-1 text-sm font-mono cursor-pointer transition-colors ${
                    index === selectedSuggestion 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => applySuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
          
          {/* 当前工作目录显示 */}
          <div className="px-2 py-1 text-xs text-muted-foreground bg-muted/10 border-b">
            <span className="font-mono">工作目录: {currentWorkingDir}</span>
          </div>
          
          {/* 命令输入 */}
          <div className="p-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-mono font-bold">$</span>
              <Input
                ref={inputRef}
                value={commandInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入命令... (Tab 补全, ↑↓ 浏览历史/建议, Ctrl+L 清空)"
                className="flex-1 font-mono"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommand}
                disabled={!commandInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}