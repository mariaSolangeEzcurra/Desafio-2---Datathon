from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class ResumenDiarioLectorBase(BaseModel):
    ccodprs: str
    fecha: date
    cantidad_lecturas: Optional[int] = 0
    lecturas_realizadas: Optional[int] = 0
    lecturas_pendientes: Optional[int] = 0
    cantidad_impedimentos: Optional[int] = 0
    cantidad_observaciones: Optional[int] = 0
    cantidad_fotos: Optional[int] = 0
    duracion_total_min: Optional[float] = 0.0
    promedio_min: Optional[float] = 0.0
    eficiencia: Optional[float] = 0.0
    fecha_inicio: Optional[date] = None
    hora_inicio: Optional[datetime] = None
    fecha_fin: Optional[date] = None
    hora_fin: Optional[datetime] = None

class ResumenDiarioLectorResponse(ResumenDiarioLectorBase):
    id: int

    class Config:
        from_attributes = True

class CargaReporteDiarioResponse(BaseModel):
    status: str
    message: str
    registros_insertados: int
    registros_actualizados: int
    registros_error: int
    total_filas_excel: int