@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   Sin Barreras SaaS v1.6.1 - Instalacion
echo ==========================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado o no esta en PATH.
  echo Instala Node.js 20 o superior.
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 20 (
  echo [ERROR] Se requiere Node.js 20 o superior.
  node --version
  pause
  exit /b 1
)

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo [OK] Se creo .env.
)
call node scripts\generate-session-secret.js
if errorlevel 1 (
  echo [ERROR] No fue posible generar SESSION_SECRET.
  pause
  exit /b 1
)

echo.
echo Instalando dependencias...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install fallo.
  pause
  exit /b 1
)

echo.
echo Instalando portal publico Cloudflare para conversaciones QR...
call npm run cloudflare:install
if errorlevel 1 (
  echo [ERROR] No fue posible instalar cloudflared.
  echo [INFO] La app puede iniciar, pero el QR entre redes no funcionara hasta instalarlo.
  pause
  exit /b 1
)

echo.
echo [OK] Dependencias y cloudflared instalados.
echo [SIGUIENTE] Abre .env, configura MONGODB_URI, Google, Stripe, OpenAI y Owner.
echo [SIGUIENTE] Luego ejecuta start.bat.
echo.
pause
