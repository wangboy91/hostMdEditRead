# 📦 Electron打包指南

## 🐛 问题分析

你遇到的错误是典型的网络连接问题：
```
read tcp 127.0.0.1:63249->127.0.0.1:7890: read: connection reset by peer
```

这表明：
1. **网络代理问题** - 端口7890通常是代理端口
2. **下载被中断** - Electron二进制文件下载失败
3. **镜像源问题** - 需要使用国内镜像

## 🔧 解决方案

### 方案1: 自动修复（推荐）
```bash
# 运行修复脚本
./fix-build.sh

# 然后尝试打包
npm run pack
```

### 方案2: 手动修复
```bash
# 1. 设置镜像源
npm config set registry https://registry.npmmirror.com/
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/

# 2. 清理缓存
rm -rf node_modules/.cache
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder

# 3. 重新安装
npm install

# 4. 预下载Electron
npx electron --version

# 5. 尝试打包
npm run pack
```

### 方案3: 简化打包
```bash
# 使用简化打包脚本
./build-simple.sh
```

## 🌐 网络环境配置

### 如果使用代理
```bash
# 设置代理（如果需要）
npm config set proxy http://127.0.0.1:7890
npm config set https-proxy http://127.0.0.1:7890

# 或者临时关闭代理
unset http_proxy
unset https_proxy
```

### 如果在公司网络
```bash
# 可能需要设置证书
npm config set strict-ssl false
```

## 📋 打包命令说明

| 命令 | 说明 | 输出 |
|------|------|------|
| `npm run pack` | 打包到目录（不压缩） | `dist/` 目录 |
| `npm run build` | 完整打包（生成安装包） | `.dmg`, `.exe` 等 |
| `npm run build:mac` | 只打包Mac版本 | `.dmg` 文件 |
| `./build-simple.sh` | 简化打包流程 | 当前平台版本 |

## 🎯 推荐的打包流程

### 1. 首次打包
```bash
# 修复环境
./fix-build.sh

# 测试打包（快速）
npm run pack

# 如果成功，再做完整打包
npm run build
```

### 2. 日常打包
```bash
# 直接打包
npm run pack
```

### 3. 发布打包
```bash
# 完整打包所有平台
npm run build
```

## 🔍 故障排除

### 问题1: 网络超时
```bash
# 解决方案：使用国内镜像
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
```

### 问题2: 代理冲突
```bash
# 解决方案：临时关闭代理
unset http_proxy https_proxy
npm run pack
```

### 问题3: 缓存问题
```bash
# 解决方案：清理所有缓存
rm -rf node_modules/.cache ~/.cache/electron ~/.cache/electron-builder
npm install
```

### 问题4: 权限问题
```bash
# 解决方案：修复权限
sudo chown -R $(whoami) ~/.npm ~/.cache
```

## 📁 打包输出说明

### 目录打包 (`npm run pack`)
```
dist/
├── mac-arm64/           # Mac ARM版本
│   └── Markdown Editor & Reader.app
├── mac-x64/             # Mac Intel版本
│   └── Markdown Editor & Reader.app
└── builder-effective-config.yaml
```

### 完整打包 (`npm run build`)
```
dist/
├── Markdown Editor & Reader-1.0.0-arm64.dmg    # Mac ARM安装包
├── Markdown Editor & Reader-1.0.0-x64.dmg      # Mac Intel安装包
└── latest-mac.yml                               # 更新信息
```

## 🚀 成功标志

打包成功后你会看到：
```
✅ 打包成功！
📁 输出目录: dist/
  • building        target=macOS zip arch=arm64 file=dist/Markdown Editor & Reader-darwin-arm64-1.0.0.zip
  • building        target=DMG arch=arm64 file=dist/Markdown Editor & Reader-1.0.0-arm64.dmg
```

## 💡 优化建议

1. **使用.npmrc文件** - 已自动创建，包含所有镜像配置
2. **预下载依赖** - 在打包前先运行 `npm run install:electron`
3. **分步打包** - 先用 `pack` 测试，再用 `build` 发布
4. **网络稳定** - 确保网络连接稳定，避免下载中断

现在运行 `./fix-build.sh` 开始修复吧！🎉