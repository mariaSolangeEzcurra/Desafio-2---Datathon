from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List

from app.database import get_db
from app.services.Lectura.reportes_service import ReportesService
from app.schemas.Lectura.reportes import ResumenKPIsGlobalResponse, ReporteAlertasEstadoResponse, ReporteTrabajadorDetalleResponse

router = APIRouter(prefix="/api/reportes", tags=["Reportes y Analítica"])

@router.get("/kpis-resumen", response_model=ResumenKPIsGlobalResponse)
def reporte_resumen_kpis(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    zona_id: Optional[str] = Query(None, description="Filtrar por zona"),
    db: Session = Depends(get_db)
):
    """
    Reporte global consolidado de los 7 KPIs, cumplimiento promedio y distribución de alertas.
    """
    return ReportesService.obtener_resumen_kpis(db=db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, zona_id=zona_id)

@router.get("/alertas-estado", response_model=List[ReporteAlertasEstadoResponse])
def reporte_alertas_por_estado(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Reporte de control de supervisión: muestra cuántas alertas están Pendientes, En Revisión, Escaladas o Resueltas.
    """
    return ReportesService.obtener_estado_alertas(db=db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

@router.get("/trabajadores-desempeno", response_model=List[ReporteTrabajadorDetalleResponse])
def reporte_desempeno_trabajadores(
    fecha: Optional[date] = Query(None, description="Fecha a evaluar (por defecto hoy)"),
    db: Session = Depends(get_db)
):
    """
    Reporte detallado por trabajador que muestra cumplimiento, alertas acumuladas y estado operativo diario.
    """
    return ReportesService.obtener_ranking_trabajadores(db=db, fecha=fecha)