from pydantic import BaseModel, ConfigDict
from typing import Optional

class ReporteGeneradoResponse(BaseModel):
    status: str
    message: str
    tipo_reporte: str  # "financiero" o "ineficiencia"
    nombre_archivo: str
    url_descarga: str | None = None
    total_registros: int