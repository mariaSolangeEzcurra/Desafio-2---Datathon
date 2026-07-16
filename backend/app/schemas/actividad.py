from pydantic import BaseModel
from datetime import date, datetime

class ActividadResponse(BaseModel):
    actividad_id: str
    codigo_suministro: str | None = None
    trabajador_id: str | None = None
    tipo_actividad: str | None = None
    fecha: date | None = None
    hora_inicio: datetime | None = None
    hora_fin: datetime | None = None
    duracion_min: float | None = None
    duracion_esperada_min: float | None = None
    estado: str | None = None
    resultado: str | None = None
    gps_trabajador_lat: float | None = None
    gps_trabajador_lon: float | None = None

    class Config:
        orm_mode = True
