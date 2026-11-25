@echo off
setlocal
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    py -m venv .venv || exit /b 1
)
".venv\Scripts\python.exe" -m pip install -r requirements.txt || exit /b 1
cd /d "%~dp0frontend"
call npm.cmd ci --legacy-peer-deps --no-audit || exit /b 1
call npm.cmd run build || exit /b 1
start "DentaCare web" cmd /k npm.cmd run dev -- --host localhost --port 5173 --strictPort
cd /d "%~dp0backend"
".venv\Scripts\python.exe" phase1_demo.py
