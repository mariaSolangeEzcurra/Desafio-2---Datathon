from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.Corte.mapa import HeatmapResponse, ImpedimentosResponse
from app.services.Corte.mapa_service import (
    obtener_datos_heatmap,
    obtener_datos_impedimentos,
)

router = APIRouter(prefix="/api/cortes/geo", tags=["Geolocalización de Cortes"])


@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap(
    fecha_inicio: Optional[date] = Query(
        None, description="Fecha de inicio (YYYY-MM-DD)"
    ),
    fecha_fin: Optional[date] = Query(
        None, description="Fecha fin (YYYY-MM-DD)"
    ),
    periodo: Optional[str] = Query(
        None, description="Período predefinido: hoy, semana, mes, 3meses"
    ),
    db: Session = Depends(get_db),
):
    return obtener_datos_heatmap(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, periodo=periodo
    )


@router.get("/impedimentos", response_model=ImpedimentosResponse)
def get_impedimentos(
    fecha_inicio: Optional[date] = Query(
        None, description="Fecha de inicio (YYYY-MM-DD)"
    ),
    fecha_fin: Optional[date] = Query(
        None, description="Fecha fin (YYYY-MM-DD)"
    ),
    periodo: Optional[str] = Query(
        None, description="Período predefinido: hoy, semana, mes, 3meses"
    ),
    db: Session = Depends(get_db),
):
    return obtener_datos_impedimentos(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, periodo=periodo
    )