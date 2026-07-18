from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AlertaResponse(BaseModel):
    alerta_id: str
    nivel: str | None = None
    kpi: str | None = None
    motivo: str | None = None
    fecha_generacion: datetime | None = None
    estado_alerta: str | None = None
    zona_id: str | None = None
    cCodPrs: str | None = None  # Sincronizado con trabajadores.cCodPrs
    supervisor_id: str | None = None  # Sincronizado con usuarios.id_usuario

    class Config:
        from_attributes = True  # Permite mapear modelos SQLAlchemy directo a JSON en Pydantic v2


class ResumenTrabajadorKPI(BaseModel):
    total_programadas: int
    ejecutadas: int
    cumplimiento_pct: float
    productividad_hora: float
    tiempo_promedio_min: float
    impedimentos_pct: float

class InformeTrabajadorResponse(BaseModel):
    trabajador_id: str
    resumen: ResumenTrabajadorKPI
    estado_critico: bool
    # Aquí inyectamos directamente tu lista de alertas usando tu propio esquema
    alertas_activas: List[AlertaResponse] 

    class Config:
        from_attributes = True