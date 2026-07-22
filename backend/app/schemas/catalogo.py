from pydantic import BaseModel
from typing import Optional

class CatalogoItemOut(BaseModel):
    codigo: str
    descripcion: str

    class Config:
        from_attributes = True

class GrupoFacturacionOut(BaseModel):
    cmetfac: str
    ccodmet: Optional[str] = None
    cnommet: str

    class Config:
        from_attributes = True