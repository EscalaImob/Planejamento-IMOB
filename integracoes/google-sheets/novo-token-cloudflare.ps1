# Gera um novo LEADS_SHEETS_TOKEN, grava no Cloudflare e copia para a área de transferência
# (para colar no Apps Script como LEADS_TOKEN). O valor nunca é impresso.
# Uso: powershell -ExecutionPolicy Bypass -File integracoes\google-sheets\novo-token-cloudflare.ps1

$ErrorActionPreference = 'Continue'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..\..'))

$b = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$token = -join ($b | ForEach-Object { $_.ToString('x2') })

$token | npx wrangler secret put LEADS_SHEETS_TOKEN
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gravar LEADS_SHEETS_TOKEN.' }

Set-Clipboard -Value $token
Write-Host ''
Write-Host 'Pronto. Novo token COPIADO. Cole com Ctrl+V no Valor de LEADS_TOKEN no Apps Script e salve.'
