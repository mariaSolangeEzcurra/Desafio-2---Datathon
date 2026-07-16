from pydantic import BaseModel

class TrabajadorResponse(BaseModel):
    trabajador_id: str
    nombre: str | None = None
    rol: str | None = None
    estado: str | None = None

    class Config:
        orm_mode = True
