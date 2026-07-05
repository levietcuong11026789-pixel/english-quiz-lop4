@echo off
title English Fun 4 - Server
echo ============================================
echo   English Fun 4 dang chay!
echo   Tren dien thoai (cung Wi-Fi), mo trinh duyet va vao:
echo.
echo       http://192.168.1.14:8123
echo.
echo   Dong cua so nay de tat server.
echo ============================================
npx -y http-server "%~dp0" -p 8123 -c-1
pause
