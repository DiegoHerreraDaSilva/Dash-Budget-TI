@echo off
cd /d "%~dp0"
echo Instalando dependencias e compilando...
call npm install
call npm run build
echo.
echo Pronto. Agora rode iniciar-servidor.bat (ou configure o servico).
pause
