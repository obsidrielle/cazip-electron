"use client"

import type React from "react"

import { useState, useEffect, useRef, type KeyboardEvent, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Terminal, Trash2, Send, Copy, Download, X, ChevronUp, ChevronDown, Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Input } from "./ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useTheme } from "next-themes"

// 控制台主题类型
type ConsoleTheme = "system" | "dark" | "light"

// 日志条目类型
interface LogEntry {
  id: number
  timestamp: string
  type: "info" | "error" | "warning" | "success" | "command" | "result"
  text: string
  isNew: boolean
}

// 命令历史记录条目
interface CommandHistoryEntry {
  command: string
  timestamp: string
}

// 常用命令列表（用于自动补全）
const COMMON_COMMANDS = [
  "ls", "cd", "mkdir", "rm", "cp", "mv", "cat", "grep", "find", "pwd",
  "clear", "echo", "touch", "chmod", "chown", "tar", "zip", "unzip", "ps",
  "kill", "df", "du", "free", "top", "ssh", "scp", "wget", "curl", "ping",
  "apt-get", "apt", "yum", "npm", "git", "node", "python", "docker", "help"
]

// 控制台属性接口
interface ConsoleProps {
  isOpen: boolean
  onToggle: () => void
  logs?: string[]
  onClear?: () => void
  onExecuteCommand?: (command: string) => Promise<void>
  onRefresh?: () => void
}

export function Console({ isOpen, onToggle, logs = [], onClear, onExecuteCommand, onRefresh }: ConsoleProps) {
  const { t } = useTranslation()
  const { theme: systemTheme, setTheme: setSystemTheme } = useTheme() // 获取系统主题
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [enhancedLogs, setEnhancedLogs] = useState<LogEntry[]>([])
  const [commandInput, setCommandInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeTab, setActiveTab] = useState("terminal")
  const inputRef = useRef<HTMLInputElement>(null)
  const [consoleHeight, setConsoleHeight] = useState(300) // 增加默认高度
  const [isDragging, setIsDragging] = useState(false)
  const [theme, setTheme] = useState<ConsoleTheme>((systemTheme as ConsoleTheme) || "system")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(14) // 添加字体大小设置
  const [isVisible, setIsVisible] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false) // 跟踪用户是否滚动

  // 记录时间戳
  const getTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString()
  }

  // 清除日志
  function handleClearLogs() {
    if (onClear) {
      onClear()
      setEnhancedLogs([])
    }
  }

  // 解析日志行
  const parseLogLine = (line: string): { timestamp?: string, restContent: string } => {
    // 先清理可能的双重时间戳
    let cleanedLine = line;

    // 匹配格式为 [18:30:06] 18:30:06: 的双时间戳
    const doubleTimestampRegex = /^\[(\d{2}:\d{2}:\d{2})\]\s*(\d{2}:\d{2}:\d{2}):/;
    if (doubleTimestampRegex.test(cleanedLine)) {
      // 只保留第一个时间戳
      cleanedLine = cleanedLine.replace(doubleTimestampRegex, '[$1]');
    }

    // 匹配单个时间戳格式，如 [18:18:22]
    const timeMatch = cleanedLine.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*/);
    if (timeMatch) {
      return {
        timestamp: timeMatch[1],
        restContent: cleanedLine.substring(timeMatch[0].length)
      };
    }

    // 匹配没有方括号的时间戳，如 18:18:22:
    const plainTimeMatch = cleanedLine.match(/^(\d{2}:\d{2}:\d{2}):\s*/);
    if (plainTimeMatch) {
      return {
        timestamp: plainTimeMatch[1],
        restContent: cleanedLine.substring(plainTimeMatch[0].length)
      };
    }

    return { restContent: cleanedLine };
  }

  // 格式化日志文本（添加语法高亮）
  const formatLogText = (text: string) => {
    if (!text) return text;

    // 检查并清理双重时间戳
    let cleanedText = text;

    // 匹配格式为 [18:30:06] 18:30:06: 的双时间戳模式
    const doubleTimestampRegex = /^\[(\d{2}:\d{2}:\d{2})\]\s*(\d{2}:\d{2}:\d{2}):/;
    if (doubleTimestampRegex.test(cleanedText)) {
      // 只保留第一个时间戳，删除第二个
      cleanedText = cleanedText.replace(doubleTimestampRegex, '[' + '$1' + ']:');
    }

    // 匹配格式为 18:30:06: 的独立时间戳（没有方括号的）
    const singleTimestampRegex = /^(\d{2}:\d{2}:\d{2}):/;
    if (singleTimestampRegex.test(cleanedText)) {
      // 删除这个时间戳
      cleanedText = cleanedText.replace(singleTimestampRegex, '');
    }

    // 判断是否是时间戳格式 [18:18:22]
    const timeMatch = cleanedText.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
    if (timeMatch) {
      // 对时间戳进行着色
      const timestamp = timeMatch[0];
      const restText = cleanedText.substring(timestamp.length);
      return <><span className="text-cyan-400">{timestamp}</span>{formatLogText(restText)}</>;
    }

    // 高亮文件名和路径
    if (cleanedText.match(/\.([a-zA-Z0-9]+)($|\s|:)/)) {
      const parts = [];
      let lastIndex = 0;
      const regex = /([a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]{1,10})($|\s|:|,)/g;
      let match;

      while ((match = regex.exec(cleanedText)) !== null) {
        // 添加匹配前的文本
        if (match.index > lastIndex) {
          parts.push(cleanedText.substring(lastIndex, match.index));
        }

        // 添加文件名，使用高亮
        parts.push(<span key={match.index} className="text-yellow-400">{match[1]}</span>);
        parts.push(match[2]);

        lastIndex = match.index + match[0].length;
      }

      // 添加剩余文本
      if (lastIndex < cleanedText.length) {
        parts.push(cleanedText.substring(lastIndex));
      }

      return <>{parts}</>;
    }

    // 高亮"Command completed with code X"
    if (cleanedText.includes("Command completed with code")) {
      const parts = cleanedText.split(/(Command completed with code\s+)(\d+)/);
      if (parts.length >= 4) {
        return (
            <>
              {parts[0]}
              <span className="text-blue-400">{parts[1]}</span>
              <span className={parts[2] === "0" ? "text-green-400" : "text-red-400"}>{parts[2]}</span>
              {parts.slice(3).join('')}
            </>
        );
      }
    }

    // 高亮 $ 命令前缀
    if (cleanedText.trim().startsWith("$")) {
      const parts = cleanedText.split(/(\$\s*)/);
      if (parts.length >= 3) {
        return (
            <>
              <span className="text-green-400 font-bold">{parts[1]}</span>
              {parts.slice(2).join('')}
            </>
        );
      }
    }

    return cleanedText;
  }

  // 同步系统主题变化
  useEffect(() => {
    // 初始化时使用系统主题
    if (systemTheme && theme === "system") {
      // 应用系统主题到控制台
      // 如果是自定义主题，这里不需要操作
    }
  }, [systemTheme, theme]);

  // 解析和处理原始日志
  useEffect(() => {
    if (logs.length > 0) {
      // 收集来自同一组命令的日志行
      const groupedLogs: { [key: string]: string[] } = {};
      let currentGroup = '';

      logs.forEach(log => {
        // 清理双重时间戳（格式如 [18:30:06] 18:30:06: ）
        let cleanedLog = log;

        // 匹配第一种模式：[时间] 时间:
        const doubleTimePattern = /^\[(\d{2}:\d{2}:\d{2})\]\s+(\d{2}:\d{2}:\d{2}):/;
        if (doubleTimePattern.test(cleanedLog)) {
          cleanedLog = cleanedLog.replace(doubleTimePattern, '[$1]:');
        }

        // 匹配第二种模式：时间: $
        const commandTimePattern = /^(\d{2}:\d{2}:\d{2}):\s+\$/;
        if (commandTimePattern.test(cleanedLog)) {
          cleanedLog = cleanedLog.replace(commandTimePattern, '$');
        }

        // 匹配第三种模式：时间: 其他文本
        const generalTimePattern = /^(\d{2}:\d{2}:\d{2}):\s+/;
        if (generalTimePattern.test(cleanedLog)) {
          cleanedLog = cleanedLog.replace(generalTimePattern, '');
        }

        // 检查是否是新命令的开始（通常以时间戳开头）
        const timeMatch = cleanedLog.match(/^\[(\d{2}:\d{2}:\d{2})\]/);

        if (timeMatch) {
          currentGroup = timeMatch[1];
          if (!groupedLogs[currentGroup]) {
            groupedLogs[currentGroup] = [];
          }
        }

        if (currentGroup) {
          groupedLogs[currentGroup].push(cleanedLog);
        } else {
          // 如果没有当前组，创建一个默认组
          const defaultGroup = 'default';
          if (!groupedLogs[defaultGroup]) {
            groupedLogs[defaultGroup] = [];
          }
          groupedLogs[defaultGroup].push(cleanedLog);
        }
      });

      // 创建增强日志条目
      const newEnhancedLogs: LogEntry[] = [];

      Object.entries(groupedLogs).forEach(([group, groupLogs], groupIndex) => {
        groupLogs.forEach((log, logIndex) => {
          // 判断日志类型
          let type: LogEntry["type"] = "info";
          if (log.toLowerCase().includes("error") || log.toLowerCase().includes("失败")) {
            type = "error";
          } else if (log.toLowerCase().includes("warning") || log.toLowerCase().includes("警告")) {
            type = "warning";
          } else if (log.toLowerCase().includes("success") || log.toLowerCase().includes("成功")) {
            type = "success";
          } else if (log.includes("$")) {
            type = "command";
          } else if (log.startsWith(">")) {
            type = "result";
          } else if (log.includes("Command completed with code 0")) {
            type = "success";
          } else if (log.includes("Command completed with code") && !log.includes("Command completed with code 0")) {
            type = "error";
          }

          // 解析时间戳
          const { timestamp, restContent } = parseLogLine(log);

          const newLog: LogEntry = {
            id: Date.now() + groupIndex * 1000 + logIndex,
            timestamp: timestamp || group !== 'default' ? group : getTimestamp(),
            type,
            text: log,
            isNew: !enhancedLogs.some(oldLog => oldLog.text === log)
          };

          // 检查是否已存在相同内容的日志
          if (!newEnhancedLogs.some(l => l.text === log) &&
              !enhancedLogs.some(l => l.text === log)) {
            newEnhancedLogs.push(newLog);
          }
        });
      });

      // 合并新旧日志，避免重复
      const combinedLogs = [...enhancedLogs, ...newEnhancedLogs];

      // 去重
      const uniqueLogs = combinedLogs.filter((log, index, self) =>
          index === self.findIndex(l => l.text === log.text)
      );

      setEnhancedLogs(uniqueLogs);

      // 动画结束后移除新标记
      if (newEnhancedLogs.some(log => log.isNew)) {
        const timer = setTimeout(() => {
          setEnhancedLogs(prev => prev.map(log => ({ ...log, isNew: false })));
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [logs]);

  // 自动滚动到底部（添加控制）
  useEffect(() => {
    if (isOpen && scrollAreaRef.current && enhancedLogs.length > 0) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");

      if (scrollContainer) {
        // 只有在用户没有手动滚动时，才自动滚动到底部
        if (!userHasScrolled) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }
  }, [enhancedLogs, isOpen, userHasScrolled]);

  // 监听滚动事件
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");

      if (scrollContainer) {
        // 检测用户滚动事件
        const handleScroll = () => {
          if (scrollContainer) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            // 如果用户向上滚动超过20px，标记为用户已滚动
            if (scrollHeight - scrollTop - clientHeight > 20) {
              setUserHasScrolled(true);
            }

            // 如果用户滚动到底部附近，重置标记
            if (scrollHeight - scrollTop - clientHeight < 5) {
              setUserHasScrolled(false);
            }
          }
        };

        // 添加滚动事件监听器
        scrollContainer.addEventListener('scroll', handleScroll);

        return () => {
          scrollContainer.removeEventListener('scroll', handleScroll);
        };
      }
    }
  }, [isOpen]);

  // 选择激活标签时聚焦输入框
  useEffect(() => {
    if (activeTab === "terminal" && isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeTab, isOpen])

  // 处理鼠标拖动事件
  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      // 计算新高度（从窗口底部到鼠标位置）
      const newHeight = window.innerHeight - e.clientY
      // 设置最小和最大高度
      if (newHeight >= 100 && newHeight <= window.innerHeight * 0.8) {
        setConsoleHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // 添加日志
  const addLog = (text: string, type: LogEntry["type"] = "info") => {
    const newLog: LogEntry = {
      id: Date.now(),
      timestamp: getTimestamp(),
      type,
      text,
      isNew: true
    }

    setEnhancedLogs(prev => [...prev, newLog])
  }

  // 主题类
  const getThemeClass = () => {
    if (theme === "system") {
      return systemTheme || "light";
    }
    return theme;
  };

  // 获取控制台背景和文本颜色
  const getConsoleStyles = () => {
    const themeClass = getThemeClass();
    if (themeClass === "dark") {
      return {
        background: "bg-black",
        text: "text-gray-200",
        border: "border-gray-800",
        input: "bg-gray-900 text-gray-200"
      };
    } else {
      return {
        background: "bg-white",
        text: "text-gray-800",
        border: "border-gray-200",
        input: "bg-gray-100 text-gray-800"
      };
    }
  };

  // 自定义命令集
  const customCommands = useMemo(() => {
    return {
      "clear": () => {
        handleClearLogs()
        return "控制台已清空"
      },
      "help": () => {
        return `
可用命令:
  clear       - 清空控制台
  help        - 显示此帮助信息
  theme       - 切换主题 (用法: theme dark|light|system)
  history     - 显示命令历史
  size        - 修改字体大小 (用法: size 12-20)
  fullscreen  - 切换全屏模式
  exit        - 关闭控制台
`
      },
      "theme": (args: string[]) => {
        const newTheme = args[0] as ConsoleTheme
        if (["dark", "light", "system"].includes(newTheme)) {
          setTheme(newTheme)
          // 如果需要同步系统主题
          setSystemTheme(newTheme)
          return `主题已切换为 ${newTheme}`
        }
        return "用法: theme dark|light|system"
      },
      "history": () => {
        if (commandHistory.length === 0) {
          return "命令历史为空"
        }
        return commandHistory.map((entry, i) =>
            `${i + 1}. [${entry.timestamp}] ${entry.command}`
        ).join("\n")
      },
      "size": (args: string[]) => {
        const size = parseInt(args[0])
        if (size >= 10 && size <= 20) {
          setFontSize(size)
          return `字体大小已设置为 ${size}px`
        }
        return "用法: size 10-20"
      },
      "fullscreen": () => {
        setIsFullscreen(!isFullscreen)
        return `全屏模式: ${!isFullscreen ? '开启' : '关闭'}`
      },
      "exit": () => {
        setTimeout(() => onToggle(), 500)
        return "正在关闭控制台..."
      }
    }
  }, [commandHistory.length, handleClearLogs, isFullscreen, onToggle, setSystemTheme])

  // 处理内置命令
  const handleInternalCommand = (command: string): boolean => {
    const parts = command.trim().split(" ")
    const cmdName = parts[0].toLowerCase()
    const args = parts.slice(1)

    if (customCommands[cmdName as keyof typeof customCommands]) {
      const result = customCommands[cmdName as keyof typeof customCommands](args)
      addLog(`$ ${command}`, "command")
      if (result) {
        addLog(result, "result")
      }
      return true
    }

    return false
  }

  // 执行命令
  const executeCommand = async () => {
    if (!commandInput.trim()) return

    try {
      // 添加命令到历史记录
      const newEntry: CommandHistoryEntry = {
        command: commandInput,
        timestamp: getTimestamp()
      }
      setCommandHistory(prev => [...prev, newEntry])
      setHistoryIndex(-1)

      // 尝试处理内置命令
      if (handleInternalCommand(commandInput)) {
        setCommandInput("")
        return
      }

      // 执行外部命令
      if (onExecuteCommand) {
        // 记录命令
        addLog(`$ ${commandInput}`, "command")

        // 执行命令
        await onExecuteCommand(commandInput)

        // 清空输入
        setCommandInput("")

        // 刷新文件列表
        if (onRefresh) {
          onRefresh()
        }
      }
    } catch (error) {
      console.error("执行命令时出错:", error)
      addLog(`执行出错: ${error}`, "error")
    }
  }

  // 复制所有日志
  const copyLogs = () => {
    const logText = enhancedLogs.map(log => `[${log.timestamp}] ${log.text}`).join('\n')
    navigator.clipboard.writeText(logText).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  // 下载日志
  const downloadLogs = () => {
    const logText = enhancedLogs.map(log => `[${log.timestamp}] [${log.type}] ${log.text}`).join('\n')
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `console-logs-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 处理键盘事件
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    // 如果显示建议，处理上下键选择建议
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestion(prev => (prev + 1) % suggestions.length)
        return
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length)
        return
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault()
        setCommandInput(suggestions[selectedSuggestion])
        setShowSuggestions(false)
        if (e.key === "Enter") {
          executeCommand()
        }
        return
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
        return
      }
    }

    // 普通键处理
    if (e.key === "Enter") {
      executeCommand()
    } else if (e.key === "Tab") {
      e.preventDefault()
      showCommandSuggestions()
    } else if (e.key === "ArrowUp" && !showSuggestions) {
      // 向上浏览历史
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex].command)
      }
    } else if (e.key === "ArrowDown" && !showSuggestions) {
      // 向下浏览历史
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex].command)
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommandInput("")
      }
    } else if (e.key === "l" && e.ctrlKey) {
      // Ctrl+L 清屏
      e.preventDefault()
      handleClearLogs()
    }
  }

  // 显示命令建议
  const showCommandSuggestions = () => {
    const input = commandInput.trim()
    if (!input) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // 合并内置命令和常用命令
    const availableCommands = [
      ...Object.keys(customCommands),
      ...COMMON_COMMANDS
    ]

    // 过滤匹配的命令
    const matches = availableCommands.filter(cmd =>
        cmd.startsWith(input) && cmd !== input
    )

    // 从历史记录中找出匹配的命令
    const historyMatches = commandHistory
        .map(entry => entry.command)
        .filter(cmd => cmd.startsWith(input) && cmd !== input && !matches.includes(cmd))

    // 合并并去重
    const allSuggestions = [...new Set([...matches, ...historyMatches])]

    if (allSuggestions.length > 0) {
      setSuggestions(allSuggestions)
      setShowSuggestions(true)
      setSelectedSuggestion(0)
    } else {
      setShowSuggestions(false)
    }
  }

  // 当输入改变时更新建议
  useEffect(() => {
    if (commandInput.trim()) {
      showCommandSuggestions()
    } else {
      setShowSuggestions(false)
    }
  }, [commandInput])

  // 控制台可见性
  if (!isVisible && !isOpen) return null

  // 计算控制台和建议框的样式
  const consoleContainerStyle = isFullscreen
      ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        height: "100vh",
        display: "flex",
        flexDirection: "column" as const
      }
      : {
        height: isOpen ? `${consoleHeight}px` : "0px",
        opacity: isOpen ? 1 : 0,
        overflow: "hidden" as const
      }

  return (
      <div className={`fixed bottom-0 left-0 right-0 z-40 ${isFullscreen ? 'top-0' : ''}`}>
        {/* 控制台标题栏 */}
        <div className={`flex items-center justify-between ${getConsoleStyles().background} border-t ${getConsoleStyles().border}`}>
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={onToggle} className="m-1">
              <Terminal className="mr-2 h-4 w-4" />
              {t("console")}
            </Button>

            {isOpen && (
                <>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mr-2">
                    <TabsList className="h-8">
                      <TabsTrigger value="terminal" className="text-xs px-2 py-1">
                        {t("terminal")}
                      </TabsTrigger>
                      <TabsTrigger value="logs" className="text-xs px-2 py-1">
                        {t("logs")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={handleClearLogs} title={t("clear")} className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyLogs}
                        title={isCopied ? t("copied") : t("copy")}
                        className="h-8 w-8 p-0 ml-1"
                    >
                      <Copy className="h-4 w-4" />
                      {isCopied && <span className="absolute -top-8 bg-black text-white text-xs p-1 rounded">已复制</span>}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={downloadLogs}
                        title={t("download")}
                        className="h-8 w-8 p-0 ml-1"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {/* 主题切换按钮 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newTheme = getThemeClass() === "dark" ? "light" : "dark";
                          setTheme(newTheme as ConsoleTheme);
                          setSystemTheme(newTheme);
                        }}
                        title={getThemeClass() === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
                        className="h-8 w-8 p-0 ml-1"
                    >
                      {getThemeClass() === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
            )}
          </div>

          {isOpen && isFullscreen && (
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                  className="h-8 w-8 p-0 mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
          )}
        </div>

        {/* 拖动条 */}
        {isOpen && !isFullscreen && (
            <div
                className="h-1 w-full cursor-ns-resize hover:bg-accent transition-colors"
                onMouseDown={startDragging}
            ></div>
        )}

        {/* 控制台主体 */}
        <div
            className={`
          transition-all duration-300 ease-in-out bg-background
          border-t ${isFullscreen ? 'flex-1' : ''}
        `}
            style={consoleContainerStyle}
        >
          <Tabs value={activeTab} className="h-full">
            {/* 日志标签页 */}
            <TabsContent value="logs" className="h-full m-0 p-0">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div
                    className={`font-mono p-2 whitespace-pre-wrap ${getConsoleStyles().background} ${getConsoleStyles().text}`}
                    style={{ fontSize: `${fontSize}px` }}
                >
                  {enhancedLogs.length > 0 ? (
                      enhancedLogs.map((log, index) => {
                        // 清理文本中的多余时间戳
                        let displayText = log.text;
                        // 匹配格式为 [18:30:06] 18:30:06: 的双时间戳
                        const doubleTimestampRegex = /^\[(\d{2}:\d{2}:\d{2})\]\s*(\d{2}:\d{2}:\d{2}):/;
                        if (doubleTimestampRegex.test(displayText)) {
                          // 替换为单个时间戳
                          displayText = displayText.replace(doubleTimestampRegex, '[$1]');
                        }

                        return (
                            <div key={log.id} className={`inline ${log.isNew ? "console-log-entry" : ""}`}>
                              <span className="text-gray-500">[{log.timestamp}]</span>
                              {' '}
                              <span
                                  className={`
                            ${log.type === "error" ? "text-red-500" : ""}
                            ${log.type === "warning" ? "text-amber-500" : ""}
                            ${log.type === "success" ? "text-green-500" : ""}
                            ${log.type === "command" ? "text-blue-500 font-semibold" : ""}
                            ${log.type === "result" ? "text-purple-500" : ""}
                          `}
                              >
                          {formatLogText(displayText)}
                        </span>
                            </div>
                        );
                      })
                  ) : (
                      <div className="text-sm text-muted-foreground italic">
                        {t("noLogs")}
                      </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 终端标签页 */}
            <TabsContent value="terminal" className="h-full m-0 p-0 flex flex-col">
              <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div
                    className={`font-mono p-2 ${getConsoleStyles().background} ${getConsoleStyles().text}`}
                    style={{ fontSize: `${fontSize}px`, lineHeight: "1.3" }}
                >
                  {enhancedLogs.length > 0 ? (
                      enhancedLogs.map((log, index) => {
                        // 清理文本中的多余时间戳
                        let displayText = log.text;
                        // 匹配格式为 [18:30:06] 18:30:06: 的双时间戳
                        const doubleTimestampRegex = /^\[(\d{2}:\d{2}:\d{2})\]\s*(\d{2}:\d{2}:\d{2}):/;
                        if (doubleTimestampRegex.test(displayText)) {
                          // 替换为单个时间戳
                          displayText = displayText.replace(doubleTimestampRegex, '[$1]');
                        }

                        return (
                            <div key={log.id} className={`${log.isNew ? "console-log-entry" : ""}`}>
                              <span className="text-gray-500">[{log.timestamp}]</span>
                              {' '}
                              <span
                                  className={`
                            ${log.type === "error" ? "text-red-500" : ""}
                            ${log.type === "warning" ? "text-amber-500" : ""}
                            ${log.type === "success" ? "text-green-500" : ""}
                            ${log.type === "command" ? "text-blue-500 font-semibold" : ""}
                            ${log.type === "result" ? "text-purple-500" : ""}
                          `}
                              >
                          {formatLogText(displayText)}
                        </span>
                            </div>
                        );
                      })
                  ) : (
                      <div className="text-gray-400 italic">
                        欢迎使用增强版控制台！输入 'help' 获取可用命令列表。
                      </div>
                  )}
                </div>
              </ScrollArea>

              {/* 命令输入区 */}
              <div className={`flex items-center p-2 border-t ${getConsoleStyles().border} ${getConsoleStyles().background}`}>
                <div className="text-green-400 font-bold mr-2" style={{ fontSize: `${fontSize}px` }}>$</div>
                <div className="relative flex-1">
                  <Input
                      ref={inputRef}
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t("enterCommand")}
                      className={`flex-1 border-0 ${getConsoleStyles().input} focus-visible:ring-0 focus-visible:ring-offset-0`}
                      style={{ fontSize: `${fontSize}px` }}
                  />

                  {/* 命令建议下拉框 */}
                  {showSuggestions && suggestions.length > 0 && (
                      <div className={`absolute left-0 right-0 bottom-full ${getConsoleStyles().background === 'bg-black' ? 'bg-gray-900' : 'bg-gray-100'} border ${getConsoleStyles().border} rounded-md shadow-lg max-h-60 overflow-y-auto z-50`}>
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={suggestion}
                                className={`
                          px-2 py-1 cursor-pointer ${getConsoleStyles().text}
                          ${index === selectedSuggestion ? (getConsoleStyles().background === 'bg-black' ? 'bg-gray-700' : 'bg-gray-300') : (getConsoleStyles().background === 'bg-black' ? 'hover:bg-gray-800' : 'hover:bg-gray-200')}
                        `}
                                onClick={() => {
                                  setCommandInput(suggestion)
                                  setShowSuggestions(false)
                                  inputRef.current?.focus()
                                }}
                            >
                              {suggestion}
                            </div>
                        ))}
                      </div>
                  )}
                </div>

                <Button variant="ghost" size="icon" onClick={executeCommand} className={`ml-1 ${getConsoleStyles().text} hover:bg-transparent`}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 动画和主题样式 */}
        <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(-5px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .console-log-entry {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        /* 根据主题设置样式 */
        .terminal-${theme === "system" ? "auto" : theme} {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        }
        
        /* 去除每行之间的间隔 */
        .scrollArea-viewport > div > div {
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.2 !important;
        }
        
        /* 增加代码块样式，根据主题调整 */
        pre {
          background-color: ${getThemeClass() === "dark" ? "#1a1a1a" : "#f5f5f5"};
          border-radius: 4px;
          padding: 8px;
          margin: 4px 0;
          overflow-x: auto;
        }
        
        /* 美化时间戳格式 */
        .timestamp {
          opacity: 0.7;
          font-style: italic;
        }
        
        /* 给链接添加样式 */
        a {
          color: ${getThemeClass() === "dark" ? "#3b82f6" : "#2563eb"};
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        /* 终端光标闪烁效果 */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .cursor {
          display: inline-block;
          width: 8px;
          height: 16px;
          background-color: ${getThemeClass() === "dark" ? "#fff" : "#000"};
          animation: blink 1s step-end infinite;
          margin-left: 2px;
          vertical-align: middle;
        }
      `}</style>
      </div>
  )
}