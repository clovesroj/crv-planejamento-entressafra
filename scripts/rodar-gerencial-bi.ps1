# scripts/rodar-gerencial-bi.ps1
# Roda a extracao do relatorio GERENCIAL (R$/Ton, R$/Km) ate terminar,
# retomando sozinho se alguma fatia nao emplacar (mesmo padrao do
# rodar-gasto-bi.ps1). Mostra em qual mes/pagina/especialidade esta (titulo
# da janela + linha colorida).
#
# Uso: .\scripts\rodar-gerencial-bi.ps1 -Inicio 2025-11-01 -Fim 2026-09-26 -EmpresaFrota PFCMO-MG
#
# Padrao: as 7 especialidades de producao (caminhao, trator, colhedora...) x
# R$/Ton x R$/Km x todo mes do periodo -- fatias suficientes pra demorar.
# -Especialidades "COLHEDORA - CANA,TRATOR - CANA" restringe a so algumas.

param(
  [Parameter(Mandatory)] [string]$Inicio,
  [Parameter(Mandatory)] [string]$Fim,
  [string]$EmpresaFrota = "",
  [string]$Especialidades = "",
  [string]$FrotaPropria = "",
  [string]$Reforma = ""
)

$scriptArgs = @("scripts/gerencial-bi.mjs", "--inicio=$Inicio", "--fim=$Fim")
if ($EmpresaFrota) { $scriptArgs += "--empresafrota=$EmpresaFrota" }
if ($Especialidades) { $scriptArgs += "--especialidades=$Especialidades" }
if ($FrotaPropria) { $scriptArgs += "--frotapropria=$FrotaPropria" }
if ($Reforma) { $scriptArgs += "--reforma=$Reforma" }

while ($true) {
  node @scriptArgs 2>&1 | ForEach-Object {
    if ($_ -match '=== Fatia (\S+)\.\.(\S+) \[(.+?)\](.*) ===') {
      $host.UI.RawUI.WindowTitle = "Gerencial BI -- $($matches[3])$($matches[4]) $($matches[1])"
      Write-Host ""
      Write-Host ">>> $($matches[1]) a $($matches[2]) [$($matches[3])]$($matches[4]) <<<" -ForegroundColor Cyan
    } elseif ($_ -match '^--- fatia (\d+)/(\d+)') {
      Write-Host "[$($matches[1]) de $($matches[2])]" -ForegroundColor DarkCyan
    } elseif ($_ -match '^  Falhou') {
      Write-Host $_ -ForegroundColor Yellow
    } elseif ($_ -match '^Falhou|Desistindo') {
      Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match '^  Gravado') {
      Write-Host $_ -ForegroundColor Green
    } else {
      Write-Host $_
    }
  }
  if ($LASTEXITCODE -eq 0) { break }
  Write-Host "Ficou fatia pra tras -- tentando de novo em 10s..." -ForegroundColor Yellow
  Start-Sleep -Seconds 10
}
$host.UI.RawUI.WindowTitle = "Gerencial BI -- pronto"
Write-Host "PRONTO." -ForegroundColor Green
