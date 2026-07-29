from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.Corte.kpisCorte_service import calcular_dashboard_kpis, calcular_resumen_cortes
from app.schemas.Corte.kpisCorte import DashboardKpiResponse, ResumenCortesResponse

router = APIRouter(prefix="/api/cortes/kpis", tags=["KPIs y Analítica de Cortes"])

@router.get("/dashboard", response_model=DashboardKpiResponse)
def get_dashboard_kpis(
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio de generación del programa (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin de generación del programa (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    return calcular_dashboard_kpis(db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

@router.get("/resumen", response_model=ResumenCortesResponse)
def get_resumen_cortes(
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio de generación del programa (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin de generación del programa (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    return calcular_resumen_cortes(db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)