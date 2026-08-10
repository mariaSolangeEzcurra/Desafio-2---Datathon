from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class PuntoHeatmap(BaseModel):
    ccodcnx: str = Field(..., description="Código de conexión")
    lat: float = Field(..., description="Latitud o Coordenada Y (UTM)")
    lng: float = Field(..., description="Longitud o Coordenada X (UTM)")
    deuda: float = Field(..., description="Monto total de deuda")
    distrito: Optional[str] = Field(None, description="Distrito")
    direccion: Optional[str] = Field(None, description="Dirección del predio")
    ejecutada: bool = Field(False, description="Indica si la orden fue ejecutada (dejecuc no es nulo)")

    class Config:
        from_attributes = True


class HeatmapResponse(BaseModel):
    total_puntos: int = Field(..., description="Cantidad total de puntos devueltos")
    puntos: List[PuntoHeatmap]


class PuntoImpedimento(BaseModel):
    ccodcnx: str = Field(..., description="Código de conexión")
    lat: float = Field(..., description="Latitud o Coordenada Y (UTM)")
    lng: float = Field(..., description="Longitud o Coordenada X (UTM)")
    csitreg: str = Field(..., description="Situación del registro ('S' = Impedimento)")
    ccodacc: Optional[str] = Field(None, description="Código de acción / impedimento")
    cdesacc: Optional[str] = Field(None, description="Descripción de la acción / impedimento")
    distrito: Optional[str] = Field(None, description="Distrito")
    direccion: Optional[str] = Field(None, description="Dirección del predio")
    deuda: float = Field(..., description="Monto de la deuda")

    class Config:
        from_attributes = True


class ImpedimentosResponse(BaseModel):
    total_impedimentos: int = Field(..., description="Cantidad total de impedimentos devueltos")
    monto_total_impedimentos: float = Field(..., description="Suma de la deuda retenida por impedimentos")
    impedimentos: List[PuntoImpedimento]