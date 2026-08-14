@echo off
title S2PAS Server Starter
echo ===================================================
echo       MEMULAI S2PAS DASHBOARD DAN SERVER
echo ===================================================
echo.

echo 1. Menjalankan Backend Go...
start "S2PAS Backend" cmd /k "cd backend && go run cmd/server/main.go"

echo 2. Menjalankan Frontend Vite...
start "S2PAS Frontend" cmd /k "cd frontend && npm run dev"

echo 3. Menjalankan Cloudflare Tunnel...
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:5173"

echo.
echo ===================================================
echo SUKSES! 3 Jendela terminal baru telah terbuka.
echo Biarkan ketiga terminal tersebut tetap terbuka.
echo Untuk mematikan server, cukup silang (X) terminalnya.
echo ===================================================
pause