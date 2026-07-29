from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UploadCorteResultResponse(BaseModel):
    status: str
    message: str
    id_carga: int
    registros_insertados: int
    registros_error: int
    total_filas_excel: int

class HistorialCorteCargaResponse(BaseModel):
    id_carga: int
    nombre_archivo: str
    tipo_archivo: str
    fecha_carga: datetime
    proceso: str
    estado: str
    registros_insertados: int
    registros_error: int
    detalle_errores: Optional[str] = None
    usuario_id: Optional[str] = None

    class Config:
        from_attributes = True