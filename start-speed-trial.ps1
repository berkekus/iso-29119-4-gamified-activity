# start-speed-trial.ps1
# Starts both the Socket.IO server and the Vite frontend in separate windows.
# Run from the repo root:  .\start-speed-trial.ps1

$root = $PSScriptRoot

Write-Host ""
Write-Host "=== Speed Trial Launcher ===" -ForegroundColor Cyan
Write-Host "Starting server  → http://localhost:3001" -ForegroundColor Green
Write-Host "Starting frontend → http://localhost:5173" -ForegroundColor Green
Write-Host ""

# Server window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\app\server'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2   # give the server a moment to bind the port

# Frontend window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\app'; npm run dev" -WindowStyle Normal

Write-Host "Two terminal windows opened." -ForegroundColor Yellow
Write-Host "Open http://localhost:5173 in your browser." -ForegroundColor Yellow
Write-Host ""
