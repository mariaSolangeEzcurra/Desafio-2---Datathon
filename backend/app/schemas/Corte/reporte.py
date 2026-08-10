from pydantic import BaseModel, ConfigDict
from typing import Optional

class ReporteGeneradoResponse(BaseModel):
    status: str
    message: str
    tipo_reporte: str  # "financiero", "ineficiencia" o "personal"
    nombre_archivo: str
    url_descarga: Optional[str] = None
    total_registros: int
    model_config = ConfigDict(from_attributes=True)