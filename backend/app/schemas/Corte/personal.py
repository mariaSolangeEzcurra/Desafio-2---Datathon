from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date

class RendimientoPersonalItem(BaseModel):
    ccodprs: str
    nombre_trabajador: str
    total_ordenes: int
    ejecutadas: int
    pendientes: int
    tasa_efectividad: float
    deuda_asignada: float
    deuda_recuperada: float

    model_config = ConfigDict(from_attributes=True)

class OrdenCorteDetalleItem(BaseModel):
    id_orden: int
    ccodprg: str
    ccodcnx: str
    dgenprg: Optional[date] = None
    dejecuc: Optional[date] = None
    ntotdeu: float
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    csitreg: Optional[str] = None
    cdesacc: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DetalleTrabajadorResponse(BaseModel):
    ccodprs: str
    nombre_trabajador: str
    total_registros: int
    pagina: int
    limite: int
    ordenes: List[OrdenCorteDetalleItem]