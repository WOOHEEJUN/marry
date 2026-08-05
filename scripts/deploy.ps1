# ══════════════════════════════════════════════════════════════
# 🚨 총각 검거 작전 — 원커맨드 배포
#   로컬 빌드 → 서버 전송 → 재시작   (약 20~30초)
#   사용법:  npm run deploy
# ══════════════════════════════════════════════════════════════
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$SERVER  = 'root@158.247.222.58'
$KEY     = "$env:USERPROFILE\.ssh\ai_trader_vultr"
$REMOTE  = '/opt/marry'
$ROOT    = Split-Path $PSScriptRoot -Parent

function Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }

if (-not (Test-Path $KEY)) {
  Write-Host "SSH 키를 찾을 수 없습니다: $KEY" -ForegroundColor Red
  Write-Host "노트북에서 배포하려면 키를 같은 경로에 복사하세요." -ForegroundColor Yellow
  exit 1
}

Push-Location $ROOT
try {
  # ── 1. 빌드 (서버 스펙이 낮으므로 반드시 로컬에서) ──
  Step 1 '프론트 빌드 중...'
  npm run build
  if ($LASTEXITCODE -ne 0) { throw '빌드 실패' }

  # ── 2. 패키징 ──
  Step 2 '패키지 생성 중...'
  $tmp = Join-Path $env:TEMP 'marry-deploy'
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  New-Item -ItemType Directory -Path $tmp -Force | Out-Null

  Copy-Item "$ROOT\dist"    "$tmp\dist"   -Recurse
  Copy-Item "$ROOT\server"  "$tmp\server" -Recurse
  New-Item -ItemType Directory -Path "$tmp\scripts" -Force | Out-Null
  Copy-Item "$ROOT\scripts\migrate-config.mjs" "$tmp\scripts\"
  Copy-Item "$ROOT\package.json"      "$tmp\"
  Copy-Item "$ROOT\package-lock.json" "$tmp\" -ErrorAction SilentlyContinue
  # config.json 은 서버 것이 우선 (당일 수정분 보존) — 없을 때만 복사되도록 별도 이름
  Copy-Item "$ROOT\config.json" "$tmp\config.default.json"

  $tar = Join-Path $env:TEMP 'marry.tar.gz'
  if (Test-Path $tar) { Remove-Item $tar -Force }
  tar -czf $tar -C $tmp .
  $size = [math]::Round((Get-Item $tar).Length / 1MB, 2)
  Write-Host "    패키지 크기: $size MB" -ForegroundColor DarkGray

  # ── 3. 전송 ──
  Step 3 '서버로 전송 중...'
  & scp -i $KEY -o StrictHostKeyChecking=accept-new $tar "${SERVER}:/tmp/marry.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw '전송 실패' }

  # ── 4. 서버에서 설치 + 재시작 ──
  #   (파이프로 넘기면 BOM/CRLF 때문에 bash 가 깨지므로 파일로 전송해서 실행)
  Step 4 '서버 설치 및 재시작...'
  #   Get-Content -Raw 는 Windows PowerShell 5.1 에서 ANSI 로 읽어 한글을 깨뜨리므로
  #   반드시 .NET API 로 UTF-8 을 명시해 읽고 쓴다.
  $shSrc = Join-Path $ROOT 'scripts\remote-install.sh'
  $shTmp = Join-Path $env:TEMP 'marry-remote-install.sh'
  $utf8  = New-Object System.Text.UTF8Encoding($false)
  $body  = [System.IO.File]::ReadAllText($shSrc, $utf8) -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($shTmp, $body, $utf8)

  & scp -i $KEY -o StrictHostKeyChecking=accept-new $shTmp "${SERVER}:/tmp/marry-install.sh"
  if ($LASTEXITCODE -ne 0) { throw '설치 스크립트 전송 실패' }

  & ssh -i $KEY -o StrictHostKeyChecking=accept-new $SERVER 'bash /tmp/marry-install.sh'
  if ($LASTEXITCODE -ne 0) { throw '서버 설치 실패' }

  # ── 5. 확인 ──
  Step 5 '동작 확인...'
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-RestMethod -Uri 'https://158-247-222-58.sslip.io/api/health' -TimeoutSec 10
    Write-Host "    OK · uptime $([math]::Round($r.up,1))s" -ForegroundColor Green
  } catch {
    Write-Host "    헬스체크 실패 (서버 로그 확인 필요): $_" -ForegroundColor Yellow
  }

  Write-Host "`n✅ 배포 완료!" -ForegroundColor Green
  Write-Host "   📺 TV     https://158-247-222-58.sslip.io/tv"
  Write-Host "   📱 관전   https://158-247-222-58.sslip.io/"
  Write-Host "   🎛 진행자 https://158-247-222-58.sslip.io/control"
  Write-Host "   ⚙️ 설정   https://158-247-222-58.sslip.io/admin`n"
}
finally {
  Pop-Location
}
