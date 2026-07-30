from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.Corte.reportes_service import CortesReportesService
# from app.schemas.cortes import ReporteGeneradoResponse # Importa tu schema si lo usas en otros endpoints

router = APIRouter(prefix="/api/cortes/reportes", tags=["Reportes de Cortes"])

@router.get(
    "/financiero/excel", 
    summary="Exportar reporte financiero de cortes en Excel",
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Devuelve un archivo Excel con el resumen financiero de cortes.",
        }
    }
)
def exportar_reporte_financiero(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Período predefinido (hoy, semana, mes, 3meses)"),
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = CortesReportesService.exportar_reporte_financiero_excel(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, periodo=periodo
    )
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get(
    "/ineficiencia/excel", 
    summary="Exportar reporte de ineficiencia e impedimentos en Excel",
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Devuelve un archivo Excel con el detalle de ineficiencias e impedimentos.",
        }
    }
)
def exportar_reporte_ineficiencia(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Período predefinido (hoy, semana, mes, 3meses)"),
    db: Session = Depends(get_db)
):
    buffer, media_type, filename = CortesReportesService.exportar_reporte_ineficiencia_excel(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, periodo=periodo
    )
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )