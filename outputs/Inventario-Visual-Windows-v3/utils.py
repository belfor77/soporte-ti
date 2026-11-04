# utils.py
"""
Funciones utilitarias: validaciones de formulario, formato de RUT,
formato de correo, fecha/hora y utilidades varias (portapapeles,
apertura de archivos con la app predeterminada del sistema).
"""

import os
import re
import subprocess
import sys
from datetime import datetime

from logger import log

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# RUT chileno: acepta con o sin puntos, con guión antes del dígito
# verificador. Ej: 12.345.678-9 / 12345678-9 / 12345678-K
RUT_REGEX = re.compile(r"^\d{1,2}(\.?\d{3}){2}-[\dkK]$|^\d{7,8}-[\dkK]$")


def validar_correo(correo: str) -> bool:
    """Valida formato básico de correo electrónico."""
    if not correo:
        return False
    return bool(EMAIL_REGEX.match(correo.strip()))


def validar_rut(rut: str) -> bool:
    """
    Valida que el RUT no esté vacío y tenga un formato razonable.
    No calcula el dígito verificador (no fue solicitado), solo
    valida formato/estructura para evitar campos vacíos o basura.
    """
    if not rut or not rut.strip():
        return False
    rut_limpio = rut.strip().upper()
    return bool(RUT_REGEX.match(rut_limpio))


def limpiar_rut(rut: str) -> str:
    """Normaliza el RUT quitando espacios extra."""
    return rut.strip().upper()


def campo_no_vacio(valor: str) -> bool:
    """Valida que un campo de texto no esté vacío ni sean solo espacios."""
    return bool(valor and valor.strip())


def fecha_hora_actual() -> str:
    """Fecha y hora actual en formato legible para el Excel."""
    return datetime.now().strftime("%d-%m-%Y %H:%M:%S")


def fecha_hora_archivo() -> str:
    """Fecha y hora en formato seguro para nombres de archivo."""
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def copiar_al_portapapeles(texto: str) -> bool:
    """
    Copia texto al portapapeles de Windows.
    Devuelve True si tuvo éxito, False en caso contrario.
    """
    try:
        import win32clipboard  # pywin32

        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardText(texto, win32clipboard.CF_TEXT)
        win32clipboard.CloseClipboard()
        return True
    except Exception as exc:
        log.error(f"Error copiando al portapapeles: {exc}")
        return False


def abrir_archivo(ruta: str) -> bool:
    """Abre un archivo con la aplicación predeterminada del sistema."""
    try:
        if not os.path.exists(ruta):
            log.warning(f"Se intentó abrir un archivo inexistente: {ruta}")
            return False

        if sys.platform.startswith("win"):
            os.startfile(ruta)  # type: ignore[attr-defined]
        elif sys.platform.startswith("darwin"):
            subprocess.Popen(["open", ruta])
        else:
            subprocess.Popen(["xdg-open", ruta])
        return True
    except Exception as exc:
        log.error(f"Error abriendo archivo {ruta}: {exc}")
        return False


def bytes_a_gb(valor_bytes: int) -> float:
    """Convierte bytes a gigabytes con 2 decimales."""
    try:
        return round(valor_bytes / (1024 ** 3), 2)
    except Exception:
        return 0.0
