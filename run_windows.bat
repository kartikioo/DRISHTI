@echo off
title DRISHTI — Eyes for the Blind (Windows Host Runner)
color 0B

echo ==================================================================
echo    👁️  DRISHTI — ALL-IN-ONE WINDOWS HOST RUNNER
echo ==================================================================
echo.

:: Check for Python
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PY_CMD=python
    goto RUN
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PY_CMD=py
    goto RUN
)

where python3 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PY_CMD=python3
    goto RUN
)

echo [ERROR] Python was not found in your Windows PATH!
echo Please install Python from https://www.python.org/ or the Microsoft Store.
echo Make sure to check "Add Python to PATH" during installation.
echo.
pause
exit /b 1

:RUN
echo [INFO] Launching Drishti via %PY_CMD%...
echo.
%PY_CMD% main.py %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Drishti exited with an error code.
    pause
)
