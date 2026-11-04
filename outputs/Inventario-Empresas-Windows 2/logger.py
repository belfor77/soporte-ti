# logger.py
"""
Configura un logger único para toda la aplicación.
Todos los errores quedan registrados en logs/error.log
"""

import logging
import os

from config import LOGS_DIR, LOG_FILE


def setup_logger() -> logging.Logger:
    """Crea (si no existe) la carpeta logs/ y configura el logger."""
    os.makedirs(LOGS_DIR, exist_ok=True)

    logger = logging.getLogger("InventarioEquipos")
    logger.setLevel(logging.DEBUG)

    # Evitar handlers duplicados si setup_logger() se llama más de una vez
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(module)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    return logger


# Logger global, importable desde cualquier módulo con:
#   from logger import log
log = setup_logger()
