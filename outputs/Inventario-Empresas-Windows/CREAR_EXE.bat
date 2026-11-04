@echo off
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto error
.venv\Scripts\python.exe -m PyInstaller --noconfirm --clean --onefile --windowed --name InventarioEmpresas --add-data "assets;assets" --hidden-import win32timezone main.py
if errorlevel 1 goto error
 echo Listo: dist\InventarioEmpresas.exe
 pause
 exit /b 0
:error
 echo No se pudo compilar. Revisa el mensaje anterior.
 pause
