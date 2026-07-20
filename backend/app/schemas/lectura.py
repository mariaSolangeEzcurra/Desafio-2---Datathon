from pydantic import BaseModel

class KPIResponse(BaseModel):
    nombre: str
    valor: float
    unidad: str
    nivel_alerta: str

class KPIFiltro(BaseModel):
    periodo: str = "dia"
    grupo_facturacion: str | None = None
    trabajador: str | None = None