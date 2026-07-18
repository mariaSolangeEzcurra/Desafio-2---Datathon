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
    total_lecturas: int
    lecturas_exitosas: int

    # No puede calcularse aún porque no existe la programación
    cumplimiento_pct: Optional[float] = None
    # KPI 2
    productividad_hora: float
    # KPI 3
    tiempo_promedio_min: float
    # Indicadores adicionales
    impedimentos_pct: float
    cobertura_gps_pct: float
    fuera_radio_pct: float

class InformeTrabajadorResponse(BaseModel):
    trabajador_id: str
    resumen: ResumenTrabajadorKPI
    estado_critico: bool
    alertas_activas: List[AlertaResponse]

    class Config:
        from_attributes = True
    class Config:
        from_attributes = True