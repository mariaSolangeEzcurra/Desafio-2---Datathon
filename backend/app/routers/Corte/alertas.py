from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.schemas.Corte.alertas import ResumenAlertasResponse
from app.services.Corte.alerta_service import evaluar_alertas_cortes

router = APIRouter(
    prefix="/api/v1/cortes/alertas",
    tags=["Alertas Operativas de Corte"]
)

@router.get("", response_model=ResumenAlertasResponse)
def get_alertas_operativas(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    periodo: Optional[str] = Query("hoy", description="Filtro rápido: hoy, semana, mes, 3meses"),
    distrito: Optional[str] = Query(None, description="Filtrar por distrito"),
    db: Session = Depends(get_db)
):
    """
    Obtiene la evaluación exacta de las 4 alertas operativas determinísticas para órdenes de corte.
    """
    return evaluar_alertas_cortes(
        db=db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        periodo=periodo,
        distrito=distrito
    )