#!/bin/bash

echo "🚀 简化打包流程..."

# 设置环境变量
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

# 只打包当前平台
echo "📦 开始打包..."
npx electron-builder --dir --config.mac.target=dir --config.win.target=dir --config.linux.target=dir

if [ $? -eq 0 ]; then
    echo "✅ 打包成功！"
    echo "📁 输出目录: dist/"
    ls -la dist/
else
    echo "❌ 打包失败"
    echo ""
    echo "🔧 尝试以下解决方案："
    echo "1. 运行: ./fix-build.sh"
    echo "2. 检查网络连接"
    echo "3. 尝试使用VPN"
    echo "4. 手动下载Electron: npm run install:electron"
fi