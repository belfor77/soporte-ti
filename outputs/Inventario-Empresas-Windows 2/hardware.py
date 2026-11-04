# hardware.py
"""
Módulo encargado de extraer toda la información de hardware y
software del equipo usando WMI, psutil, platform y PowerShell.

Todas las funciones están pensadas para ejecutarse en Windows.
Cada extracción individual está protegida con try/except para que
un solo dato faltante no impida obtener el resto de la información.
"""

import platform
import socket
import subprocess
import uuid

import psutil
from identity import valid_serial

from config import ESTADO_INICIAL
from logger import log
from utils import bytes_a_gb, fecha_hora_actual

try:
    import wmi  # type: ignore
except ImportError:
    wmi = None  # Permite importar el módulo en sistemas no-Windows para pruebas


def _conectar_wmi():
    """Crea y devuelve una conexión WMI, o None si falla."""
    if wmi is None:
        log.error("El módulo 'wmi' no está disponible en este sistema.")
        return None
    try:
        return wmi.WMI()
    except Exception as exc:
        log.error(f"No se pudo conectar a WMI: {exc}")
        return None


def _ejecutar_powershell(comando: str) -> str:
    """Ejecuta un comando PowerShell y devuelve su salida como texto."""
    try:
        resultado = subprocess.run(
            ["powershell", "-NoProfile", "-Command", comando],
            capture_output=True,
            text=True,
            timeout=15,
            creationflags=subprocess.CREATE_NO_WINDOW
            if hasattr(subprocess, "CREATE_NO_WINDOW")
            else 0,
        )
        return resultado.stdout.strip()
    except Exception as exc:
        log.error(f"Error ejecutando PowerShell ('{comando}'): {exc}")
        return ""


# ---------------------------------------------------------------
# Extracción por categoría
# ---------------------------------------------------------------

def obtener_info_sistema(conexion) -> dict:
    """Nombre de equipo, marca, modelo, número de serie, fabricante."""
    datos = {
        "equipo": platform.node() or "Desconocido",
        "marca": "Desconocido",
        "modelo": "Desconocido",
        "numero_serie": "Desconocido",
        "fabricante": "Desconocido",
    }
    try:
        if conexion:
            for sistema in conexion.Win32_ComputerSystem():
                datos["marca"] = (sistema.Manufacturer or "Desconocido").strip()
                datos["modelo"] = (sistema.Model or "Desconocido").strip()
                datos["fabricante"] = datos["marca"]

            for bios in conexion.Win32_BIOS():
                if bios.SerialNumber:
                    datos["numero_serie"] = bios.SerialNumber.strip()
    except Exception as exc:
        log.error(f"Error obteniendo info de sistema: {exc}")

    if not valid_serial(datos['numero_serie']):
        # CIM works even when the Python WMI connection is unavailable.
        serie = _ejecutar_powershell("(Get-CimInstance -ClassName Win32_BIOS -ErrorAction Stop).SerialNumber")
        if not valid_serial(serie):
            serie = _ejecutar_powershell("(Get-CimInstance -ClassName Win32_ComputerSystemProduct -ErrorAction Stop).IdentifyingNumber")
        if valid_serial(serie):
            datos['numero_serie'] = serie.strip()
    return datos


def obtener_info_procesador(conexion) -> dict:
    """Procesador completo, núcleos e hilos."""
    datos = {
        "procesador": "Desconocido",
        "nucleos": psutil.cpu_count(logical=False) or 0,
        "hilos": psutil.cpu_count(logical=True) or 0,
    }
    try:
        if conexion:
            for cpu in conexion.Win32_Processor():
                if cpu.Name:
                    datos["procesador"] = cpu.Name.strip()
                if cpu.NumberOfCores:
                    datos["nucleos"] = cpu.NumberOfCores
                if cpu.NumberOfLogicalProcessors:
                    datos["hilos"] = cpu.NumberOfLogicalProcessors
                break
        else:
            datos["procesador"] = platform.processor() or "Desconocido"
    except Exception as exc:
        log.error(f"Error obteniendo info de procesador: {exc}")

    return datos


def obtener_info_ram(conexion) -> dict:
    """RAM total instalada y cantidad de módulos."""
    datos = {"ram_gb": 0.0, "modulos_ram": 0}
    try:
        mem = psutil.virtual_memory()
        datos["ram_gb"] = bytes_a_gb(mem.total)

        if conexion:
            modulos = list(conexion.Win32_PhysicalMemory())
            datos["modulos_ram"] = len(modulos)
    except Exception as exc:
        log.error(f"Error obteniendo info de RAM: {exc}")

    return datos


def obtener_info_almacenamiento(conexion) -> dict:
    """Tipo de disco, capacidad total y espacio libre."""
    datos = {
        "tipo_disco": "Desconocido",
        "capacidad_total_gb": 0.0,
        "espacio_libre_gb": 0.0,
    }
    try:
        total = 0
        libre = 0
        for particion in psutil.disk_partitions(all=False):
            try:
                uso = psutil.disk_usage(particion.mountpoint)
                total += uso.total
                libre += uso.free
            except Exception:
                continue

        datos["capacidad_total_gb"] = bytes_a_gb(total)
        datos["espacio_libre_gb"] = bytes_a_gb(libre)

        if conexion:
            tipos = set()
            for disco in conexion.Win32_DiskDrive():
                media = getattr(disco, "MediaType", None)
                if media:
                    tipos.add(media)
            if tipos:
                datos["tipo_disco"] = ", ".join(sorted(tipos))
    except Exception as exc:
        log.error(f"Error obteniendo info de almacenamiento: {exc}")

    return datos


def obtener_info_windows() -> dict:
    """Versión, build y arquitectura de Windows."""
    datos = {
        "windows": "Desconocido",
        "version": "Desconocido",
        "build": "Desconocido",
        "arquitectura": "Desconocido",
    }
    try:
        datos["windows"] = f"{platform.system()} {platform.release()}".strip()
        datos["version"] = platform.version() or "Desconocido"
        datos["build"] = platform.win32_ver()[2] or "Desconocido" if hasattr(
            platform, "win32_ver"
        ) else "Desconocido"
        datos["arquitectura"] = platform.machine() or "Desconocido"
    except Exception as exc:
        log.error(f"Error obteniendo info de Windows: {exc}")

    return datos


def obtener_info_red() -> dict:
    """Usuario Windows, dominio, IPv4 y MAC."""
    import getpass
    import os as _os

    datos = {
        "usuario_windows": "Desconocido",
        "dominio": "Desconocido",
        "ip": "Desconocido",
        "mac": "Desconocido",
    }
    try:
        datos["usuario_windows"] = getpass.getuser()
        datos["dominio"] = _os.environ.get("USERDOMAIN", "Desconocido")

        try:
            datos["ip"] = socket.gethostbyname(socket.gethostname())
        except Exception:
            pass

        try:
            mac_int = uuid.getnode()
            mac = ":".join(
                f"{(mac_int >> ele) & 0xFF:02x}" for ele in range(40, -1, -8)
            )
            datos["mac"] = mac.upper()
        except Exception:
            pass
    except Exception as exc:
        log.error(f"Error obteniendo info de red: {exc}")

    return datos


def extraer_toda_la_informacion() -> dict:
    """
    Punto de entrada principal: recopila toda la información del
    equipo y la devuelve como un único diccionario listo para
    mostrar en la interfaz y guardar en el Excel.
    """
    conexion = _conectar_wmi()

    info_sistema = obtener_info_sistema(conexion)
    info_cpu = obtener_info_procesador(conexion)
    info_ram = obtener_info_ram(conexion)
    info_disco = obtener_info_almacenamiento(conexion)
    info_windows = obtener_info_windows()
    info_red = obtener_info_red()

    resultado = {
        "equipo": info_sistema["equipo"],
        "marca": info_sistema["marca"],
        "modelo": info_sistema["modelo"],
        "numero_serie": info_sistema["numero_serie"],
        "procesador": (
            f"{info_cpu['procesador']} "
            f"({info_cpu['nucleos']} núcleos / {info_cpu['hilos']} hilos)"
        ),
        "ram": f"{info_ram['ram_gb']} GB ({info_ram['modulos_ram']} módulos)",
        "almacenamiento": (
            f"{info_disco['capacidad_total_gb']} GB total "
            f"({info_disco['espacio_libre_gb']} GB libres) "
            f"- {info_disco['tipo_disco']}"
        ),
        "windows": f"{info_windows['windows']} (Build {info_windows['build']})",
        "estado": ESTADO_INICIAL,
        "usuario_windows": info_red["usuario_windows"],
        "dominio": info_red["dominio"],
        "ip": info_red["ip"],
        "mac": info_red["mac"],
        "build_windows": info_windows["build"],
        "arquitectura": info_windows["arquitectura"],
        "fecha": fecha_hora_actual(),
    }

    log.info(f"Extracción de hardware completada para equipo: {resultado['equipo']}")
    return resultado
