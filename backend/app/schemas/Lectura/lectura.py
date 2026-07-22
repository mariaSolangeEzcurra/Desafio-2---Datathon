from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class KPIResponse(BaseModel):
    nombre: str
    valor: float
    unidad: str
    nivel_alerta: str

class KPIListaResponse(BaseModel):
    indicadores: List[KPIResponse]

class KPIFiltro(BaseModel):
    periodo: str = "dia"
    fecha_seleccionada: Optional[date] = None
    grupo_facturacion: Optional[str] = None
    trabajador: Optional[str] = None