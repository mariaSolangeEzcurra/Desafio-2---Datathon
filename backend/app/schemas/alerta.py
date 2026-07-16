from pydantic import BaseModel
from datetime import datetime

class AlertaResponse(BaseModel):
    alerta_id: str
    nivel: str | None = None
    kpi: str | None = None
    motivo: str | None = None
    fecha_generacion: datetime | None = None
    estado_alerta: str | None = None
    zona_id: str | None = None
    trabajador_id: str | None = None
    supervisor_id: str | None = None

    class Config:
        orm_mode = True
