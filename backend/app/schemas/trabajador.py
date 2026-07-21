from pydantic import BaseModel
from typing import Optional


# ==========================
# Base
# ==========================
class TrabajadorBase(BaseModel):
    nombre: str
    supervisor: Optional[str] = None


# ==========================
# Crear trabajador
# ==========================
class TrabajadorCreate(TrabajadorBase):
    ccodprs: str


# ==========================
# Actualizar trabajador
# ==========================
class TrabajadorUpdate(BaseModel):
    nombre: Optional[str] = None
    supervisor: Optional[str] = None


# ==========================
# Respuesta
# ==========================
class TrabajadorResponse(TrabajadorBase):
    ccodprs: str

    class Config:
        orm_mode = True