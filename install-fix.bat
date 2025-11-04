@echo off
chcp 65001 >nul

echo Installing dependencies for Markdown Editor...

REM Check if .npmrc exists (mirrors already configured)
if exist ".npmrc" (
    echo Mirror sources already configured in .npmrc
) else (
    echo Setting up mirror sources...
    npm config set registry https://registry.npmmirror.com/
    npm config set electron_mirror https://npmmirror.com/mirrors/electron/
)

REM Clean node_modules if it exists but is incomplete
if exist "node_modules" (
    if not exist "node_modules\.bin\electron.cmd" (
        echo Cleaning incomplete installation...
        rmdir /s /q "node_modules"
    )
)

REM Install all dependencies at once
echo Installing all dependencies...
npm install

REM Check installation result
if exist "node_modules\.bin\electron.cmd" (
    echo Installation successful!
    echo Starting application...
    npm start
) else (
    echo Installation failed
    echo Trying alternative installation method...
    npm install electron@22.3.27 --save-dev --verbose
    if exist "node_modules\.bin\electron.cmd" (
        echo Electron installed successfully!
        npm start
    ) else (
        echo Installation still failed. Please check your network connection.
    )
)

pause