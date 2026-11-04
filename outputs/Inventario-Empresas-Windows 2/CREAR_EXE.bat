@echo off
setlocal
 title Preparar Inventario Empresas
cd /d "%~dp0"
echo ==================================================
echo   CREAR INVENTARIO EMPRESAS PARA WINDOWS
echo ==================================================
echo.
echo [1/4] Comprobando Python...
py -3 --version
if errorlevel 1 goto sin_python
echo.
echo [2/4] Preparando herramientas. Puede tardar unos minutos...
if exist .venv\Scripts\python.exe goto instalar
py -3 -m venv .venv
if errorlevel 1 goto error
:instalar
echo.
echo [3/4] Descargando dependencias. Requiere internet...
.venv\Scripts\python.exe -u -m pip install --disable-pip-version-check --progress-bar off --timeout 30 -r requirements.txt
if errorlevel 1 goto error
echo.
echo [4/4] Generando el ejecutable. Espera a que aparezca LISTO...
.venv\Scripts\python.exe -u -m PyInstaller --noconfirm --clean --onefile --windowed --name InventarioEmpresas --add-data "assets;assets" --add-data "conexion.json;." --hidden-import win32timezone main.py
if errorlevel 1 goto error
echo.
echo LISTO: dist\InventarioEmpresas.exe
explorer "%~dp0dist"
pause
exit /b 0
:sin_python
echo.
echo No se pudo ejecutar Python con el comando py.
echo Instala Python 3.11 o superior con Python Launcher y vuelve a intentar.
pause
exit /b 1
:error
echo.
echo No se pudo terminar. Envia una captura del mensaje anterior.
pause
exit /b 1
