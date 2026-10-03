# Starts everything for testing on your phone with Expo Go (or web / emulator).
#
# Run from the saaf folder:   .\dev.ps1
# (If PowerShell says scripts are disabled, run once:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned)
#
# It opens two windows:
#   1. "Saaf server" - the video server on port 8000
#   2. "Saaf app"    - Expo; scan its QR code with Expo Go (phone on the same Wi-Fi)
#                      or press w (web) / a (Android emulator) in that window.
# Close a window (or press Ctrl+C in it) to stop it.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Fresh PATH from Windows, so ffmpeg/python installed after this terminal opened are found.
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

# This PC's Wi-Fi address, so the phone can reach the video server.
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "localhost"; Write-Host "No Wi-Fi found: video will only work on web." -ForegroundColor Yellow }

$envFile = Join-Path $root "apps\app\.env"
@(
  "# Written by dev.ps1 - the video server address for the app (see .env.example)."
  "EXPO_PUBLIC_API_URL=http://${ip}:8000"
) | Set-Content -Path $envFile -Encoding utf8
Write-Host "Video server for the app: http://${ip}:8000"

$server = "Set-Location '$root\server'; `$host.UI.RawUI.WindowTitle = 'Saaf server'; " +
  ".\.venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
$app = "Set-Location '$root\apps\app'; `$host.UI.RawUI.WindowTitle = 'Saaf app'; npx expo start"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $server
Start-Process powershell -ArgumentList "-NoExit", "-Command", $app

Write-Host ""
Write-Host "Two windows opened:" -ForegroundColor Green
Write-Host "  Saaf server - if Windows Firewall asks, tick 'Private networks' and click Allow."
Write-Host "  Saaf app    - scan the QR code with Expo Go, or press w for web, a for the emulator."
Write-Host "In the app: About (at the bottom) should say 'video server ... connected'."
