from pydantic import BaseModel
from typing import Optional

class CatalogoBase(BaseModel):
    codigo: str
    descripcion: str

class CatalogoCreate(CatalogoBase):
    pass

class CatalogoUpdate(BaseModel):
    descripcion: Optional[str] = None

class GrupoFacturacionCreate(BaseModel):
    cmetfac: str
    ccodmet: Optional[str] = None
    cnommet: str

class GrupoFacturacionUpdate(BaseModel):
    ccodmet: Optional[str] = None
    cnommet: Optional[str] = None