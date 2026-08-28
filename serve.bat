@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

if not exist "%~dp0serve.py" (
  echo [ERROR] serve.py is missing. git clone did not finish.
  echo Paste this as ONE line in CMD:
  echo git clone https://github.com/DaveleeX/Procedural-Tank-web.git .
  echo.
  pause
  exit /b 1
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Using: py -3
  py -3 serve.py %*
  echo.
  if errorlevel 1 pause
  exit /b %ERRORLEVEL%
)

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Using: python
  python -c "import sys; print('Python', sys.version)" 2>nul
  if errorlevel 1 (
    echo [ERROR] "python" is not a real interpreter. Enable the Python install or run: py -3 serve.py
    pause
    exit /b 1
  )
  python serve.py %*
  echo.
  if errorlevel 1 pause
  exit /b %ERRORLEVEL%
)

where python3 >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Using: python3
  python3 serve.py %*
  echo.
  if errorlevel 1 pause
  exit /b %ERRORLEVEL%
)

echo [ERROR] Need Python 3 on PATH.
echo Install from https://www.python.org/downloads/ and tick "Add python.exe to PATH".
echo Then run: py -3 serve.py
pause
exit /b 1
