from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.Corte.reportes_service import CortesReportesService

router = APIRouter(prefix="/api/cortes/reportes", tags=["Reportes de Cortes"])

@router.get("/financiero/excel")
def exportar_reporte_financiero(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = CortesReportesService.exportar_reporte_financiero_excel(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin
    )
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/ineficiencia/excel")
def exportar_reporte_ineficiencia(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = CortesReportesService.exportar_reporte_ineficiencia_excel(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin
    )
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )