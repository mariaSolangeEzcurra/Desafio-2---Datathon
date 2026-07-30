from pydantic import BaseModel
from typing import List, Optional

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
    cmetfac: Optional[str] = None
    cseccli: Optional[str] = None

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
    codigo_impedimento: Optional[str] = None
    codigo_observacion: Optional[str] = None
    ccodcnx: Optional[str] = None
    trabajador_id: Optional[str] = None
    cmetfac: Optional[str] = None
    cseccli: Optional[str] = None

class HeatmapImpedimentosResponse(BaseModel):
    total_puntos_calor: int
    puntos: List[PuntoCalorItem]

    class Config:
        from_attributes = True