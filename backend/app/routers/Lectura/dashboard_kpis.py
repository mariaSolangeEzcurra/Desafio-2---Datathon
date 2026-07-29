from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.services.Lectura.dashboard_kpis_service import KpiLecturaService
from app.schemas.Lectura.dashboard_kpis import KpiDashboardResponse, IndicadorGeneralResponse

router = APIRouter(prefix="/lectura/kpis", tags=["KPIs y Dashboard de Lectura"])

@router.get("/dashboard", response_model=KpiDashboardResponse)
def obtener_dashboard_lectura(
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    zona_id: Optional[str] = Query(None, description="Filtrar por ID de Zona o CMETFAC"),
    db: Session = Depends(get_db)
):
    resumen = KpiLecturaService.obtener_kpis_generales(db, fecha_inicio, fecha_fin, zona_id)
    ranking = KpiLecturaService.obtener_ranking_lectores(db, fecha_inicio, fecha_fin, limit=10)

    return {
        "resumen_general": resumen,
        "ranking_lectores": ranking
    }

@router.get("/resumen", response_model=IndicadorGeneralResponse)
def obtener_resumen_indicadores(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    zona_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return KpiLecturaService.obtener_kpis_generales(db, fecha_inicio, fecha_fin, zona_id)