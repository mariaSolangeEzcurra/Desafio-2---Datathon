from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.Corte.reportes_service import (
    generar_reporte_financiero_excel,
    generar_reporte_ineficiencia_excel
)
from app.schemas.Corte.reporte import ReporteGeneradoResponse

router = APIRouter(prefix="/api/cortes/reportes", tags=["Reportes de Cortes"])

@router.post("/financiero", response_model=ReporteGeneradoResponse)
def exportar_reporte_financiero(
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    return generar_reporte_financiero_excel(db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


@router.post("/ineficiencia", response_model=ReporteGeneradoResponse)
def exportar_reporte_ineficiencia(
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    return generar_reporte_ineficiencia_excel(db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)