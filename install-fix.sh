#!/bin/bash

echo "🔧 修复 Electron 安装问题..."

# 清理现有安装
echo "📦 清理现有安装..."
rm -rf node_modules
rm -f package-lock.json

# 设置国内镜像源
echo "🌐 设置国内镜像源..."
npm config set registry https://registry.npmmirror.com/
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_custom_dir "22.3.27"
npm config set target_platform darwin
npm config set target_arch x64
npm config set cache_min 999999999

# 显示当前配置
echo "📋 当前 npm 配置:"
npm config list | grep -E "(registry|electron)"

# 安装基础依赖（不包含 Electron）
echo "📦 安装基础依赖..."
npm install marked highlight.js --save

# 单独安装 Electron
echo "🔧 安装 Electron..."
npm install electron@22.3.27 --save-dev --verbose

# 检查安装结果
if [ -f "node_modules/.bin/electron" ]; then
    echo "✅ Electron 安装成功!"
    echo "🚀 尝试启动应用..."
    npm start
else
    echo "❌ Electron 安装失败"
    echo "💡 请尝试以下解决方案:"
    echo "1. 使用 VPN 或代理"
    echo "2. 手动下载 Electron 二进制文件"
    echo "3. 使用 yarn 代替 npm"
fi