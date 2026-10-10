$ErrorActionPreference = 'Stop'

$siteName = 'BrewLite'
$hostName = 'mywebsite.local'
$port = 8080
$root = 'C:\inetpub\BrewLite'
$zip = Join-Path $PSScriptRoot 'brewlite-ui.zip'

if (-not (Get-Command Install-WindowsFeature -ErrorAction SilentlyContinue)) {
    throw 'Must run as Administrator on Windows Server.'
}

if (-not (Test-Path $zip)) {
    throw "Missing $zip"
}

if (-not (Get-WindowsFeature Web-Server).Installed) {
    Install-WindowsFeature Web-Server -IncludeManagementTools | Out-Null
}

if (Test-Path $root) {
    Remove-Item $root -Recurse -Force
}
Expand-Archive -Path $zip -DestinationPath $root -Force
Copy-Item (Join-Path $PSScriptRoot 'web.config') (Join-Path $root 'web.config') -Force

Import-Module WebAdministration

if (-not (Test-Path "IIS:\AppPools\$siteName")) {
    New-WebAppPool -Name $siteName
}
Set-ItemProperty "IIS:\AppPools\$siteName" -Name managedRuntimeVersion -Value ''

if (Test-Path "IIS:\Sites\$siteName") {
    Remove-Item "IIS:\Sites\$siteName" -Recurse -Force
}

New-Website -Name $siteName -PhysicalPath $root -Port $port -HostHeader $hostName -ApplicationPool $siteName
Set-ItemProperty "IIS:\Sites\$siteName" -Name defaultDocument -Value @('index.html')
Start-Website -Name $siteName

if (Get-Command New-NetFirewallRule -ErrorAction SilentlyContinue) {
    if (-not (Get-NetFirewallRule -DisplayName 'BrewLite 8080' -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName 'BrewLite 8080' -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
    }
}

Write-Output "READY http://${hostName}:${port}/"