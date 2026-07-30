from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
from enum import Enum

class FormatoExportacion(str, Enum):
    excel = "excel"
    pdf = "pdf"

class ResumenKPIsGlobalResponse(BaseModel):
    total_alertas: int
    total_programadas: int
    total_realizadas: int
    total_impedimentos: int
    total_observaciones: int
    alertas_por_nivel: Dict[str, int]
    alertas_por_kpi: Dict[str, int]
    cumplimiento_promedio_general: float
    desglose_zonas: List[Dict[str, Any]]

    class Config:
        from_attributes = True

class ReporteAlertasEstadoResponse(BaseModel):
    estado: str
    cantidad: int

    class Config:
        from_attributes = True

class ReporteTrabajadorDetalleResponse(BaseModel):
    ccodprs: str
    nombre_trabajador: str
    ruta_asignada: str
    grupo_facturacion: str
    total_alertas_acumuladas: int
    promedio_cumplimiento: float
    estado_general: str

    class Config:
        from_attributes = True