@echo off
chcp 65001 >nul

echo 🚀 启动 Markdown Editor ^& Reader...

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查 npm 是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 npm
    echo 请先安装 npm
    pause
    exit /b 1
)

REM 检查是否存在 node_modules
if not exist "node_modules" (
    echo 📦 安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查 Electron 是否正确安装
if not exist "node_modules\.bin\electron.cmd" (
    echo 🔧 重新安装 Electron...
    npm install electron --save-dev
)

REM 启动应用
echo ✅ 启动应用...
npm start

pause