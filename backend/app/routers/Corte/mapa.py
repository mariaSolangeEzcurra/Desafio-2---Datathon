from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.Corte.mapa_service import obtener_datos_heatmap, obtener_datos_impedimentos
from app.schemas.Corte.mapa import HeatmapResponse, ImpedimentosResponse

router = APIRouter(prefix="/api/cortes/geo", tags=["Geolocalización de Cortes"])

@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap(
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Retorna los puntos georreferenciados para el mapa de calor con deuda (filtrable por fecha).
    """
    return obtener_datos_heatmap(db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

@router.get("/impedimentos", response_model=ImpedimentosResponse)
def get_impedimentos(
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Retorna las coordenadas de cortes con impedimento/situación especial para mapeo espacial (filtrable por fecha).
    """
    return obtener_datos_impedimentos(db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)