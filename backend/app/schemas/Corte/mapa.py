from typing import List, Optional
from pydantic import BaseModel


class HeatmapPoint(BaseModel):
    ccodcnx: int
    lat: float
    lng: float
    deuda: float
    distrito: Optional[str] = "NO ESPECIFICADO"
    direccion: Optional[str] = None


class HeatmapResponse(BaseModel):
    total_puntos: int
    puntos: List[HeatmapPoint]


class ImpedimentoPoint(BaseModel):
    ccodcnx: int
    lat: float
    lng: float
    csitreg: str
    ccodacc: Optional[str] = None
    cdesacc: Optional[str] = None
    distrito: Optional[str] = "NO ESPECIFICADO"
    direccion: Optional[str] = None
    deuda: float


class ImpedimentosResponse(BaseModel):
    total_impedimentos: int
    monto_total_impedimentos: float
    impedimentos: List[ImpedimentoPoint]