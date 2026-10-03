# Builds the Android test APK (task 5.3) into ..\..\builds\saaf-<version>-test.apk
#
# Usage (PowerShell, inside apps\app):
#   .\scripts\build-apk.ps1                 # uses this PC's Wi-Fi IP for the video server
#   .\scripts\build-apk.ps1 -ServerIp 192.168.1.23
#
# The phone must be on the same Wi-Fi as this PC, and the server must run with
# --host 0.0.0.0 (see server\README.md). Rebuild when the PC's IP changes.
param([string]$ServerIp = "")

$ErrorActionPreference = "Stop"
$app = Split-Path -Parent $PSScriptRoot

if (-not $ServerIp) {
  $ServerIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
}
if (-not $ServerIp) { throw "Could not find the Wi-Fi IP. Pass it: -ServerIp 192.168.x.y" }

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:EXPO_PUBLIC_API_URL = "http://${ServerIp}:8000"
$env:NODE_ENV = "production"
Write-Host "Video server for this APK: $env:EXPO_PUBLIC_API_URL"

Push-Location $app
try {
  $env:CI = "1"
  npx expo prebuild --platform android --clean
  Push-Location android
  # Low-memory friendly: one ABI (arm64, all modern phones), 2 workers, bigger Metaspace.
  .\gradlew.bat assembleRelease --no-daemon --max-workers=2 "-Dorg.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=1g" -Porg.gradle.parallel=false -PreactNativeArchitectures=arm64-v8a
  if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
  Pop-Location

  $version = (Get-Content app.json | ConvertFrom-Json).expo.version
  $out = Join-Path (Split-Path -Parent (Split-Path -Parent $app)) "builds"
  New-Item -ItemType Directory -Force $out | Out-Null
  $apk = Join-Path $out "saaf-$version-test.apk"
  Copy-Item android\app\build\outputs\apk\release\app-release.apk $apk -Force
  Write-Host "APK ready: $apk"
} finally {
  Pop-Location
}
