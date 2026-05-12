@echo off
title Chat UI - Executar Testes

cd /d "%~dp0.."

echo.
echo Executando testes do Chat UI...
echo.

call npx playwright test

echo.
echo Abrindo relatorio HTML...
call npx playwright show-report tests\report

pause
