# Stophy CLI installer for Windows
# Usage: irm https://stophy.dev/install.ps1 | iex
#
# Environment variables:
#   STOPHY_INSTALL_DIR  - Override install directory
#   STOPHY_VERSION      - Install a specific version (default: latest)

$ErrorActionPreference = "Stop"

$Repo = "stophydotdev/cli"
$BinaryName = "stophy"

function Write-Info($msg) { Write-Host "info   " -ForegroundColor Blue -NoNewline; Write-Host $msg }
function Write-Warn($msg) { Write-Host "warn   " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Err($msg)  { Write-Host "error  " -ForegroundColor Red -NoNewline; Write-Host $msg }
function Write-Ok($msg)   { Write-Host "success" -ForegroundColor Green -NoNewline; Write-Host " $msg" }

function Get-LatestVersion {
    $url = "https://api.github.com/repos/$Repo/releases/latest"
    $release = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "stophy-installer" }
    return $release.tag_name -replace "^v", ""
}

function Get-Platform {
    $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
    switch ($arch) {
        "X64"   { return "x64" }
        "Arm64" { return "arm64" }
        default { throw "Unsupported architecture: $arch" }
    }
}

function Install-Stophy {
    $arch = Get-Platform
    Write-Info "Detected platform: windows-$arch"

    if ($env:STOPHY_VERSION) {
        $version = $env:STOPHY_VERSION -replace "^v", ""
        Write-Info "Installing specified version: v$version"
    } else {
        Write-Info "Fetching latest version..."
        $version = Get-LatestVersion
        Write-Info "Latest version: v$version"
    }

    if ($env:STOPHY_INSTALL_DIR) {
        $installDir = $env:STOPHY_INSTALL_DIR
    } else {
        $installDir = "$env:LOCALAPPDATA\stophy\bin"
    }

    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    }

    $binaryFile = "$BinaryName-windows-$arch.exe"
    $baseUrl = "https://github.com/$Repo/releases/download/v$version"
    $binaryUrl = "$baseUrl/$binaryFile"
    $checksumUrl = "$baseUrl/checksums.txt"

    $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) "stophy-install-$(Get-Random)"
    New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

    try {
        Write-Info "Downloading stophy v$version for windows-$arch..."
        Invoke-WebRequest -Uri $binaryUrl -OutFile "$tmpDir\stophy.exe" -UseBasicParsing

        Write-Info "Downloading checksums..."
        Invoke-WebRequest -Uri $checksumUrl -OutFile "$tmpDir\checksums.txt" -UseBasicParsing

        $checksums = Get-Content "$tmpDir\checksums.txt"
        $expectedLine = $checksums | Where-Object { $_ -match $binaryFile }
        if ($expectedLine) {
            $expectedHash = ($expectedLine -split "\s+")[0]
            $actualHash = (Get-FileHash "$tmpDir\stophy.exe" -Algorithm SHA256).Hash.ToLower()
            if ($actualHash -ne $expectedHash) {
                Write-Err "Checksum mismatch!"
                Write-Err "  Expected: $expectedHash"
                Write-Err "  Actual:   $actualHash"
                exit 1
            }
            Write-Info "Checksum verified."
        } else {
            Write-Warn "No checksum found for $binaryFile — skipping verification"
        }

        Write-Info "Installing to $installDir\stophy.exe..."
        Copy-Item "$tmpDir\stophy.exe" "$installDir\stophy.exe" -Force

        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$installDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
            Write-Warn "$installDir added to your PATH. Restart your terminal for changes to take effect."
        }

        Write-Host ""
        Write-Ok "Stophy CLI v$version installed successfully!"
        Write-Host ""
        Write-Host "  Run 'stophy --help' to get started."
        Write-Host "  Run 'stophy login' to authenticate."
        Write-Host ""
    } finally {
        Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
    }
}

Install-Stophy
