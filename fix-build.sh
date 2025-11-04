#!/bin/bash

echo "🔧 修复Electron打包网络问题..."

# 设置中国镜像源
echo "📦 设置npm镜像源..."
npm config set registry https://registry.npmmirror.com/
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/

# 设置环境变量
echo "🌐 设置环境变量..."
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
export ELECTRON_CACHE=$HOME/.cache/electron
export ELECTRON_BUILDER_CACHE=$HOME/.cache/electron-builder

# 清理缓存
echo "🧹 清理缓存..."
rm -rf node_modules/.cache
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder
rm -rf dist

# 重新安装依赖
echo "📥 重新安装依赖..."
npm install

# 预下载Electron
echo "⬇️ 预下载Electron..."
npx electron --version

echo "✅ 修复完成！现在可以尝试打包了"
echo ""
echo "🚀 运行以下命令进行打包："
echo "npm run pack    # 打包到目录"
echo "npm run build   # 完整打包"