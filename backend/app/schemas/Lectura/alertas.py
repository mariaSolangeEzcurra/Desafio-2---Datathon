from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional

class AlertaResponse(BaseModel):
    alerta_id: str
    nivel: str
    kpi: str
    motivo: str
    fecha_generacion: Optional[datetime]
    fecha: date
    estado_alerta: str
    comentario_resolucion: Optional[str]
    zona_id: Optional[str]
    ccodprs: Optional[str]
    supervisor_id: Optional[str]
    valor_actual: Optional[float]
    valor_umbral: Optional[float]
    prioridad: Optional[str]

    class Config:
        from_attributes = True

class CambiarEstadoAlertaRequest(BaseModel):
    estado_alerta: str = Field(..., description="Nuevo estado: 'Pendiente', 'En Revisión', 'Escalada', 'Resuelto'")
    comentario: str = Field(..., description="Observación o detalle del por qué del cambio de estado")
    supervisor_id: Optional[str] = Field(None, description="ID opcional del supervisor que realiza la acción")