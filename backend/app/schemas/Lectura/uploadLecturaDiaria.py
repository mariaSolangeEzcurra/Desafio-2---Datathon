from pydantic import BaseModel
from datetime import date
from typing import List, Optional, Any


class EvaluacionResumen(BaseModel):
    ccodprs: str
    resultado: Optional[Any] = None

    class Config:
        from_attributes = True

class ReporteDiarioResponse(BaseModel):
    mensaje: str
    registros_insertados: int
    trabajadores_procesados: int
    evaluaciones_generadas: int
    evaluaciones: List[Any] = []

    class Config:
        from_attributes = True

class HistorialReporteItem(BaseModel):
    id: str
    fecha: str
    registros: int
    trabajadores: int
    evaluaciones: int
    estado: str = "Procesado"

    class Config:
        from_attributes = True