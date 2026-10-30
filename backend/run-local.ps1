$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'

if (-not (Test-Path -LiteralPath $envPath)) {
    throw 'Missing backend/.env. Copy .env.example to .env and set the local secrets first.'
}

foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^\s*([^#=\s]+)\s*=(.*)$') {
        $name = $Matches[1]
        $value = $Matches[2].Trim()
        if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

Push-Location $PSScriptRoot
try {
    & '.\mvnw.cmd' spring-boot:run
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
