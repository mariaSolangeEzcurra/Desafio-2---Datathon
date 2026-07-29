from pydantic import BaseModel
from typing import List, Optional

class PuntoHeatmapItem(BaseModel):
    ccodcnx: str
    lat: float
    lng: float
    deuda: float
    distrito: Optional[str] = None
    direccion: Optional[str] = None

class HeatmapResponse(BaseModel):
    total_puntos: int
    puntos: List[PuntoHeatmapItem]

class PuntoImpedimentoItem(BaseModel):
    ccodcnx: str
    lat: float
    lng: float
    csitreg: str
    ccodacc: Optional[str] = None
    cdesacc: Optional[str] = None
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    deuda: float

class ImpedimentosResponse(BaseModel):
    total_impedimentos: int
    impedimentos: List[PuntoImpedimentoItem]