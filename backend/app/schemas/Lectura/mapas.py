from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CoordenadaPunto(BaseModel):
    lat: float
    lng: float
    timestamp: Optional[datetime] = None
    ccodcnx: Optional[str] = None
    resultado: Optional[str] = None

class RecorridoLectorResponse(BaseModel):
    ccodprs: str
    fecha: str
    total_puntos: int
    coordenadas: List[CoordenadaPunto]

    class Config:
        from_attributes = True

class DetalleUbicacion(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None

class DiscrepanciaItem(BaseModel):
    ccodcnx: str
    distancia_metros: float
    teorica: DetalleUbicacion
    real: DetalleUbicacion
    trabajador_id: Optional[str] = None
    resultado: Optional[str] = None

class DiscrepanciasResponse(BaseModel):
    total_discrepancias: int
    elementos: List[DiscrepanciaItem]

    class Config:
        from_attributes = True

class PuntoCalorItem(BaseModel):
    lat: float
    lng: float
    peso: float = 1.0
    motivo: Optional[str] = None

class HeatmapImpedimentosResponse(BaseModel):
    total_puntos_calor: int
    puntos: List[PuntoCalorItem]

    class Config:
        from_attributes = True