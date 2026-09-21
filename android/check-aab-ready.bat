@echo off
setlocal
cd /d "%~dp0"

echo ==================================================
echo   Sin Barreras - AAB readiness check
echo ==================================================
echo.

where java >nul 2>nul || (echo [FALTA] Java/JDK en PATH & exit /b 1)
findstr /R /C:"^android.useAndroidX=true$" "gradle.properties" >nul || (echo [ERROR] android.useAndroidX debe estar en true en gradle.properties & exit /b 1)
if not exist "keystore.properties" (echo [FALTA] android\keystore.properties & exit /b 1)
findstr /C:"CHANGE_ME" "keystore.properties" >nul && (echo [ERROR] keystore.properties aun contiene CHANGE_ME & exit /b 1)

for /f "tokens=1,* delims==" %%A in (keystore.properties) do if /I "%%A"=="storeFile" set "STORE_FILE=%%B"
if not defined STORE_FILE (echo [ERROR] Falta storeFile en keystore.properties & exit /b 1)
if not exist "%STORE_FILE%" (echo [ERROR] No existe el keystore: %STORE_FILE% & exit /b 1)

echo [OK] JDK disponible
echo [OK] AndroidX habilitado
echo [OK] keystore.properties configurado
echo [OK] upload key encontrada
echo [OK] package: com.promptworks.sinbarreras
echo [OK] subscription: sin_barreras_monthly
echo [OK] trial offer esperado: 7 dias / tag sb-7-day-trial
echo.
echo Ya puedes ejecutar build-aab.bat
endlocal
