"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileIcon, File, FileText, FileImage, FileCode } from "lucide-react"
import { Loader2 } from "lucide-react"
import path from "path-browserify"

interface FilePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
}

export function FilePreviewDialog({ isOpen, onClose, filePath }: FilePreviewDialogProps) {
  const { t } = useTranslation()
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>("unknown")
  const [fileSize, setFileSize] = useState<number>(0)
  
  // 预览文件大小限制 (3MB)
  const MAX_PREVIEW_SIZE = 3 * 1024 * 1024
  
  useEffect(() => {
    if (isOpen && filePath) {
      loadFilePreview();
    } else {
      // 当对话框关闭时清空内容
      setFileContent(null);
      setError(null);
    }
  }, [isOpen, filePath]);
  
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
      
      // 获取文件信息 - 尝试直接从目录信息中获取
      try {
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const dirFiles = await window.electron.fs.readDirectory(dirPath);
        const fileInfo = dirFiles.find(f => f.name === fileName);
        
        if (!fileInfo) {
          throw new Error(t("fileNotFound"));
        }
        
        // 将文件大小字符串转换为数字（假设格式为"123 KB"）
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
          // 读取文本文件 - 使用自定义的IPC调用
          const content = await ipcTextFileRead(filePath);
          setFileContent(content);
        } catch (error) {
          console.error("Failed to read text file:", error);
          throw new Error(t("errorLoadingPreview"));
        }
      } else if (type === "image") {
        // 对于图像文件，使用IPC调用获取Base64编码的图像数据
        try {
          const base64Data = await loadImageAsBase64(filePath);
          setFileContent(base64Data);
        } catch (error) {
          console.error("Failed to load image:", error);
          throw new Error(t("errorLoadingPreview"));
        }
      } else if (type === "pdf") {
        // 对于PDF，由于安全限制，我们使用特殊的electron方式处理
        // 简单地保存文件路径，展示时将使用其他方法处理
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
  
  // 通过IPC读取文本文件
  const ipcTextFileRead = async (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 使用临时方案读取文件内容
      try {
        // 使用子进程读取文件
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
        
        // 设置超时
        setTimeout(() => {
          reject(new Error(t("previewTimeout")));
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // 加载图片为Base64
  const loadImageAsBase64 = async (filePath: string): Promise<string> => {
    try {
      // 使用新添加的Electron IPC API读取图片
      // 使用类型断言临时解决TypeScript错误
      const fs = window.electron.fs as any;
      return await fs.readImageAsBase64(filePath);
    } catch (error) {
      console.error('Error loading image as base64:', error);
      throw error;
    }
  };
  
  const getFileType = (extension: string): string => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.html', '.css', '.xml', '.csv', '.log'];
    const pdfExtensions = ['.pdf'];
    
    if (imageExtensions.includes(extension)) return "image";
    if (textExtensions.includes(extension)) return "text";
    if (pdfExtensions.includes(extension)) return "pdf";
    
    return "unknown";
  };
  
  const getFileTypeIcon = () => {
    switch (fileType) {
      case "image":
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case "text":
        return <FileText className="h-6 w-6 text-green-500" />;
      case "pdf":
        return <FileCode className="h-6 w-6 text-red-500" />; // 使用FileCode代替未导入的FilePdf
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
          <div className="flex items-center justify-center p-4 h-full">
            <img 
              src={fileContent} // 使用Base64数据URL而不是file://协议
              alt={path.basename(filePath)} 
              className="max-w-full max-h-[70vh] object-contain" 
            />
          </div>
        );
      
      case "text":
        return (
          <ScrollArea className="h-[70vh] w-full border rounded-md p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm">{fileContent}</pre>
          </ScrollArea>
        );
      
      case "pdf":
        // 对于PDF，暂时显示不支持预览消息
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
      <DialogContent className="max-w-4xl h-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getFileTypeIcon()}
            <span className="ml-2">{path.basename(filePath)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
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