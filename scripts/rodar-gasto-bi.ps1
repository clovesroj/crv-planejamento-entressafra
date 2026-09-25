# scripts/rodar-gasto-bi.ps1
# Roda a extracao do gasto real (Power BI) ate terminar, retomando sozinho se
# a rede cair. Mostra em qual semana esta (titulo da janela + linha colorida).
#
# Uso: .\scripts\rodar-gasto-bi.ps1 -Inicio 2025-12-01 -Fim 2026-09-24

param(
  [Parameter(Mandatory)] [string]$Inicio,
  [Parameter(Mandatory)] [string]$Fim,
  [string]$EmpresaFrota = ""
)

$env:DATABASE_URL = (Get-Content .env | Select-String 'DATABASE_URL=(.*)').Matches.Groups[1].Value

$scriptArgs = @("scripts/gasto-reforma-bi.mjs", "--inicio=$Inicio", "--fim=$Fim", "--passo=semana", "--banco=$env:DATABASE_URL")
if ($EmpresaFrota) { $scriptArgs += "--empresafrota=$EmpresaFrota" }

while ($true) {
  node @scriptArgs 2>&1 | ForEach-Object {
    if ($_ -match '=== Fatia (\S+)\.\.(\S+)') {
      $host.UI.RawUI.WindowTitle = "Gasto BI -- semana $($matches[1])"
      Write-Host ""
      Write-Host ">>> $($matches[1]) a $($matches[2]) <<<" -ForegroundColor Cyan
    } elseif ($_ -match '^--- fatia (\d+)/(\d+)') {
      Write-Host "[$($matches[1]) de $($matches[2])]" -ForegroundColor DarkCyan
    } elseif ($_ -match '^Falhou') {
      Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match 'Banco atualizado') {
      Write-Host $_ -ForegroundColor Green
    } else {
      Write-Host $_
    }
  }
  if ($LASTEXITCODE -eq 0) { break }
  Write-Host "Falhou -- tentando de novo em 10s..." -ForegroundColor Yellow
  Start-Sleep -Seconds 10
}
$host.UI.RawUI.WindowTitle = "Gasto BI -- pronto"
Write-Host "PRONTO." -ForegroundColor Green
