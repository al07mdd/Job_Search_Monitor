@echo off
echo Starting Job Tracker (Single Server Mode)...

:: Activate Virtual Environment and Start App
:: Since backend serves frontend files, we only need Uvicorn running
start "JobTracker Server" cmd /k "call .venv\Scripts\activate.bat && uvicorn backend.main:app --host 0.0.0.0 --port 8000"

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

:: Open application in default browser
start http://localhost:8000

echo ===================================================
echo  Job Tracker is running!
echo  Access it at: http://localhost:8000
echo ===================================================
