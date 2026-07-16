from pydantic import BaseModel

class ZonaResponse(BaseModel):
    zona_id: str
    nombre: str | None = None

    class Config:
        orm_mode = True
