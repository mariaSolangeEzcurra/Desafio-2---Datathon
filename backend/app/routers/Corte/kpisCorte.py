# routers/kpis_router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database import get_db
from app.services.Corte.kpisCorte_service import calcular_dashboard_kpis, calcular_resumen_cortes

router = APIRouter(prefix="/api/cortes/kpis", tags=["Dashboard - KPIs Cortes"])

@router.get("/dashboard")
def get_kpis_dashboard(
    periodo: Optional[str] = Query(None, description="Opciones: hoy, semana, mes, 3meses"),
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    distrito: Optional[str] = None,
    ccodprs: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return calcular_dashboard_kpis(db=db,fecha_inicio=fecha_inicio,fecha_fin=fecha_fin,periodo=periodo,distrito=distrito,ccodprs=ccodprs)

@router.get("/resumen")
def get_resumen_cortes(
    periodo: Optional[str] = Query(None, description="Opciones: hoy, semana, mes, 3meses"),
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return calcular_resumen_cortes(db=db,fecha_inicio=fecha_inicio,fecha_fin=fecha_fin,periodo=periodo)