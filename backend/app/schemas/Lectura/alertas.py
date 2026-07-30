from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

# Definimos los estados permitidos como un tipo Literal para autodocumentación en Swagger
EstadoAlertaEnum = Literal["Pendiente", "En Revisión", "Escalada", "Resuelto"]

class AlertaResponse(BaseModel):
    alerta_id: str
    nivel: str
    kpi: str
    motivo: str
    fecha_generacion: Optional[datetime] = None
    fecha: date
    estado_alerta: str
    comentario_resolucion: Optional[str] = None
    zona_id: Optional[str] = None
    ccodprs: Optional[str] = None
    supervisor_id: Optional[str] = None
    valor_actual: Optional[float] = None
    valor_umbral: Optional[float] = None
    prioridad: Optional[str] = None

    class Config:
        from_attributes = True


class CambiarEstadoAlertaRequest(BaseModel):
    estado_alerta: EstadoAlertaEnum = Field(
        ..., 
        description="Nuevo estado: 'Pendiente', 'En Revisión', 'Escalada', 'Resuelto'"
    )
    comentario: str = Field(
        ..., 
        min_length=1, 
        description="Observación o detalle del porqué del cambio de estado"
    )
    supervisor_id: Optional[str] = Field(
        None, 
        description="ID del supervisor que realiza la acción (ej. 'SUP-001')"
    )