@echo off
title SYSTEM BOTTLENECK IDENTIFICATION OBSERVATORY
echo ===============================================================================
echo   Starting System Bottleneck Identification Using Correlation & Rank Correlation
echo ===============================================================================
echo.

:: Check python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

:: Run unified application launcher
python run_app.py

pause
