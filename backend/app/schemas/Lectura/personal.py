from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class AsistenciaDiariaResponse(BaseModel):
    fecha: date
    ruta_id: Optional[str] = None
    cmetfac: Optional[str] = None
    cantidad_lecturas: int
    lecturas_realizadas: int
    eficiencia: Optional[float] = None
    duracion_total_min: Optional[float] = None

    class Config:
        from_attributes = True

class FichaPersonalResponse(BaseModel):
    ccodprs: str
    nombre: str
    telefono: Optional[str] = None
    ruta_actual: Optional[str] = None      
    metfac_actual: Optional[str] = None  
    ultimo_puntaje: Optional[float] = None
    ultima_clasificacion: Optional[str] = None
    fecha_ultima_evaluacion: Optional[date] = None
    total_alertas_pendientes: int
    historial_asistencia: List[AsistenciaDiariaResponse]

    class Config:
        from_attributes = True

class TrabajadorListResponse(BaseModel):
    ccodprs: str
    nombre: str
    telefono: Optional[str] = None
    ultimo_puntaje: Optional[float] = None
    ultima_clasificacion: Optional[str] = None

    class Config:
        from_attributes = True