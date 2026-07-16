from pydantic import BaseModel

class ImpedimentoResponse(BaseModel):
    impedimento_id: str
    actividad_id: str | None = None
    codigo_impedimento: str | None = None
    categoria: str | None = None
    descripcion: str | None = None
    latitud: float | None = None
    longitud: float | None = None

    class Config:
        orm_mode = True
