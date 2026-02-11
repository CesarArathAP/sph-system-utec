"""
Dependencias compartidas de la aplicación.
"""
from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db


# Dependencia para obtener la sesión de base de datos
def get_database() -> Generator:
    """
    Obtiene una sesión de base de datos.
    """
    try:
        db = get_db()
        yield db
    finally:
        pass
