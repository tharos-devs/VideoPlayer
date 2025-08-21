@echo off
setlocal EnableDelayedExpansion

rem VideoPlayer Development Environment Setup Script
rem For Windows

echo 🚀 Setting up VideoPlayer development environment...

rem Function to check if command exists
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Node.js not found. Please install Node.js from https://nodejs.org/
    echo Please install Node.js LTS version and re-run this script.
    pause
    exit /b 1
) else (
    echo [INFO] Node.js is already installed
    node --version
)

rem Check if npm exists
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. Please ensure Node.js is properly installed.
    pause
    exit /b 1
) else (
    echo [INFO] npm is available
    npm --version
)

rem Check if Rust is installed
where rustc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Rust not found. Installing Rust...
    echo Downloading and installing Rust via rustup...
    
    rem Download rustup-init.exe
    powershell -Command "& {Invoke-WebRequest -Uri 'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe' -OutFile 'rustup-init.exe'}"
    
    rem Run rustup-init with default settings
    rustup-init.exe -y --default-toolchain stable --profile default
    
    rem Clean up
    del rustup-init.exe
    
    rem Add Rust to PATH for current session
    set PATH=%USERPROFILE%\.cargo\bin;%PATH%
    
    echo [INFO] Rust installation completed. You may need to restart your terminal.
) else (
    echo [INFO] Rust is already installed
    rustc --version
)

rem Check if cargo exists
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Cargo not found. Adding to PATH...
    set PATH=%USERPROFILE%\.cargo\bin;%PATH%
    
    where cargo >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Cargo still not found. Please restart your terminal and re-run this script.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Cargo is available
    cargo --version
)

rem Install Visual Studio Build Tools if not present
echo [INFO] Checking for Visual Studio Build Tools...
where cl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Visual Studio Build Tools not found.
    echo Please install Visual Studio Build Tools or Visual Studio with C++ build tools.
    echo You can download it from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo.
    echo Required components:
    echo - MSVC v143 - VS 2022 C++ x64/x86 build tools
    echo - Windows 10/11 SDK
    echo.
    set /p continue="Continue without build tools? (y/N): "
    if /i not "!continue!"=="y" (
        echo Exiting. Please install build tools and re-run this script.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Visual Studio Build Tools found
)

rem FFmpeg is now bundled via ffmpeg-static npm package
echo [INFO] FFmpeg will be bundled automatically with the application

rem Install WebView2
echo [INFO] Installing WebView2 Runtime...
powershell -Command "& {try { $webview2 = Get-ItemProperty -Path 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}' -ErrorAction Stop; Write-Host '[INFO] WebView2 is already installed' } catch { Write-Host '[INFO] Downloading and installing WebView2...'; Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile 'MicrosoftEdgeWebview2Setup.exe'; Start-Process -FilePath 'MicrosoftEdgeWebview2Setup.exe' -ArgumentList '/silent /install' -Wait; Remove-Item 'MicrosoftEdgeWebview2Setup.exe' }}"

rem Install Tauri CLI
echo [INFO] Installing Tauri CLI...
where tauri >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    cargo install tauri-cli
) else (
    echo [INFO] Tauri CLI is already installed
)

rem Install npm dependencies
echo [INFO] Installing npm dependencies...
npm install

rem Create copy-assets.bat if it doesn't exist
if not exist "copy-assets.bat" (
    echo [INFO] Creating copy-assets.bat script...
    echo @echo off > copy-assets.bat
    echo rem Copy assets script >> copy-assets.bat
    echo echo Copying assets... >> copy-assets.bat
    echo rem Add your asset copying logic here >> copy-assets.bat
)

rem Verify installation
echo [INFO] Verifying installation...

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✅ Node.js: 
    node --version
) else (
    echo [ERROR] ❌ Node.js installation failed
)

where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✅ npm: 
    npm --version
) else (
    echo [ERROR] ❌ npm installation failed
)

where rustc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✅ Rust: 
    rustc --version
) else (
    echo [ERROR] ❌ Rust installation failed
)

where cargo >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✅ Cargo: 
    cargo --version
) else (
    echo [ERROR] ❌ Cargo installation failed
)

where tauri >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✅ Tauri CLI: 
    tauri --version
) else (
    echo [ERROR] ❌ Tauri CLI installation failed
)

echo [INFO] ✅ FFmpeg: Bundled automatically with the application

echo.
echo [INFO] 🎉 Setup complete! You can now run:
echo   npm run tauri:dev    - Start development server
echo   npm run tauri:build  - Build the application
echo.
echo [WARNING] Note: You may need to restart your terminal to update your PATH.

pause