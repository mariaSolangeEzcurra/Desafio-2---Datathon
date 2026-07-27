from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.database import get_db
from app.services.Lectura.alertas_service import AlertasService
from app.schemas.Lectura.alertas import AlertaResponse, CambiarEstadoAlertaRequest

router = APIRouter(prefix="/alertas", tags=["Alertas y Supervisión"])

@router.get("/", response_model=List[AlertaResponse])
def listar_alertas(
    estado: Optional[str] = Query(None, description="Filtrar por estado (Ej. Pendiente, En Revisión, Escalada, Resuelto)"),
    zona_id: Optional[str] = Query(None, description="Filtrar por zona"),
    ccodprs: Optional[str] = Query(None, description="Filtrar por código de trabajador"),
    fecha: Optional[date] = Query(None, description="Filtrar por fecha (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Lista todas las alertas registradas con filtros opcionales.
    """
    return AlertasService.listar_alertas(db=db, estado=estado, zona_id=zona_id, ccodprs=ccodprs, fecha=fecha)

@router.post("/evaluar")
def evaluar_alertas_diarias(
    fecha: Optional[date] = Query(None, description="Fecha a evaluar (por defecto hoy)"),
    db: Session = Depends(get_db)
):
    """
    Evalúa los 7 KPIs del sistema y genera automáticamente las alertas necesarias.
    """
    total = AlertasService.evaluar_y_generar_alertas(db=db, fecha_evaluacion=fecha)
    return {"mensaje": "Evaluación de KPIs completada con éxito", "alertas_generadas": total}

@router.patch("/{alerta_id}/estado", response_model=AlertaResponse)
def cambiar_estado_alerta(
    alerta_id: str,
    payload: CambiarEstadoAlertaRequest,
    db: Session = Depends(get_db)
):
    """
    Permite al supervisor cambiar el estado operativo de una alerta 
    ('Pendiente', 'En Revisión', 'Escalada', 'Resuelto') adjuntando un comentario obligatorio.
    """
    return AlertasService.cambiar_estado_operativo(
        db=db,
        alerta_id=alerta_id,
        nuevo_estado=payload.estado_alerta,
        comentario=payload.comentario,
        supervisor_id=payload.supervisor_id
    )