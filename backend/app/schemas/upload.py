from pydantic import BaseModel
from datetime import datetime

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

    class Config:
        from_attributes = True