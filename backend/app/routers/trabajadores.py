from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from fastapi import UploadFile, File

from app.database import get_db
from app.schemas.trabajador import (
    TrabajadorCreate,
    TrabajadorUpdate,
    TrabajadorResponse
)
from app.services import trabajador_service

router = APIRouter(
    prefix="/api/trabajadores",
    tags=["Trabajadores"]
)


# ==========================================
# LISTAR TRABAJADORES
# ==========================================
@router.get(
    "/",
    response_model=List[TrabajadorResponse]
)
def listar_trabajadores(db: Session = Depends(get_db)):
    return trabajador_service.listar_trabajadores(db)


# ==========================================
# OBTENER TRABAJADOR
# ==========================================
@router.get(
    "/{ccodprs}",
    response_model=TrabajadorResponse
)
def obtener_trabajador(
    ccodprs: str,
    db: Session = Depends(get_db)
):
    return trabajador_service.obtener_trabajador(db, ccodprs)


# ==========================================
# CREAR TRABAJADOR
# ==========================================
@router.post(
    "/",
    response_model=TrabajadorResponse,
    status_code=201
)
def crear_trabajador(
    trabajador: TrabajadorCreate,
    db: Session = Depends(get_db)
):
    return trabajador_service.crear_trabajador(db, trabajador)


# ==========================================
# ACTUALIZAR TRABAJADOR
# ==========================================
@router.put(
    "/{ccodprs}",
    response_model=TrabajadorResponse
)
def actualizar_trabajador(
    ccodprs: str,
    datos: TrabajadorUpdate,
    db: Session = Depends(get_db)
):
    return trabajador_service.actualizar_trabajador(
        db,
        ccodprs,
        datos
    )


# ==========================================
# ELIMINAR TRABAJADOR
# ==========================================
@router.delete("/{ccodprs}")
def eliminar_trabajador(
    ccodprs: str,
    db: Session = Depends(get_db)
):
    return trabajador_service.eliminar_trabajador(
        db,
        ccodprs
    )


# ==========================================
# CARGAR TRABAJADOR
# ==========================================

@router.post("/upload")
def cargar_trabajadores(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return trabajador_service.cargar_trabajadores_excel(
        db,
        archivo
    )