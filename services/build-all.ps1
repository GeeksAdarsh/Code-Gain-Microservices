# build-all.ps1 — Build all microservices on Windows (PowerShell)
# Run from the services\ directory.
$ErrorActionPreference = "Stop"

Write-Host "==> Installing shared-lib..." -ForegroundColor Cyan
Push-Location shared-lib; mvn install -DskipTests -q; Pop-Location

Write-Host "==> Building api-gateway..." -ForegroundColor Cyan
Push-Location api-gateway; mvn package -DskipTests -q; Pop-Location

$services = @("auth-service","user-service","question-service","execution-service","test-service","proctoring-service","integrity-service","notification-service")
foreach ($svc in $services) {
    Write-Host "==> Building $svc..." -ForegroundColor Cyan
    Push-Location $svc; mvn package -DskipTests -q; Pop-Location
}

Write-Host "All services built successfully." -ForegroundColor Green
