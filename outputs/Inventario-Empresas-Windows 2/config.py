# config.py
"""
Configuración global de la aplicación Inventario de Equipos.
Centraliza rutas, colores, textos y constantes usadas por el resto
de los módulos.
"""

import os
import sys


def get_base_path() -> str:
    """
    Devuelve la carpeta donde vive el ejecutable (o el script .py
    cuando se corre desde código fuente). Esto asegura que
    Inventario.xlsx y logs/ queden siempre junto al .exe, incluso
    cuando PyInstaller empaqueta todo en un solo archivo.
    """
    if getattr(sys, "frozen", False):
        # Ejecutándose como .exe generado por PyInstaller
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


BASE_PATH = get_base_path()

# ---------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------
EXCEL_FILENAME = "Inventario.xlsx"
EXCEL_PATH = os.path.join(BASE_PATH, EXCEL_FILENAME)

LOGS_DIR = os.path.join(BASE_PATH, "logs")
LOG_FILE = os.path.join(LOGS_DIR, "error.log")

ASSETS_DIR = os.path.join(BASE_PATH, "assets")
ICON_PATH = os.path.join(ASSETS_DIR, "icon.ico")
LOGO_PATH = os.path.join(ASSETS_DIR, "logo.png")

EXPORTS_DIR = os.path.join(BASE_PATH, "fichas_pdf")

# ---------------------------------------------------------------
# Empresas disponibles en el combo
# ---------------------------------------------------------------
EMPRESAS = ["VPrime", "Infinet", "T-Sales"]

# ---------------------------------------------------------------
# Columnas del Excel (orden exacto solicitado)
# ---------------------------------------------------------------
COLUMNAS_EXCEL = [
    "Fecha",
    "Usuario",
    "RUT",
    "Correo",
    "Empresa",
    "Dirección",
    "Equipo",
    "Modelo",
    "Número de Serie",
    "Marca",
    "Procesador",
    "RAM",
    "Almacenamiento",
    "Windows",
    "Estado",
    # Columnas opcionales adicionales
    "Usuario Windows",
    "Dominio",
    "IP",
    "MAC",
    "Build Windows",
    "Arquitectura",
]

ESTADO_INICIAL = "Activo"

# ---------------------------------------------------------------
# Paleta de colores - estilo corporativo Microsoft 365
# ---------------------------------------------------------------
COLOR_AZUL_PRINCIPAL = "#0F6CBD"
COLOR_AZUL_OSCURO = "#0B4F8A"
COLOR_AZUL_CLARO = "#DEECF9"
COLOR_BLANCO = "#FFFFFF"
COLOR_GRIS_CLARO = "#F3F2F1"
COLOR_GRIS_MEDIO = "#C8C6C4"
COLOR_GRIS_TEXTO = "#605E5C"
COLOR_VERDE_EXITO = "#107C10"
COLOR_VERDE_HOVER = "#0B5A0B"
COLOR_ROJO_ERROR = "#D13438"
COLOR_NEGRO_TEXTO = "#201F1E"

# ---------------------------------------------------------------
# Textos de la interfaz
# ---------------------------------------------------------------
APP_TITLE = "INVENTARIO DE EQUIPOS"
APP_WINDOW_TITLE = "Inventario de Equipos - Soporte TI"

FONT_FAMILY = "Segoe UI"

APP_VERSION = "1.0.0"
