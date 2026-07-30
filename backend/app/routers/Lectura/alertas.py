from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import Alerta
from app.schemas.Lectura.alertas import AlertaResponse, CambiarEstadoAlertaRequest
from app.services.Lectura.alertas_service import AlertasService

router = APIRouter(prefix="/api/alertas", tags=["Alertas y Supervisión"])


@router.get("/", response_model=List[AlertaResponse])
def listar_alertas(
    estado: Optional[str] = Query(None, description="Filtrar por estado (Ej. Pendiente, En Revisión, Escalada, Resuelto)"),
    zona_id: Optional[str] = Query(None, description="Filtrar por zona o código metropolitano"),
    ccodprs: Optional[str] = Query(None, description="Filtrar por código de trabajador"),
    fecha: Optional[date] = Query(None, description="Filtrar por fecha específica (YYYY-MM-DD)"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio para rango (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha de fin para rango (YYYY-MM-DD)"),
    periodo: Optional[str] = Query(None, description="Filtro rápido por período: 'hoy', 'semana', 'mes', '3meses'"),
    db: Session = Depends(get_db)
):
    """
    Obtiene el listado de alertas filtradas por estado, trabajador, zona o rangos/períodos de fecha.
    """
    return AlertasService.listar_alertas(
        db=db,
        estado=estado,
        zona_id=zona_id,
        ccodprs=ccodprs,
        fecha=fecha,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        periodo=periodo
    )


@router.post("/evaluar")
def evaluar_alertas_diarias(
    fecha: Optional[date] = Query(None, description="Fecha a evaluar (por defecto la fecha actual)"),
    db: Session = Depends(get_db)
):
    """
    Ejecuta el motor de evaluación de KPIs operativos y espaciales generando las alertas del día.
    """
    total = AlertasService.evaluar_y_generar_alertas(db=db, fecha_evaluacion=fecha)
    return {
        "mensaje": "Evaluación de KPIs completada con éxito.",
        "alertas_generadas": total
    }


@router.get("/{alerta_id}", response_model=AlertaResponse)
def obtener_detalle_alerta(
    alerta_id: str,
    db: Session = Depends(get_db)
):
    """
    Retorna el detalle completo de una alerta por su ID único.
    """
    alerta = db.query(Alerta).filter(Alerta.alerta_id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada.")
    return alerta


@router.patch("/{alerta_id}/estado", response_model=AlertaResponse)
def cambiar_estado_alerta(
    alerta_id: str,
    payload: CambiarEstadoAlertaRequest,
    db: Session = Depends(get_db)
):
    """
    Cambia el estado operativo de una alerta y registra la intervención correspondiente.
    """
    return AlertasService.cambiar_estado_operativo(
        db=db,
        alerta_id=alerta_id,
        nuevo_estado=payload.estado_alerta,
        comentario=payload.comentario,
        supervisor_id=payload.supervisor_id
    )