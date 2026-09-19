@echo off
setlocal
cd /d "%~dp0"

set "KEYSTORE_NAME=sin-barreras-upload-key.jks"
set "KEY_ALIAS=sinbarreras-upload"

where keytool >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: No se encontro keytool. Instala JDK 17 o superior y vuelve a ejecutar.
  echo.
  exit /b 1
)

if exist "%KEYSTORE_NAME%" (
  echo.
  echo Ya existe: %CD%\%KEYSTORE_NAME%
  echo NO se creara otra upload key para evitar perder la clave que usa Google Play.
  echo.
  exit /b 2
)

echo.
echo ==================================================
echo   Sin Barreras - Crear Upload Key para Google Play
echo ==================================================
echo.
echo IMPORTANTE: guarda este .jks y su password en un lugar seguro.
echo Si ya tienes una upload key registrada para esta app, NO crees otra.
echo.

keytool -genkeypair -v ^
  -keystore "%KEYSTORE_NAME%" ^
  -alias "%KEY_ALIAS%" ^
  -keyalg RSA ^
  -keysize 4096 ^
  -validity 10000

if errorlevel 1 exit /b %errorlevel%

echo.
echo Upload key creada:
echo %CD%\%KEYSTORE_NAME%
echo.
echo Siguiente paso:
echo 1. Copia keystore.properties.example a keystore.properties
echo 2. Pon storeFile=%CD%\%KEYSTORE_NAME%
echo 3. Pon los passwords que acabas de crear.
echo 4. Ejecuta build-aab.bat
echo.
endlocal
