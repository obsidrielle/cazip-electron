#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试文件预览功能
这个文件用于测试新的预览功能，包括：
1. 代码高亮
2. 搜索功能
3. 编辑功能
"""

import os
import sys
import json
from pathlib import Path

def main():
    """主函数"""
    print("Hello, World!")
    
    # 测试数据
    data = {
        "name": "cazip",
        "version": "1.0.0",
        "features": [
            "文件压缩",
            "文件解压",
            "文件预览",
            "代码高亮",
            "搜索功能",
            "编辑功能"
        ]
    }
    
    # 输出JSON
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    # 文件操作示例
    current_dir = Path(__file__).parent
    print(f"当前目录: {current_dir}")
    
    # 循环示例
    for i in range(5):
        print(f"计数: {i}")
    
    # 条件判断
    if len(sys.argv) > 1:
        print(f"参数: {sys.argv[1:]}")
    else:
        print("没有提供参数")

if __name__ == "__main__":
    main() 