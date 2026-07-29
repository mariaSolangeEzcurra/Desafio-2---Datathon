from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database import get_db
from app.services.Lectura.reportes_service import ReportesService

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])

@router.get("/kpis-resumen/exportar")
def exportar_resumen_kpis(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    zona_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = ReportesService.exportar_resumen_kpis(db, fecha_inicio, fecha_fin, zona_id)
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/alertas-estado/exportar")
def exportar_alertas_estado(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = ReportesService.exportar_estado_alertas(db, fecha_inicio, fecha_fin)
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