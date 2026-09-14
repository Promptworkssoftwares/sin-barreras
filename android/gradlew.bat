@echo off
setlocal enabledelayedexpansion
set "GRADLE_VERSION=9.6.1"
set "CACHE_DIR=%USERPROFILE%\.gradle\sin-barreras-wrapper"
set "GRADLE_HOME=%CACHE_DIR%\gradle-%GRADLE_VERSION%"
set "ZIP_FILE=%CACHE_DIR%\gradle-%GRADLE_VERSION%-bin.zip"
set "GRADLE_BAT=%GRADLE_HOME%\bin\gradle.bat"

if not exist "%GRADLE_BAT%" (
  echo [Sin Barreras] Preparando Gradle %GRADLE_VERSION%...
  if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"
  if not exist "%ZIP_FILE%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing 'https://services.gradle.org/distributions/gradle-%GRADLE_VERSION%-bin.zip' -OutFile '%ZIP_FILE%'"
    if errorlevel 1 goto :download_error
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%ZIP_FILE%' -DestinationPath '%CACHE_DIR%' -Force"
  if errorlevel 1 goto :extract_error
)

call "%GRADLE_BAT%" %*
exit /b %errorlevel%

:download_error
echo ERROR: No se pudo descargar Gradle desde services.gradle.org.
exit /b 1

:extract_error
echo ERROR: No se pudo extraer Gradle.
exit /b 1
