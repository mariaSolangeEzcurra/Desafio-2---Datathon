from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.Lectura.personal_service import PersonalService
from app.schemas.Lectura.personal import TrabajadorListResponse, FichaPersonalResponse

router = APIRouter(prefix="/lectura/personal", tags=["Gestión de Personal y Asistencia"])

@router.get("/", response_model=List[TrabajadorListResponse])
def listar_personal(
    skip: int = Query(0, description="Registros a saltar"),
    limit: int = Query(50, description="Límite de registros a mostrar"),
    db: Session = Depends(get_db)
):
    """Obtiene el listado general del personal de campo registrado en SEDAPAR."""
    return PersonalService.listar_trabajadores(db, skip=skip, limit=limit)

@router.get("/{ccodprs}/ficha", response_model=FichaPersonalResponse)
def obtener_ficha_empleado(
    ccodprs: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene la ficha individual de un trabajador: 
    datos generales, última evaluación, alertas pendientes y el historial reciente de asistencia y rutas.
    """
    ficha = PersonalService.obtener_ficha_trabajador(db, ccodprs=ccodprs)
    if not ficha:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado en el sistema.")
    return ficha