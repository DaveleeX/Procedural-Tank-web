@echo off
REM Double-click this file, or run it from CMD. Clones into a NEW folder
REM so the old empty Tank-web-preview-demo directory is left alone.
setlocal
set "DEST=F:\SynologyDrive\AI\Coding\OPT\Tank-atlas"
set "BRANCH=main"
set "REPO=https://github.com/DaveleeX/Procedural-Tank-web.git"

echo.
echo Clone destination:
echo   %DEST%
echo.

if exist "%DEST%\serve.py" goto :UPDATE
if exist "%DEST%" (
  echo %DEST% already exists and is not a complete copy.
  echo Delete that folder in Explorer and run this script again.
  pause
  exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
  echo git is not on PATH. Install Git for Windows, then retry:
  echo https://git-scm.com/download/win
  pause
  exit /b 1
)

echo Cloning. Wait until you see "done"...
git clone -b %BRANCH% %REPO% "%DEST%"
if errorlevel 1 (
  echo git clone failed.
  pause
  exit /b 1
)
goto :SERVE

:UPDATE
echo Already cloned. Pulling latest...
git -C "%DEST%" fetch origin
git -C "%DEST%" checkout %BRANCH%
git -C "%DEST%" pull
if errorlevel 1 (
  echo git pull failed.
  pause
  exit /b 1
)

:SERVE
cd /d "%DEST%"
echo.
echo Starting local server. Browser: http://127.0.0.1:8123/demo/tank-atlas/
echo Close this window to stop.
echo.
call "%DEST%\serve.bat"
