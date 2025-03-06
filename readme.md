# CaZip

CaZip 是一个基于 Electron 和 React 的压缩文件管理器。该软件的 GUI 和后端分离，可以使用不同的后端。

## 开发

确保你已经安装了 [pnpm](https://pnpm.io/)。然后，按照以下步骤进行开发：

1. 安装依赖：`pnpm install`
2. 进入 dev 模式: `pnpm electron:dev`
3. 打包到目标 `pnpm electron:build:(win/mac/linux)`