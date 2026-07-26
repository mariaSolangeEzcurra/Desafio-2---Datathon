from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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

@router.post("/calcular-desempeno")
def calcular_desempeno(
    ccodprs: Optional[str] = Query(None, description="Código opcional de un trabajador específico"),
    db: Session = Depends(get_db)
):
    """Calcula y actualiza el puntaje y clasificación de desempeño de los lectores en base a su eficiencia."""
    return PersonalService.calcular_y_actualizar_desempeno(db, ccodprs=ccodprs)

@router.get("/{ccodprs}/ficha", response_model=FichaPersonalResponse)
def obtener_ficha_empleado(
    ccodprs: str,
    db: Session = Depends(get_db)
):
    """Obtiene la ficha individual de un trabajador, incluyendo su evaluación y asistencia."""
    ficha = PersonalService.obtener_ficha_trabajador(db, ccodprs=ccodprs)
    if not ficha:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado en el sistema.")
    return ficha