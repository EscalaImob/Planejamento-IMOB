# Publica o site no Cloudflare Workers (plano gratuito) e grava os segredos da captura de leads.
# - Faz login no Cloudflare se necessário (abre o navegador).
# - Publica o Worker "escala-planejamento27".
# - Gera LEADS_SHEETS_TOKEN e LEADS_IP_SALT aleatórios (nunca impressos) e grava os três segredos.
# - Copia o token para a área de transferência, para colar no Apps Script como LEADS_TOKEN.
# Uso: powershell -ExecutionPolicy Bypass -File integracoes\google-sheets\configurar-cloudflare.ps1 -Webhook "https://script.google.com/macros/s/.../exec"
param([Parameter(Mandatory = $true)][string]$Webhook)

# 'Continue': no Windows PowerShell 5.1 a CLI escreve avisos no stderr; o sucesso é conferido por $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
if ($Webhook -notmatch '^https://script\.google\.com/macros/s/[^/]+/exec$') { throw 'Informe a URL /exec do App da Web do Apps Script.' }
$webhook = $Webhook
$raiz = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $raiz

function New-Segredo([int]$bytes) {
  $b = New-Object byte[] $bytes
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  -join ($b | ForEach-Object { $_.ToString('x2') })
}

Write-Host '1/4 Verificando login no Cloudflare...'
$logado = (npx wrangler whoami 2>&1 | Out-String) -match 'logged in with'
if (-not $logado) {
  Write-Host 'Faça login no Cloudflare (abre o navegador):'
  npx wrangler login
  if ($LASTEXITCODE -ne 0) { throw 'Login no Cloudflare não concluído.' }
}

Write-Host '2/4 Gerando o build e publicando (pode levar alguns minutos)...'
npm run cf:deploy
if ($LASTEXITCODE -ne 0) { throw 'Falha ao publicar no Cloudflare.' }

$token = New-Segredo 32   # 64 caracteres
$salt = New-Segredo 16    # 32 caracteres

Write-Host '3/4 Gravando os segredos no Cloudflare...'
foreach ($par in @(@('LEADS_SHEETS_WEBHOOK_URL', $webhook), @('LEADS_SHEETS_TOKEN', $token), @('LEADS_IP_SALT', $salt))) {
  $par[1] | npx wrangler secret put $par[0]
  if ($LASTEXITCODE -ne 0) { throw "Falha ao gravar $($par[0])." }
}

Set-Clipboard -Value $token
Write-Host ''
Write-Host '4/4 Pronto. O token foi COPIADO para a área de transferência.'
Write-Host '    No Apps Script (Configurações do projeto > Propriedades do script),'
Write-Host '    cole com Ctrl+V no campo Valor da propriedade LEADS_TOKEN e clique em Salvar.'
