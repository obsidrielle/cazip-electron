"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "./ui/textarea"
import { FileIcon, File, FileText, FileImage, FileCode, Search, Edit3, Save, ZoomIn, ZoomOut, RotateCcw, ChevronUp, ChevronDown } from "lucide-react"
import { Loader2 } from "lucide-react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import path from "path-browserify"
import Prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-python"
import "prismjs/components/prism-json"
import "prismjs/components/prism-css"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-markdown"

// 添加搜索高亮的CSS样式
const searchHighlightStyles = `
  .search-highlight {
    background-color: #fef08a !important;
    color: #000 !important;
    padding: 1px 2px;
    border-radius: 2px;
    transition: all 0.2s ease;
  }
  
  .search-highlight-current {
    background-color: #facc15 !important;
    color: #000 !important;
    padding: 1px 2px;
    border-radius: 2px;
    box-shadow: 0 0 0 2px #f59e0b;
    transition: all 0.2s ease;
  }
  
  .search-highlight:hover {
    background-color: #fde047 !important;
  }
`;

// 注入样式到页面
if (typeof document !== 'undefined') {
  const styleId = 'search-highlight-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = searchHighlightStyles;
    document.head.appendChild(style);
  }
}

interface FilePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
}

export function FilePreviewDialog({ isOpen, onClose, filePath }: FilePreviewDialogProps) {
  const { t } = useTranslation()
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>("unknown")
  const [detectedLanguage, setDetectedLanguage] = useState<string>("text")
  const [fileSize, setFileSize] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 预览文件大小限制 (10MB)
  const MAX_PREVIEW_SIZE = 10 * 1024 * 1024
  
  useEffect(() => {
    if (isOpen && filePath) {
      loadFilePreview();
    } else {
      // 当对话框关闭时清空内容
      resetState();
    }
  }, [isOpen, filePath]);

  const resetState = () => {
    setFileContent(null);
    setEditedContent("");
    setError(null);
    setIsEditing(false);
    setSearchTerm("");
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setHasUnsavedChanges(false);
  };
  
  const loadFilePreview = async () => {
    if (!filePath) return;
    
    setIsLoading(true);
    setError(null);
    setFileContent(null);
    
    try {
      // 获取文件类型
      const ext = path.extname(filePath).toLowerCase();
      const type = getFileType(ext);
      setFileType(type);
      
      // 检查文件是否存在
      const fileExists = await window.electron.fs.fileExists(filePath);
      if (!fileExists) {
        throw new Error(t("fileNotFound"));
      }
      
      // 获取文件信息
      try {
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const dirFiles = await window.electron.fs.readDirectory(dirPath);
        const fileInfo = dirFiles.find(f => f.name === fileName);
        
        if (!fileInfo) {
          throw new Error(t("fileNotFound"));
        }
        
        // 将文件大小字符串转换为数字
        const sizeStr = fileInfo.size.toString();
        const sizeNum = parseFloat(sizeStr);
        const unit = sizeStr.split(' ')[1];
        let actualSize = sizeNum;
        
        // 根据单位转换为字节
        if (unit === 'KB') actualSize *= 1024;
        else if (unit === 'MB') actualSize *= 1024 * 1024;
        else if (unit === 'GB') actualSize *= 1024 * 1024 * 1024;
        else if (unit === 'TB') actualSize *= 1024 * 1024 * 1024 * 1024;
        
        setFileSize(actualSize);
        
        // 检查文件大小
        if (actualSize > MAX_PREVIEW_SIZE && type === "text") {
          throw new Error(t("fileTooLargeForPreview"));
        }
      } catch (error) {
        console.error("Error getting file info:", error);
      }
      
      // 处理不同类型的文件
      if (type === "text") {
        try {
          const content = await ipcTextFileRead(filePath);
          setFileContent(content);
          setEditedContent(content);
          
          // 智能检测文件内容类型
          const language = detectLanguageFromContent(content, ext);
          setDetectedLanguage(language);
        } catch (error) {
          console.error("Failed to read text file:", error);
          throw new Error(t("errorLoadingPreview"));
        }
      } else if (type === "image") {
        try {
          const base64Data = await loadImageAsBase64(filePath);
          setFileContent(base64Data);
        } catch (error) {
          console.error("Failed to load image:", error);
          throw new Error(t("errorLoadingPreview"));
        }
      } else if (type === "pdf") {
        setFileContent(filePath);
      } else {
        setError(t("fileTypeNotSupported"));
      }
    } catch (err: any) {
      console.error("Error loading file preview:", err);
      setError(err.message || t("errorLoadingPreview"));
    } finally {
      setIsLoading(false);
    }
  };

  // 智能检测文件内容类型
  const detectLanguageFromContent = (content: string, extension: string): string => {
    // 首先根据扩展名判断
    const extMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.json': 'json',
      '.html': 'html',
      '.htm': 'html',
      '.css': 'css',
      '.xml': 'xml',
      '.sh': 'bash',
      '.bash': 'bash',
      '.sql': 'sql',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.md': 'markdown',
      '.markdown': 'markdown'
    };

    if (extMap[extension]) {
      return extMap[extension];
    }

    // 通过内容特征检测
    const contentLower = content.toLowerCase();
    
    // 检测 JSON
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      try {
        JSON.parse(content);
        return 'json';
      } catch {}
    }
    
    // 检测 HTML
    if (contentLower.includes('<!doctype html') || contentLower.includes('<html')) {
      return 'html';
    }
    
    // 检测 XML
    if (content.trim().startsWith('<?xml') || contentLower.includes('<xml')) {
      return 'xml';
    }
    
    // 检测 Python
    if (contentLower.includes('def ') || contentLower.includes('import ') || contentLower.includes('from ')) {
      return 'python';
    }
    
    // 检测 JavaScript/TypeScript
    if (contentLower.includes('function ') || contentLower.includes('const ') || contentLower.includes('let ')) {
      return 'javascript';
    }
    
    // 检测 CSS
    if (contentLower.includes('{') && contentLower.includes(':') && contentLower.includes(';')) {
      return 'css';
    }
    
    // 检测 Shell脚本
    if (content.startsWith('#!/bin/bash') || content.startsWith('#!/bin/sh')) {
      return 'bash';
    }
    
    return 'text';
  };
  
  // 通过IPC读取文本文件
  const ipcTextFileRead = async (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const childProcess = window.electron.childProcess.spawn('cat', [filePath]);
        let content = '';
        
        childProcess.stdout.on('data', (data) => {
          content += data;
        });
        
        childProcess.on('close', () => {
          resolve(content);
        });
        
        childProcess.stderr.on('data', (data) => {
          reject(new Error(data));
        });
        
        setTimeout(() => {
          reject(new Error(t("previewTimeout")));
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // 加载图片为Base64
  const loadImageAsBase64 = async (filePath: string): Promise<string> => {
    try {
      const fs = window.electron.fs as any;
      return await fs.readImageAsBase64(filePath);
    } catch (error) {
      console.error('Error loading image as base64:', error);
      throw error;
    }
  };
  
  const getFileType = (extension: string): string => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
    const textExtensions = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.xml', '.csv', '.log', '.py', '.sh', '.bash', '.sql', '.yml', '.yaml', '.ini', '.conf', '.cfg'];
    const pdfExtensions = ['.pdf'];
    
    if (imageExtensions.includes(extension)) return "image";
    if (textExtensions.includes(extension)) return "text";
    if (pdfExtensions.includes(extension)) return "pdf";
    
    return "unknown";
  };

  // 搜索功能
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term || !editedContent) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: number[] = [];
    const content = editedContent.toLowerCase();
    const searchLower = term.toLowerCase();
    let index = content.indexOf(searchLower);
    
    while (index !== -1) {
      results.push(index);
      index = content.indexOf(searchLower, index + 1);
    }
    
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  };

  // 高亮显示的内容
  const highlightedContent = useMemo(() => {
    if (detectedLanguage === 'text' || !editedContent) {
      return editedContent;
    }
    
    try {
      return Prism.highlight(editedContent, Prism.languages[detectedLanguage] || Prism.languages.text, detectedLanguage);
    } catch (error) {
      console.error("语法高亮失败:", error);
      return editedContent;
    }
  }, [editedContent, detectedLanguage]);

  // 搜索高亮处理函数
  const getContentWithSearchHighlight = useMemo(() => {
    if (!searchTerm || !editedContent) {
      return detectedLanguage !== 'text' ? highlightedContent : editedContent;
    }

    let content = detectedLanguage !== 'text' ? highlightedContent : editedContent;
    
    // 如果是语法高亮的内容，需要特殊处理
    if (detectedLanguage !== 'text') {
      // 对于已经语法高亮的HTML内容，我们需要在文本节点中进行搜索高亮
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // 递归处理文本节点
      const highlightTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
            const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const highlightedText = text.replace(regex, (match, p1, offset) => {
              const isCurrentResult = searchResults.some((pos, index) => {
                // 计算在原始文本中的位置
                const textContent = editedContent.toLowerCase();
                const matchStart = textContent.indexOf(text.toLowerCase());
                const actualPos = matchStart + offset;
                return Math.abs(actualPos - pos) < searchTerm.length && index === currentSearchIndex;
              });
              const className = isCurrentResult ? 'search-highlight-current' : 'search-highlight';
              return `<mark class="${className}">${p1}</mark>`;
            });
            
            if (highlightedText !== text) {
              const span = document.createElement('span');
              span.innerHTML = highlightedText;
              node.parentNode?.replaceChild(span, node);
            }
          }
        } else {
          Array.from(node.childNodes).forEach(highlightTextNodes);
        }
      };
      
      highlightTextNodes(tempDiv);
      return tempDiv.innerHTML;
    } else {
      // 对于纯文本，直接进行高亮处理
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      let highlightedText = content;
      let matchIndex = 0;
      
      highlightedText = content.replace(regex, (match, p1, offset) => {
        const isCurrentResult = currentSearchIndex === matchIndex;
        matchIndex++;
        const className = isCurrentResult ? 'search-highlight-current' : 'search-highlight';
        return `<mark class="${className}">${p1}</mark>`;
      });
      
      return highlightedText;
    }
  }, [editedContent, detectedLanguage, highlightedContent, searchTerm, searchResults, currentSearchIndex]);

  // 添加一个ref来引用预览容器，用于滚动定位
  const previewRef = useRef<HTMLDivElement>(null);

  // 修改跳转到搜索结果的函数
  const goToSearchResult = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    } else {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    
    // 在编辑模式下滚动textarea
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      const position = searchResults[newIndex];
      textarea.focus();
      textarea.setSelectionRange(position, position + searchTerm.length);
      textarea.scrollTop = (position / editedContent.length) * textarea.scrollHeight;
    } else if (previewRef.current) {
      // 在预览模式下滚动到高亮的mark元素
      setTimeout(() => {
        const currentMark = previewRef.current?.querySelector('mark.search-highlight-current');
        if (currentMark) {
          currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // 保存文件
  const handleSave = async () => {
    try {
      // 这里需要实现保存文件的逻辑
      // 由于安全限制，可能需要通过IPC调用
      console.log("保存文件:", filePath, editedContent);
      setHasUnsavedChanges(false);
      setFileContent(editedContent);
    } catch (error) {
      console.error("保存文件失败:", error);
    }
  };

  // 监听内容变化
  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasUnsavedChanges(value !== fileContent);
  };
  
  const getFileTypeIcon = () => {
    switch (fileType) {
      case "image":
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case "text":
        return <FileText className="h-6 w-6 text-green-500" />;
      case "pdf":
        return <FileCode className="h-6 w-6 text-red-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };
  
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4">{t("loadingPreview")}</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <FileIcon className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-destructive">{error}</p>
        </div>
      );
    }
    
    if (!fileContent) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <FileIcon className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4">{t("noPreviewAvailable")}</p>
        </div>
      );
    }
    
    switch (fileType) {
      case "image":
        return (
          <div className="h-[70vh] w-full border rounded-md overflow-hidden">
            <TransformWrapper
              initialScale={1}
              minScale={0.1}
              maxScale={5}
              wheel={{ step: 0.1 }}
              pinch={{ step: 5 }}
              doubleClick={{ mode: "reset" }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="flex items-center gap-2 p-2 bg-muted border-b">
                    <Button size="sm" variant="outline" onClick={() => zoomIn()}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => zoomOut()}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resetTransform()}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <TransformComponent
                    wrapperStyle={{
                      width: "100%",
                      height: "calc(100% - 48px)",
                    }}
                    contentStyle={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img 
                      src={fileContent}
                      alt={path.basename(filePath)} 
                      className="max-w-full max-h-full object-contain" 
                      style={{ userSelect: "none" }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        );
      
      case "text":
        return (
          <div className="h-[70vh] w-full border rounded-md flex flex-col">
            {/* 工具栏 */}
            <div className="flex items-center gap-2 p-2 bg-muted border-b">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4" />
                <Input
                  placeholder={t("search")}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-48"
                />
                {searchResults.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {currentSearchIndex + 1} / {searchResults.length}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => goToSearchResult('prev')}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => goToSearchResult('next')}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {detectedLanguage}
                </span>
                <Button
                  size="sm"
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="h-4 w-4" />
                  {isEditing ? t("preview") : t("edit")}
                </Button>
                {isEditing && hasUnsavedChanges && (
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                    {t("save")}
                  </Button>
                )}
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 overflow-hidden">
              {isEditing ? (
                <Textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(e.target.value)}
                  className="w-full h-full resize-none border-0 rounded-none font-mono text-sm"
                  style={{ minHeight: "100%" }}
                />
              ) : (
                <ScrollArea className="h-full w-full">
                  <div className="p-4" ref={previewRef}>
                    {detectedLanguage !== 'text' ? (
                      <pre 
                        className="whitespace-pre-wrap font-mono text-sm"
                        dangerouslySetInnerHTML={{ __html: getContentWithSearchHighlight }}
                      />
                    ) : (
                      <pre 
                        className="whitespace-pre-wrap font-mono text-sm"
                        dangerouslySetInnerHTML={{ __html: getContentWithSearchHighlight }}
                      />
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        );
      
      case "pdf":
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <FileIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4">{t("fileTypeNotSupported")}</p>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <FileIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4">{t("noPreviewAvailable")}</p>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getFileTypeIcon()}
            <span className="ml-2">{path.basename(filePath)}</span>
            {hasUnsavedChanges && <span className="ml-2 text-orange-500">*</span>}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>
        
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 