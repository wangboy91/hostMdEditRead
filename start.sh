#!/bin/bash

# Markdown Editor & Reader 启动脚本

echo "🚀 启动 Markdown Editor & Reader..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    echo "请先安装 npm"
    exit 1
fi

# 检查是否存在 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查 Electron 是否正确安装
if [ ! -f "node_modules/.bin/electron" ]; then
    echo "🔧 重新安装 Electron..."
    npm install electron --save-dev
fi

# 启动应用
echo "✅ 启动应用..."
npm start