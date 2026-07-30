from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.Lectura.personal import FichaPersonalResponse, TrabajadorListResponse
from app.services.Lectura.personal_service import PersonalService

router = APIRouter(prefix="/lectura/personal", tags=["Gestión de Personal y Asistencia"])


@router.get("/", response_model=List[TrabajadorListResponse])
def listar_personal(
    skip: int = Query(0, description="Registros a saltar"),
    limit: int = Query(50, description="Límite de registros a mostrar"),
    fecha: Optional[date] = Query(None, description="Filtrar por fecha exacta (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Filtro rápido: hoy, semana, mes, 3meses"),
    db: Session = Depends(get_db)
):
    return PersonalService.listar_trabajadores(db, skip=skip, limit=limit, fecha=fecha, periodo=periodo)


@router.post("/calcular-desempeno")
def calcular_desempeno(
    ccodprs: Optional[str] = Query(None, description="Código opcional de un trabajador específico"),
    fecha_eval: Optional[date] = Query(None, description="Fecha específica de evaluación (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Filtro rápido: hoy, semana, mes, etc."),
    db: Session = Depends(get_db)
):
    return PersonalService.calcular_y_actualizar_desempeno(db, ccodprs=ccodprs, fecha_eval=fecha_eval, periodo=periodo)


@router.get("/{ccodprs}/ficha", response_model=FichaPersonalResponse)
def obtener_ficha_empleado(
    ccodprs: str,
    db: Session = Depends(get_db)
):
    ficha = PersonalService.obtener_ficha_trabajador(db, ccodprs=ccodprs)
    if not ficha:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado en el sistema.")
    return ficha