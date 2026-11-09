@echo off
echo ===================================================
echo   ICELAUCH - BUILD ANDROID APK (PHONE & ANDROID TV)
echo ===================================================

echo [1/3] Building Web Dist Assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web build failed.
    exit /b %ERRORLEVEL%
)

echo [2/3] Syncing Capacitor Android Project...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed.
    exit /b %ERRORLEVEL%
)

echo [3/3] Compiling Android APK with Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gradle build failed. Please ensure Android SDK and Java JDK 17 are installed.
    cd ..
    exit /b %ERRORLEVEL%
)

cd ..
echo ===================================================
echo [SUCCESS] Android APK built successfully!
echo File location: android\app\build\outputs\apk\debug\app-debug.apk
echo ===================================================
pause

