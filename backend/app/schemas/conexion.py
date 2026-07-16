from pydantic import BaseModel

class ConexionResponse(BaseModel):
    codigo_suministro: str
    zona_id: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    direccion_ref: str | None = None
    tipo_conexion: str | None = None
    estado_servicio: str | None = None
    ruta_id: str | None = None

    class Config:
        orm_mode = True
