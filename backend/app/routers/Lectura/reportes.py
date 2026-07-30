from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List

from app.database import get_db
from app.services.Lectura.reportes_service import ReportesService
from app.schemas.Lectura.reportes import (
    ResumenKPIsGlobalResponse,
    ReporteAlertasEstadoResponse,
    ReporteTrabajadorDetalleResponse
)

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])

# ==================== ENDPOINTS DE CONSULTA (JSON) ====================

@router.get("/kpis-resumen", response_model=ResumenKPIsGlobalResponse)
def obtener_resumen_kpis(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    zona_id: Optional[str] = None,
    periodo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtiene el resumen global de KPIs, alertas y desglose por zonas en formato JSON."""
    return ReportesService.obtener_resumen_kpis(db, fecha_inicio, fecha_fin, zona_id, periodo)

@router.get("/alertas-estado", response_model=List[ReporteAlertasEstadoResponse])
def obtener_estado_alertas(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtiene el conteo de alertas agrupadas por su estado actual."""
    return ReportesService.obtener_estado_alertas(db, fecha_inicio, fecha_fin, periodo)

@router.get("/trabajadores-ranking", response_model=List[ReporteTrabajadorDetalleResponse])
def obtener_ranking_trabajadores(
    fecha: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Obtiene el ranking y desempeño operativo de los trabajadores lectores para una fecha."""
    return ReportesService.obtener_ranking_trabajadores(db, fecha)


# ==================== ENDPOINTS DE EXPORTACIÓN (EXCEL) ====================

@router.get("/kpis-resumen/exportar")
def exportar_resumen_kpis(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    zona_id: Optional[str] = None,
    periodo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = ReportesService.exportar_resumen_kpis(db, fecha_inicio, fecha_fin, zona_id, periodo)
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/alertas-estado/exportar")
def exportar_alertas_estado(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    periodo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = ReportesService.exportar_estado_alertas(db, fecha_inicio, fecha_fin, periodo)
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/trabajadores-desempeno/exportar")
def exportar_trabajadores_desempeno(
    fecha: Optional[date] = None,
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = ReportesService.exportar_ranking_trabajadores(db, fecha)
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )