from pydantic import BaseModel


class UploadResultResponse(BaseModel):
    status: str
    message: str
    registros_insertados: int
    total_filas_excel: int


class HistorialCargaResponse(BaseModel):
    id_carga: int
    nombre_archivo: str
    fecha_carga: str
    proceso: str
    registros_insertados: int

    class Config:
        from_attributes = True