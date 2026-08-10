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


@router.get(
    "/heatmap",
    response_model=HeatmapResponse,
    summary="Obtener puntos para Mapa de Calor / Capas de Cortes",
)
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
    distrito: Optional[str] = Query(
        None, description="Filtrar por nombre de distrito"
    ),
    ccodprs: Optional[str] = Query(
        None, description="Filtrar por código de trabajador"
    ),
    limite: int = Query(
        2000, description="Límite máximo de puntos a retornar (por defecto 2000)"
    ),
    db: Session = Depends(get_db),
):
    """
    Retorna los puntos geolocalizados para el mapa de calor.
    Si no se especifica rango de fechas ni período, aplica 'mes' por defecto.
    """
    return obtener_datos_heatmap(
        db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        periodo=periodo,
        distrito=distrito,
        ccodprs=ccodprs,
        limite=limite,
    )


@router.get(
    "/impedimentos",
    response_model=ImpedimentosResponse,
    summary="Obtener puntos con impedimentos de ejecución",
)
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
    distrito: Optional[str] = Query(
        None, description="Filtrar por nombre de distrito"
    ),
    ccodprs: Optional[str] = Query(
        None, description="Filtrar por código de trabajador"
    ),
    limite: int = Query(
        2000, description="Límite máximo de puntos a retornar (por defecto 2000)"
    ),
    db: Session = Depends(get_db),
):
    """
    Retorna los puntos geolocalizados que presentan impedimentos de ejecución (csitreg == 'S').
    Si no se especifica rango de fechas ni período, aplica 'mes' por defecto.
    """
    return obtener_datos_impedimentos(
        db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        periodo=periodo,
        distrito=distrito,
        ccodprs=ccodprs,
        limite=limite,
    )