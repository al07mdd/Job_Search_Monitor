@echo off
echo Starting Job Tracker...

:: Start Backend
start "JobTracker Backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn backend.main:app --reload"

:: Start Frontend
start "JobTracker Frontend" cmd /k "cd frontend && npm run dev"

echo Done! open http://localhost:5173
