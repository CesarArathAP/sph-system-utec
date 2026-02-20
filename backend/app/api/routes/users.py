"""
Rutas para gestión de usuarios (búsqueda, utilidades).
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.schemas.user import UserResponse
from app.models.user import User, RolEnum
from app.api.dependencies import get_current_active_coordinador

router = APIRouter()


@router.get("", response_model=List[UserResponse])
def search_users(
    q: Optional[str] = Query(None, description="Buscar por nombre, apellido o email"),
    rol: Optional[RolEnum] = Query(None, description="Filtrar por rol"),
    sin_docente: Optional[bool] = Query(None, description="Si True, devuelve solo usuarios sin perfil docente"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador),
):
    """
    Buscar usuarios por nombre, apellido o email.

    Requiere rol de coordinador o admin.
    """
    query = db.query(User)

    if q:
        term = f"%{q}%"
        query = query.filter(
            User.nombre.ilike(term)
            | User.apellido.ilike(term)
            | User.email.ilike(term)
        )

    if rol:
        query = query.filter(User.rol == rol)

    if sin_docente:
        # Excluir usuarios que ya tienen un perfil docente
        from app.models.docente import Docente
        subq = db.query(Docente.user_id).subquery()
        query = query.filter(~User.id.in_(subq))

    users = query.limit(limit).all()
    return users
