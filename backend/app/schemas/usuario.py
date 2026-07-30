from typing import Optional
from pydantic import BaseModel, EmailStr

class UsuarioCreate(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str
    estado: str = "Activo"
    password: Optional[str] = None 

class UsuarioUpdate(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str
    estado: str
    password: Optional[str] = None 

class UsuarioResponse(BaseModel):
    id_usuario: str
    nombre: str
    correo: EmailStr
    rol: str
    estado: str
    proveedor: Optional[str] = "local" 
    class Config:
        from_attributes = True