from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.schemas.Corte.personal import RendimientoPersonalItem, DetalleTrabajadorResponse
from app.services.Corte.personal_service import obtener_detalle_por_trabajador, obtener_rendimiento_personal

router = APIRouter(
    prefix="/api/v1/cortes/personal",
    tags=["Personal / Operarios de Corte"]
)

@router.get("/rendimiento", response_model=List[RendimientoPersonalItem])
def get_rendimiento_personal(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio de programa (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin de programa (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Filtro rápido: hoy, semana, mes, 3meses"),
    distrito: Optional[str] = Query(None, description="Filtrar operarios por distrito"),
    db: Session = Depends(get_db)
):
    return obtener_rendimiento_personal(
        db=db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        periodo=periodo,
        distrito=distrito
    )

@router.get("/trabajador/{ccodprs}", response_model=DetalleTrabajadorResponse)
def get_detalle_trabajador(
    ccodprs: str,
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Filtro rápido: hoy, semana, mes, 3meses"),
    pagina: int = Query(1, ge=1, description="Número de página"),
    limite: int = Query(50, ge=1, le=500, description="Cantidad de registros por página"),
    db: Session = Depends(get_db)
):
    resultado = obtener_detalle_por_trabajador(
        db=db,
        ccodprs=ccodprs,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        periodo=periodo,
        pagina=pagina,
        limite=limite
    )
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron datos para el trabajador con código {ccodprs}"
        )
    return resultado