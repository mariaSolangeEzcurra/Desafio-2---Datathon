from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class ActividadResponse(BaseModel):
    actividad_id: str
    
    # Cambiados para ser un espejo exacto de la base de datos
    cCodCnx: str | None = None          # Código de Suministro / Conexión
    cCodPrs: str | None = None          # Código del Trabajador (Personal)
    
    tipo_actividad: str | None = None
    fecha: date | None = None
    hora_inicio: datetime | None = None
    hora_fin: datetime | None = None
    duracion_min: float | None = None
    duracion_esperada_min: float | None = None
    estado: str | None = None
    resultado: str | None = None
    
    # Cambiados también a los nombres nativos de tus columnas GPS en el detalle/actividad
    cGPSLat: float | None = None
    cGPSLon: float | None = None

    class Config:
        # Esto es clave para que Pydantic lea los atributos del modelo de SQLAlchemy tal cual se llaman
        from_attributes = True
        orm_mode = True  # Mantenemos ambos por compatibilidad de versión de Pydantic
        populate_by_name = True

class IngestaLecturaSchema(BaseModel):
    cCodCnx: str                    # Código de Suministro / Conexión
    cNroMdr: str                    # Número de Medidor
    nLecAct: int                    # Lectura Actual
    cImpLec: Optional[str] = "00"   # Impedimento (Ej: '02', '03')
    cObsMdr: Optional[str] = "00"   # Observación de Lectura
    cMetFac: str                    # Grupo de Facturación
    dLectur: datetime               # Fecha y hora de captura
    cGPSAlt: Optional[float] = 0.0
    cGPSLon: Optional[float] = None
    cGPSLat: Optional[float] = None
    Distrito: str                   # Distrito Operacional
    cDeRuLe: str                    # Ruta de Lectura
    cCodPrs: str                    # Código del Trabajador (Lector)
    nombre_trabajador: Optional[str] = "Operador de Campo"

    class Config:
        from_attributes = True
        orm_mode = True