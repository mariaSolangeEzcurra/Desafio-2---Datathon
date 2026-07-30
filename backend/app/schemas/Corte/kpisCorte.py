from pydantic import BaseModel
from typing import List, Optional

class DashboardKpiResponse(BaseModel):
    total_ordenes: int
    ordenes_ejecutadas: int
    ordenes_pendientes: int
    tasa_efectividad_porcentaje: float
    monto_total_deuda: float
    monto_deuda_recuperada: float  # O estimada de ejecutados
    monto_deuda_en_riesgo: float   # Pendientes

class ResumenDistritoItem(BaseModel):
    distrito: str
    total_ordenes: int
    ejecutadas: int
    pendientes: int
    deuda_total: float

class ResumenTipoProgramaItem(BaseModel):
    ctipprg: Optional[int] = 1
    total_ordenes: int
    ejecutadas: int
    pendientes: int
    deuda_total: float

class ResumenCortesResponse(BaseModel):
    por_distrito: List[ResumenDistritoItem]
    por_tipo_programa: List[ResumenTipoProgramaItem]