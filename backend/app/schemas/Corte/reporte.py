from pydantic import BaseModel
from typing import Optional

class ReporteGeneradoResponse(BaseModel):
    status: str
    message: str
    tipo_reporte: str  # "financiero" o "ineficiencia"
    nombre_archivo: str
    url_descarga: Optional[str] = None
    total_registros: int