@echo off
rem VideoPlayer Asset Copy Script
rem This script copies necessary assets during the build process

echo 🎯 VideoPlayer - Copying assets...

rem Example: Copy WebRTC server files if needed
rem xcopy /E /I webrtc src-tauri\target\release\webrtc

rem Example: Copy additional resources  
rem xcopy /E /I resources src-tauri\target\release\resources

echo ✅ Assets copying completed
exit /b 0
