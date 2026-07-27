from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ResumenKPIsGlobalResponse(BaseModel):
    total_alertas: int
    alertas_por_nivel: dict
    alertas_por_kpi: dict
    cumplimiento_promedio_general: float

    class Config:
        from_attributes = True

class ReporteAlertasEstadoResponse(BaseModel):
    estado: str
    cantidad: int

    class Config:
        from_attributes = True

class ReporteTrabajadorDetalleResponse(BaseModel):
    ccodprs: str
    nombre_trabajador: Optional[str]
    zona_asignada: Optional[str]
    total_alertas_acumuladas: int
    promedio_cumplimiento: float
    estado_general: str

    class Config:
        from_attributes = True