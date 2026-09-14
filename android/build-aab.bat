@echo off
setlocal
cd /d "%~dp0"

if not exist "keystore.properties" (
  echo.
  echo ERROR: Falta android\keystore.properties.
  echo Copia keystore.properties.example a keystore.properties y configura tu upload key.
  echo Tambien puedes usar Android Studio ^> Build ^> Generate Signed App Bundle or APK.
  echo.
  exit /b 1
)

call gradlew.bat clean bundleRelease
if errorlevel 1 exit /b %errorlevel%

echo.
echo AAB generado en:
echo %CD%\app\build\outputs\bundle\release\app-release.aab
endlocal
