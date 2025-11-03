@echo off
chcp 65001 >nul

echo 🔧 修复 Electron 安装问题...

REM 清理现有安装
echo 📦 清理现有安装...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"

REM 设置国内镜像源
echo 🌐 设置国内镜像源...
npm config set registry https://registry.npmmirror.com/
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_custom_dir "22.3.27"
npm config set target_platform win32
npm config set target_arch x64
npm config set cache_min 999999999

REM 显示当前配置
echo 📋 当前 npm 配置:
npm config list | findstr "registry electron"

REM 安装基础依赖（不包含 Electron）
echo 📦 安装基础依赖...
npm install marked highlight.js --save

REM 单独安装 Electron
echo 🔧 安装 Electron...
npm install electron@22.3.27 --save-dev --verbose

REM 检查安装结果
if exist "node_modules\.bin\electron.cmd" (
    echo ✅ Electron 安装成功!
    echo 🚀 尝试启动应用...
    npm start
) else (
    echo ❌ Electron 安装失败
    echo 💡 请尝试以下解决方案:
    echo 1. 使用 VPN 或代理
    echo 2. 手动下载 Electron 二进制文件
    echo 3. 使用 yarn 代替 npm
)

pause