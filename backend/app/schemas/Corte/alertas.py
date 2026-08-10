from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import date

class DetalleAlerta(BaseModel):
    kpi: str
    descripcion: str
    valor_actual: float
    unidad: str
    nivel_alerta: str  # "VERDE", "AMARILLO", "ROJO"
    mensaje: str
    meta_verde: str
    meta_amarillo: str
    meta_rojo: str

    model_config = ConfigDict(from_attributes=True)

class ResumenAlertasResponse(BaseModel):
    fecha_consulta: date
    periodo_evaluado: str
    total_alertas_rojas: int
    total_alertas_amarillas: int
    total_alertas_verdes: int
    alertas: List[DetalleAlerta]

    model_config = ConfigDict(from_attributes=True)