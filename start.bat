@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   Sin Barreras SaaS v1.6.3 - Inicio
echo ==========================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] Instalando o actualizando dependencias...
  call npm install
  if errorlevel 1 (
    echo [ERROR] No fue posible instalar dependencias.
    pause
    exit /b 1
  )
)

echo.
echo Verificando portal Cloudflare para QR remoto...
call npm run cloudflare:check >nul 2>nul
if errorlevel 1 (
  echo [INFO] cloudflared no esta instalado. Instalando...
  call npm run cloudflare:install
  if errorlevel 1 (
    echo [ERROR] No fue posible instalar cloudflared.
    echo [INFO] Ejecuta install.bat con Internet disponible y vuelve a intentar.
    pause
    exit /b 1
  )
) else (
  echo [OK] cloudflared disponible.
)

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  call node scripts\generate-session-secret.js
  echo [ERROR] Se creo .env. Configura MongoDB, Google, Stripe, OpenAI y Owner antes de iniciar.
  pause
  exit /b 1
)
call node scripts\generate-session-secret.js
if errorlevel 1 (
  echo [ERROR] No fue posible validar SESSION_SECRET.
  pause
  exit /b 1
)

echo.
echo Verificando .env...
call npm run check:env
if errorlevel 1 (
  pause
  exit /b 1
)

echo.
echo Iniciando Sin Barreras SaaS...
call npm start

if errorlevel 1 (
  echo.
  echo [ERROR] El servidor se detuvo con un error.
  pause
)
