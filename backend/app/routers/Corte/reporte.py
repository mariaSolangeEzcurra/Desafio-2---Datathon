from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.Corte.reportes_service import CortesReportesService

router = APIRouter(prefix="/api/cortes/reportes", tags=["Reportes de Cortes"])


@router.get(
    "/financiero/excel", 
    summary="Exportar reporte financiero de cortes en Excel",
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Devuelve un archivo Excel con el resumen financiero y los KPIs operativos.",
        }
    }
)
def exportar_reporte_financiero(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Período predefinido (hoy, semana, mes, 3meses)"),
    db: Session = Depends(get_db)
):
    """
    Genera un archivo Excel agrupado por Distrito/CMETFAC con el balance de deuda
    recuperada vs en riesgo, e incluye una pestaña con las Alertas Operativas (KPIs).
    """
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
    """
    Genera un archivo Excel detallado con todas las órdenes que registraron algún
    tipo de bloqueo operativo (`CSITREG == 'S'`) o código de impedimento (`CCODACC` / `CIMPCRP`).
    """
    buffer, media_type, filename = CortesReportesService.exportar_reporte_ineficiencia_excel(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, periodo=periodo
    )
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get(
    "/personal/excel", 
    summary="Exportar reporte de rendimiento por personal/operario en Excel",
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Devuelve un archivo Excel con la métrica de desempeño y efectividad por operario.",
        }
    }
)
def exportar_reporte_personal(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Período predefinido (hoy, semana, mes, 3meses)"),
    db: Session = Depends(get_db)
):
    """
    Genera un archivo Excel consolidado por operario/técnico (`CCODPRS`), indicando total
    de órdenes asignadas, ejecutadas, impedimentos y su % de efectividad operativa.
    """
    buffer, media_type, filename = CortesReportesService.exportar_reporte_personal_excel(
        db, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, periodo=periodo
    )
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )