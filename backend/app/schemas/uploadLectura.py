from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UploadResultResponse(BaseModel):
    status: str
    message: str
    registros_insertados: int
    total_filas_excel: int

class HistorialCargaResponse(BaseModel):
    id_carga: int
    nombre_archivo: str
    fecha_carga: datetime
    proceso: str
    registros_insertados: int
    usuario_id: Optional[str] = None  

    class Config:
        from_attributes = True