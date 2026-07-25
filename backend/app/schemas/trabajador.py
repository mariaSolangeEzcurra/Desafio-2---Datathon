from pydantic import BaseModel
from typing import Optional
from datetime import date

class TrabajadorBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None

class TrabajadorCreate(TrabajadorBase):
    ccodprs: str

class TrabajadorUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None

class TrabajadorResponse(TrabajadorBase):
    ccodprs: str
    ultimo_puntaje: Optional[float] = None
    ultima_clasificacion: Optional[str] = None
    fecha_ultima_evaluacion: Optional[date] = None

    class Config:
        from_attributes = True

class TrabajadorDetalleResponse(TrabajadorResponse):
    cantidad_reportes: int
    desempeno: Optional[dict] = None

    class Config:
        from_attributes = True