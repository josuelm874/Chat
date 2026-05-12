@echo off
chcp 65001 > nul
title Chat UI — Agente de Testes

echo.
echo ╔══════════════════════════════════════════════╗
echo ║        Chat UI — Agente de Testes E2E        ║
echo ╚══════════════════════════════════════════════╝
echo.

cd /d "%~dp0.."

echo [1/3] Instalando dependências (Playwright + http-server)...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERRO: npm install falhou.
    pause
    exit /b 1
)

echo.
echo [2/3] Instalando browsers do Playwright (Chromium)...
call npx playwright install chromium
if %ERRORLEVEL% neq 0 (
    echo ERRO: instalação do Chromium falhou.
    pause
    exit /b 1
)

echo.
echo [3/3] Executando todos os testes...
echo.
call npx playwright test

echo.
echo ══════════════════════════════════════════════
echo  Testes concluídos. Abrindo relatório...
echo ══════════════════════════════════════════════
call npx playwright show-report tests\report

pause
