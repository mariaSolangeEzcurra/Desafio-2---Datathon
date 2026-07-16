from pydantic import BaseModel
from datetime import datetime

# Conexiones en el mapa
class MapaConexionResponse(BaseModel):
    codigo_suministro: str
    latitud: float | None = None
    longitud: float | None = None
    estado_servicio: str | None = None
    tipo_conexion: str | None = None

    class Config:
        orm_mode = True


# Actividades en el mapa
class MapaActividadResponse(BaseModel):
    actividad_id: str
    gps_trabajador_lat: float | None = None
    gps_trabajador_lon: float | None = None
    estado: str | None = None
    resultado: str | None = None

    class Config:
        orm_mode = True


# Impedimentos en el mapa
class MapaImpedimentoResponse(BaseModel):
    impedimento_id: str
    latitud: float | None = None
    longitud: float | None = None
    categoria: str | None = None
    descripcion: str | None = None

    class Config:
        orm_mode = True


# Alertas en el mapa
class MapaAlertaResponse(BaseModel):
    alerta_id: str
    zona_id: str | None = None
    trabajador_id: str | None = None
    nivel: str | None = None
    estado_alerta: str | None = None

    class Config:
        orm_mode = True


# Overview general
class MapaOverviewResponse(BaseModel):
    conexiones: int
    actividades: int
    impedimentos: int
    alertas: int
