import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './XTerminal.css';

/**
 * Xterm.js 终端组件，用于在 Electron 应用中显示终端界面
 *
 * 此组件需要与 electron 的 preload.js 中定义的 API 配合使用
 * 并且需要在主进程中设置 node-pty
 */
const XTerminal = () => {
    const terminalRef = useRef(null);
    const terminalInstance = useRef(null);
    const fitAddon = useRef(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // 初始化 xterm.js 终端
        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#1e1e1e',
                foreground: '#f0f0f0'
            },
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            rendererType: 'canvas',
            allowTransparency: true
        });

        // 添加终端大小自适应插件
        fitAddon.current = new FitAddon();
        term.loadAddon(fitAddon.current);

        // 在 DOM 元素中打开终端
        term.open(terminalRef.current);
        terminalInstance.current = term;

        // 调整终端大小
        setTimeout(() => {
            if (fitAddon.current) {
                fitAddon.current.fit();
            }
        }, 0);

        // 检查是否在 Electron 环境中
        if (window.electron) {
            // 假设 window.electron 是通过 preload.js 暴露的 API
            // 创建新的终端进程
            const platform = window.electron.os.platform;
            const shell = platform === 'win32' ? 'powershell.exe' : 'bash';

            // 使用 IPC 通信与主进程交互
            window.electron.terminal.create(shell, (data) => {
                // 接收从终端发来的数据并写入 xterm
                terminalInstance.current.write(data);
            });

            // 当在终端中输入内容时，将内容发送到实际的终端进程
            term.onData(data => {
                window.electron.terminal.write(data);
            });

            // 当终端大小改变时通知 pty 进程
            term.onResize(({ cols, rows }) => {
                window.electron.terminal.resize(cols, rows);
            });

            // 初始调整大小
            if (fitAddon.current) {
                const dimensions = fitAddon.current.proposeDimensions();
                if (dimensions) {
                    term.resize(dimensions.cols, dimensions.rows);
                    window.electron.terminal.resize(dimensions.cols, dimensions.rows);
                }
            }
        } else {
            // 如果不在 Electron 环境中，显示一条提示消息
            term.writeln('\x1B[1;31mWarning: Not running in Electron environment\x1B[0m');
            term.writeln('This terminal requires Electron to function properly.');
            term.writeln('');
            term.writeln('Try the following commands:');
            term.writeln('  help     Display available commands');
            term.writeln('  clear    Clear the terminal');
            term.writeln('  ls       List files (simulation)');
            term.writeln('  cd       Change directory (simulation)');

            // 简单的命令处理，仅用于非 Electron 环境的演示
            let currentPath = '/home/user';
            term.onData(data => {
                if (data === '\r') { // Enter key
                    const command = term.buffer.active.getLine(term.buffer.active.cursorY).translateToString().trim().substring(2);
                    term.writeln('');

                    if (command === 'clear') {
                        term.clear();
                    } else if (command === 'help') {
                        term.writeln('Available commands: help, clear, ls, cd');
                    } else if (command === 'ls') {
                        term.writeln('Documents/');
                        term.writeln('Downloads/');
                        term.writeln('Pictures/');
                        term.writeln('example.txt');
                    } else if (command.startsWith('cd ')) {
                        const dir = command.substring(3);
                        if (dir) {
                            currentPath = dir.startsWith('/') ? dir : `${currentPath}/${dir}`;
                            term.writeln(`Changed to ${currentPath}`);
                        }
                    } else if (command) {
                        term.writeln(`Command not found: ${command}`);
                    }

                    term.write(`\r\n$ `);
                } else {
                    term.write(data);
                }
            });

            // 显示初始提示符
            term.write('$ ');
        }

        // 监听窗口大小变化以调整终端大小
        const handleResize = () => {
            if (fitAddon.current) {
                fitAddon.current.fit();

                if (window.electron && terminalInstance.current) {
                    const { cols, rows } = terminalInstance.current;
                    window.electron.terminal.resize(cols, rows);
                }
            }
        };

        window.addEventListener('resize', handleResize);

        // 清理函数
        return () => {
            window.removeEventListener('resize', handleResize);

            if (terminalInstance.current) {
                terminalInstance.current.dispose();
            }

            // 通知主进程关闭终端
            if (window.electron) {
                window.electron.terminal.destroy();
            }
        };
    }, []);

    return (
        <div className="terminal-container">
            <div ref={terminalRef} className="terminal" />
        </div>
    );
};

export default XTerminal;