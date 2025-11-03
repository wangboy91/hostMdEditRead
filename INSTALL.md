# 安装和使用指南

## 系统要求

- **Node.js**: 版本 16.0 或更高
- **npm**: 版本 8.0 或更高
- **操作系统**: macOS 10.14+, Windows 10+, Linux (Ubuntu 18.04+)

## 快速开始

### 方法一：使用启动脚本（推荐）

#### macOS/Linux
```bash
./start.sh
```

#### Windows
双击运行 `start.bat` 文件

### 方法二：手动安装

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动应用**
   ```bash
   npm start
   ```

## 常见问题

### Q: Electron 安装失败怎么办？

A: 尝试以下解决方案：

1. 清理缓存并重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. 使用国内镜像源：
   ```bash
   npm config set registry https://registry.npmmirror.com/
   npm config set electron_mirror https://npmmirror.com/mirrors/electron/
   npm install
   ```

3. 手动下载 Electron：
   ```bash
   npm install electron --save-dev --verbose
   ```

### Q: 应用启动后界面显示异常？

A: 检查以下几点：
- 确保所有依赖都已正确安装
- 尝试清除浏览器缓存（Ctrl+Shift+R）
- 检查控制台是否有错误信息

### Q: 文件扫描功能不工作？

A: 可能的原因：
- 没有选择正确的目录
- 目录权限不足
- 目录中没有 .md 文件

### Q: 如何构建可执行文件？

A: 使用以下命令：

```bash
# 构建所有平台
npm run build

# 构建特定平台
npm run build:mac    # macOS
npm run build:win    # Windows
```

构建完成后，可执行文件将在 `dist` 目录中。

## 开发模式

如果你想修改代码或进行开发：

```bash
# 开发模式启动（带开发者工具）
npm run dev
```

## 卸载

删除项目目录即可完全卸载应用。

## 技术支持

如果遇到其他问题，请：
1. 查看 README.md 文档
2. 检查 GitHub Issues
3. 提交新的 Issue

## 更新日志

### v1.0.0 (当前版本)
- 初始版本发布
- 基本编辑和预览功能
- 文件扫描和管理
- 主题切换支持