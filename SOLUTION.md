# Electron安装问题解决方案

由于Electron安装遇到网络问题，我为你提供了两个解决方案：

## 方案一：修复Electron安装（推荐尝试）

### 使用修复脚本

**macOS/Linux:**
```bash
./install-fix.sh
```

**Windows:**
双击运行 `install-fix.bat`

### 手动修复步骤

1. **清理现有安装**
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. **设置国内镜像源**
   ```bash
   npm config set registry https://registry.npmmirror.com/
   npm config set electron_mirror https://npmmirror.com/mirrors/electron/
   ```

3. **安装依赖**
   ```bash
   npm install marked highlight.js --save
   npm install electron@22.3.27 --save-dev
   ```

4. **启动应用**
   ```bash
   npm start
   ```

## 方案二：使用Web版本（立即可用）

我已经为你创建了一个完全基于Web技术的版本，无需安装任何依赖：

### 文件位置
```
web-version/
├── index.html      # 主页面
├── styles.css      # 样式文件
├── app.js          # 应用逻辑
└── README.md       # 使用说明
```

### 使用方法

1. **直接使用**
   ```bash
   cd web-version
   # 在浏览器中打开 index.html
   open index.html  # macOS
   # 或双击 index.html 文件
   ```

2. **本地服务器（推荐）**
   ```bash
   cd web-version
   
   # 使用Python
   python -m http.server 8080
   
   # 使用Node.js
   npx serve .
   
   # 使用PHP
   php -S localhost:8080
   ```
   
   然后访问 `http://localhost:8080`

### Web版本功能

✅ **完整功能**：
- 实时预览编辑
- 文件加载和管理
- 语法高亮
- 主题切换
- 本地存储
- 文件搜索
- 导出功能
- 快捷键支持

✅ **优势**：
- 无需安装依赖
- 跨平台兼容
- 轻量级
- 即开即用

## 推荐使用顺序

1. **首选**：直接使用Web版本（`web-version/index.html`）
2. **备选**：尝试修复Electron安装
3. **最后**：如果需要桌面应用体验，可以考虑其他打包方案

## 功能对比

| 功能 | Electron版 | Web版 |
|------|------------|-------|
| 文件扫描 | ✅ 递归扫描目录 | ✅ 手动加载文件 |
| 实时预览 | ✅ | ✅ |
| 语法高亮 | ✅ | ✅ |
| 主题切换 | ✅ | ✅ |
| 文件保存 | ✅ 直接保存 | ✅ 下载保存 |
| 跨平台 | ✅ 需要构建 | ✅ 浏览器即可 |
| 安装要求 | ❌ 需要Node.js | ✅ 无需安装 |

## 总结

Web版本已经提供了完整的Markdown编辑和阅读功能，建议你先使用Web版本体验功能。如果后续需要桌面应用的特定功能（如系统集成、文件关联等），再考虑解决Electron安装问题。

**立即开始使用：**
```bash
cd web-version
open index.html
```