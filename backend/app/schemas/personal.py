from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 1. Esquema interno para las alertas individuales
class AlertaActiva(BaseModel):
    alerta_id: str
    nivel: str
    kpi: str
    motivo: str
    fecha_generacion: datetime
    estado_alerta: str
    cCodPrs: str

    class Config:
        from_attributes = True

# 2. Esquema interno para el bloque de estadísticas del resumen
class ResumenDesempeno(BaseModel):
    total_lecturas: int
    lecturas_exitosas: int
    cumplimiento_pct: float
    productividad_hora: float
    tiempo_promedio_min: float
    impedimentos_pct: float
    cobertura_gps_pct: float
    fuera_radio_pct: float

# 3. El ESQUEMA PRINCIPAL que le falta a tu backend:
class PersonalDesempenoResponse(BaseModel):
    trabajador_id: str
    resumen: ResumenDesempeno
    estado_critico: bool
    alertas_activas: List[AlertaActiva]

    class Config:
        from_attributes = True  # Esto reemplaza al antiguo 'orm_mode' que daba warnings en tus logs