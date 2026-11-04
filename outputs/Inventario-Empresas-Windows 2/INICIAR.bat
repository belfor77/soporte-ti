@echo off
cd /d "%~dp0"
py -3 --version >nul 2>&1
if errorlevel 1 (
 echo Instala Python 3.11 o superior desde python.org y vuelve a abrir este archivo.
 pause
 exit /b 1
)
if not exist .venv\Scripts\python.exe py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto error
.venv\Scripts\python.exe main.py
if errorlevel 1 goto error
exit /b 0
:error
 echo No se pudo iniciar. Revisa el mensaje anterior.
 pause
